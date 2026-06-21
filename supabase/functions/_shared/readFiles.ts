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

const TEXT_CAP = 40_000;                 // caractères max par fichier texte/Excel
const PDF_MAX = 15 * 1024 * 1024;        // 15 Mo
const IMG_MAX = 5 * 1024 * 1024;         // 5 Mo
const IMG_TYPES: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
};

export async function readClientFiles(
  admin: SupabaseClient,
  files: Array<{ storage_path?: string | null; original_name?: string | null; id?: string }>,
): Promise<FileItem[]> {
  const out: FileItem[] = [];
  for (const f of files ?? []) {
    if (!f.storage_path) continue;
    const { data: blob } = await admin.storage.from("client-files").download(f.storage_path);
    if (!blob) continue;
    const name = String(f.original_name ?? f.id ?? "fichier");
    const lower = name.toLowerCase();
    const ext = lower.slice(lower.lastIndexOf("."));
    try {
      if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        const buf = new Uint8Array(await blob.arrayBuffer());
        const wb = XLSX.read(buf, { type: "array" });
        const content = wb.SheetNames
          .map((sn) => `# Feuille: ${sn}\n${XLSX.utils.sheet_to_csv(wb.Sheets[sn])}`)
          .join("\n\n");
        out.push({ kind: "text", name, content: content.slice(0, TEXT_CAP) });
      } else if (/\.(csv|tsv|txt|md|json)$/.test(lower)) {
        out.push({ kind: "text", name, content: (await blob.text()).slice(0, TEXT_CAP) });
      } else if (lower.endsWith(".pdf")) {
        const buf = new Uint8Array(await blob.arrayBuffer());
        if (buf.byteLength > PDF_MAX) {
          out.push({ kind: "skipped", name, reason: `PDF trop volumineux (${(buf.byteLength / 1e6).toFixed(1)} Mo > 15 Mo)` });
        } else {
          out.push({ kind: "pdf", name, base64: encodeBase64(buf) });
        }
      } else if (IMG_TYPES[ext]) {
        const buf = new Uint8Array(await blob.arrayBuffer());
        if (buf.byteLength > IMG_MAX) {
          out.push({ kind: "skipped", name, reason: `image trop volumineuse (${(buf.byteLength / 1e6).toFixed(1)} Mo > 5 Mo)` });
        } else {
          out.push({ kind: "image", name, base64: encodeBase64(buf), mediaType: IMG_TYPES[ext] });
        }
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
      blocks.push({ type: "text", text: `### ${it.name}\n${it.content}` });
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
