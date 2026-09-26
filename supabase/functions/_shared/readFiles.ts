// Lecture des fichiers d'un client pour le pipeline IA.
// - Excel            -> CSV NORMALISÉ (dates ISO, nombres bruts) : lu depuis le CSV « préparé » par le
//                       navigateur quand il existe (la conversion Excel coûte ~1 s de CPU à l'edge).
// - CSV / texte      -> texte.
// - PDF / image      -> base64, passé NATIVEMENT à Claude (relevés, factures, captures…).
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";
import { derivedCsvPath, isExcelName, workbookToText } from "./xlsxText.ts";

export type FileItem =
  | { kind: "text"; name: string; content: string }
  | { kind: "pdf"; name: string; base64: string }
  | { kind: "image"; name: string; base64: string; mediaType: string }
  | { kind: "skipped"; name: string; reason: string };

// Le PARSING déterministe reçoit le fichier ENTIER (sinon CA/commandes sous-comptés en silence).
// Seul le payload envoyé au LLM est plafonné (tokens) — avec un marqueur explicite de troncature.
const PARSE_CAP = 20_000_000;            // garde-fou (~20 Mo de texte) : la lecture est désormais fichier par fichier
const LLM_TEXT_CAP = 40_000;             // caractères max par fichier DANS le payload LLM uniquement
const PDF_MAX = 15 * 1024 * 1024;        // 15 Mo
const IMG_MAX = 5 * 1024 * 1024;         // 5 Mo
const TEXT_MAX = 30 * 1024 * 1024;       // garde-fou absolu par fichier texte
const XLSX_EDGE_MAX = 1024 * 1024;       // au-delà, conversion Excel réservée au navigateur (CPU edge ~2 s)
const IMG_TYPES: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
};
const mb = (n: number) => (n / 1e6).toFixed(1);
// Ligne présente en base mais objet absent du stockage : à redéposer. Jamais mis en cache (le fichier
// peut réapparaître), et signalé explicitement au lieu d'être ignoré en silence.
export const MISSING_CONTENT = "contenu introuvable dans le stockage — redépose le fichier";

export type FileRow = { id?: string; storage_path?: string | null; original_name?: string | null; updated_at?: string | null };
// "prepare" : Excel sans CSV préparé et trop lourd pour l'edge → le navigateur doit le convertir.
// "defer"   : Excel à convertir côté edge, mais pas en milieu de lot (budget CPU) → au prochain passage.
export type ReadResult = { item: FileItem; cpuMs: number } | { kind: "prepare" | "defer"; name: string; reason: string };

export async function readOneFile(admin: SupabaseClient, f: FileRow, opts: { allowEdgeXlsx?: boolean } = {}): Promise<ReadResult> {
  const name = String(f.original_name ?? f.id ?? "fichier");
  if (!f.storage_path) return { item: { kind: "skipped", name, reason: "fichier sans contenu stocké" }, cpuMs: 0 };
  const lower = name.toLowerCase();
  const ext = lower.slice(lower.lastIndexOf("."));
  const bucket = admin.storage.from("client-files");
  try {
    if (isExcelName(name)) {
      const dp = f.id ? derivedCsvPath({ id: f.id, storage_path: f.storage_path, updated_at: f.updated_at }) : null;
      if (dp) {
        const { data: d } = await bucket.download(dp);
        if (d) { const t0 = performance.now(); const content = (await d.text()).slice(0, PARSE_CAP); return { item: { kind: "text", name, content }, cpuMs: performance.now() - t0 }; }
      }
      const { data: blob } = await bucket.download(f.storage_path);
      if (!blob) return { item: { kind: "skipped", name, reason: MISSING_CONTENT }, cpuMs: 0 };
      if ((blob.size ?? 0) > XLSX_EDGE_MAX) return { kind: "prepare", name, reason: `Excel de ${mb(blob.size)} Mo : conversion à faire dans le navigateur` };
      if (!opts.allowEdgeXlsx) return { kind: "defer", name, reason: "conversion Excel au prochain passage" };
      const t0 = performance.now();
      const content = workbookToText(XLSX, new Uint8Array(await blob.arrayBuffer())).slice(0, PARSE_CAP);
      const cpuMs = performance.now() - t0;
      if (dp) await bucket.upload(dp, new Blob([content], { type: "text/csv" }), { upsert: true, contentType: "text/csv" }).catch(() => null);
      return { item: { kind: "text", name, content }, cpuMs };
    }
    const { data: blob } = await bucket.download(f.storage_path);
    if (!blob) return { item: { kind: "skipped", name, reason: MISSING_CONTENT }, cpuMs: 0 };
    const size = blob.size ?? 0;
    const t0 = performance.now();
    if (/\.(csv|tsv|txt|md|json)$/.test(lower)) {
      if (size > TEXT_MAX) return { item: { kind: "skipped", name, reason: `fichier trop volumineux (${mb(size)} Mo)` }, cpuMs: 0 };
      const content = (await blob.text()).slice(0, PARSE_CAP);
      return { item: { kind: "text", name, content }, cpuMs: performance.now() - t0 };
    }
    if (lower.endsWith(".pdf")) {
      if (size > PDF_MAX) return { item: { kind: "skipped", name, reason: `PDF trop volumineux (${mb(size)} Mo > 15 Mo)` }, cpuMs: 0 };
      const b64 = encodeBase64(new Uint8Array(await blob.arrayBuffer()));
      return { item: { kind: "pdf", name, base64: b64 }, cpuMs: performance.now() - t0 };
    }
    if (IMG_TYPES[ext]) {
      if (size > IMG_MAX) return { item: { kind: "skipped", name, reason: `image trop volumineuse (${mb(size)} Mo > 5 Mo)` }, cpuMs: 0 };
      const b64 = encodeBase64(new Uint8Array(await blob.arrayBuffer()));
      return { item: { kind: "image", name, base64: b64, mediaType: IMG_TYPES[ext] }, cpuMs: performance.now() - t0 };
    }
    return { item: { kind: "skipped", name, reason: "format non pris en charge (PDF, Excel, CSV, image ou texte)" }, cpuMs: 0 };
  } catch (e) {
    return { item: { kind: "skipped", name, reason: `erreur de lecture: ${e instanceof Error ? e.message : String(e)}` }, cpuMs: 0 };
  }
}

// Lecture en lot (chat, chemin générique). Garde-fous : nombre de fichiers et volume retenu bornés.
const MAX_FILES = 20;
const TOTAL_BUDGET = 8 * 1024 * 1024;
export async function readClientFiles(admin: SupabaseClient, files: FileRow[]): Promise<FileItem[]> {
  const out: FileItem[] = [];
  let kept = 0, n = 0;
  for (const f of files ?? []) {
    const name = String(f.original_name ?? f.id ?? "fichier");
    if (n >= MAX_FILES || kept >= TOTAL_BUDGET) { out.push({ kind: "skipped", name, reason: "trop de fichiers / volume pour un seul passage" }); continue; }
    const r = await readOneFile(admin, f, { allowEdgeXlsx: n === 0 });
    if ("kind" in r) { out.push({ kind: "skipped", name, reason: r.reason }); continue; }
    out.push(r.item); n++;
    kept += r.item.kind === "text" ? r.item.content.length : r.item.kind === "skipped" ? 0 : r.item.base64.length;
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
