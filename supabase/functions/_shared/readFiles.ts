// Lecture des fichiers d'un client pour le pipeline IA.
// - Excel / CSV / texte  -> converti en texte (CSV pour Excel).
// - PDF / image          -> renvoyé en base64 pour être passé NATIVEMENT à Claude
//   (Claude lit les PDF — texte ET scannés — et les images : relevés, factures, FEC…).
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

export type FileItem =
  | { kind: "text"; name: string; content: string }
  | { kind: "pdf"; name: string; base64: string }
  | { kind: "image"; name: string; base64: string; mediaType: string }
  | { kind: "skipped"; name: string; reason: string };

// Le PARSING déterministe reçoit le fichier ENTIER (sinon CA/commandes sous-comptés en silence).
// Seul le payload envoyé au LLM est plafonné (tokens) — avec un marqueur explicite de troncature.
const PARSE_CAP = 8_000_000;             // garde-fou mémoire (~8 Mo) — au-delà, rarissime, on signale
const LLM_TEXT_CAP = 40_000;             // caractères max par fichier DANS le payload LLM uniquement
const PDF_MAX = 15 * 1024 * 1024;        // 15 Mo
const IMG_MAX = 5 * 1024 * 1024;         // 5 Mo
// Garde-fous MÉMOIRE (l'edge runtime plafonne à ~256 Mo, tout le contenu est retenu simultanément).
// Un export texte > 2 Mo est presque toujours un détail ligne-à-ligne dont les TOTAUX existent dans un
// rapport agrégé/mensuel plus léger : on l'ignore-avec-message plutôt que de faire planter tout le lot.
const TEXT_MAX = 2 * 1024 * 1024;        // 2 Mo par fichier texte/CSV
const XLSX_MAX = 2 * 1024 * 1024;        // 2 Mo par Excel (la décompression est très gourmande)
const TOTAL_BUDGET = 16 * 1024 * 1024;   // budget de contenu RETENU pour l'ensemble du lot
const mb = (n: number) => (n / 1e6).toFixed(1);
const IMG_TYPES: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
};

export async function readClientFiles(
  admin: SupabaseClient,
  files: Array<{ storage_path?: string | null; original_name?: string | null; id?: string }>,
): Promise<FileItem[]> {
  const out: FileItem[] = [];
  let kept = 0; // octets de contenu déjà RETENU (budget mémoire du lot)
  for (const f of files ?? []) {
    if (!f.storage_path) continue;
    const { data: blob } = await admin.storage.from("client-files").download(f.storage_path);
    if (!blob) continue;
    const name = String(f.original_name ?? f.id ?? "fichier");
    const lower = name.toLowerCase();
    const ext = lower.slice(lower.lastIndexOf("."));
    const size = blob.size ?? 0;
    const overBudget = kept >= TOTAL_BUDGET;
    try {
      if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        if (size > XLSX_MAX) { out.push({ kind: "skipped", name, reason: `Excel trop volumineux (${mb(size)} Mo > 2 Mo) — ré-exporte-le en CSV` }); continue; }
        if (overBudget) { out.push({ kind: "skipped", name, reason: `budget mémoire du lot atteint (${mb(TOTAL_BUDGET)} Mo) — retire des fichiers ou standardise en plusieurs fois` }); continue; }
        const buf = new Uint8Array(await blob.arrayBuffer());
        const wb = XLSX.read(buf, { type: "array" });
        const content = wb.SheetNames
          .map((sn) => `# Feuille: ${sn}\n${XLSX.utils.sheet_to_csv(wb.Sheets[sn])}`)
          .join("\n\n").slice(0, PARSE_CAP);
        out.push({ kind: "text", name, content });
        kept += content.length;
      } else if (/\.(csv|tsv|txt|md|json)$/.test(lower)) {
        if (size > TEXT_MAX) { out.push({ kind: "skipped", name, reason: `fichier trop volumineux (${mb(size)} Mo > 2 Mo) — fournis un export agrégé/mensuel plus léger (les totaux y sont)` }); continue; }
        if (overBudget) { out.push({ kind: "skipped", name, reason: `budget mémoire du lot atteint (${mb(TOTAL_BUDGET)} Mo) — retire des fichiers ou standardise en plusieurs fois` }); continue; }
        const content = (await blob.text()).slice(0, PARSE_CAP);
        out.push({ kind: "text", name, content });
        kept += content.length;
      } else if (lower.endsWith(".pdf")) {
        if (size > PDF_MAX) { out.push({ kind: "skipped", name, reason: `PDF trop volumineux (${mb(size)} Mo > 15 Mo)` }); continue; }
        if (overBudget) { out.push({ kind: "skipped", name, reason: `budget mémoire du lot atteint (${mb(TOTAL_BUDGET)} Mo) — retire des fichiers ou standardise en plusieurs fois` }); continue; }
        const buf = new Uint8Array(await blob.arrayBuffer());
        const b64 = encodeBase64(buf);
        out.push({ kind: "pdf", name, base64: b64 });
        kept += b64.length;
      } else if (IMG_TYPES[ext]) {
        if (size > IMG_MAX) { out.push({ kind: "skipped", name, reason: `image trop volumineuse (${mb(size)} Mo > 5 Mo)` }); continue; }
        if (overBudget) { out.push({ kind: "skipped", name, reason: `budget mémoire du lot atteint (${mb(TOTAL_BUDGET)} Mo) — retire des fichiers ou standardise en plusieurs fois` }); continue; }
        const buf = new Uint8Array(await blob.arrayBuffer());
        const b64 = encodeBase64(buf);
        out.push({ kind: "image", name, base64: b64, mediaType: IMG_TYPES[ext] });
        kept += b64.length;
      } else {
        out.push({ kind: "skipped", name, reason: "format non pris en charge (PDF, Excel, CSV, image ou texte)" });
      }
    } catch (e) {
      out.push({ kind: "skipped", name, reason: `erreur de lecture: ${e instanceof Error ? e.message : String(e)}` });
    }
  }
  return out;
}

// Construit les blocs de contenu Anthropic (multimodal) à partir des fichiers lus.
export function filesToContentBlocks(items: FileItem[]): unknown[] {
  const blocks: unknown[] = [];
  for (const it of items) {
    if (it.kind === "text") {
      // Plafond LLM uniquement (les totaux exacts sont calculés à part sur le fichier complet).
      const text = it.content.length > LLM_TEXT_CAP
        ? it.content.slice(0, LLM_TEXT_CAP) + `\n[… fichier tronqué pour l'analyse IA : ${LLM_TEXT_CAP} caractères sur ${it.content.length} affichés. NE déduis AUCUN total depuis cet extrait — les montants exacts sont calculés par le moteur sur le fichier entier.]`
        : it.content;
      blocks.push({ type: "text", text: `### ${it.name}\n${text}` });
    } else if (it.kind === "pdf") {
      blocks.push({ type: "text", text: `### ${it.name} (PDF ci-dessous) :` });
      blocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: it.base64 } });
    } else if (it.kind === "image") {
      blocks.push({ type: "text", text: `### ${it.name} (image ci-dessous) :` });
      blocks.push({ type: "image", source: { type: "base64", media_type: it.mediaType, data: it.base64 } });
    } else {
      blocks.push({ type: "text", text: `### ${it.name} — ignoré : ${it.reason}` });
    }
  }
  return blocks;
}
