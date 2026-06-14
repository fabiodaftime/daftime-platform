// Lecture du contenu texte des fichiers d'un client (CSV/texte + Excel converti en CSV).
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

export async function readClientFiles(
  admin: SupabaseClient,
  files: Array<{ storage_path?: string | null; original_name?: string | null; id?: string }>,
): Promise<{ name: string; content: string }[]> {
  const docs: { name: string; content: string }[] = [];
  for (const f of files ?? []) {
    if (!f.storage_path) continue;
    const { data: blob } = await admin.storage.from("client-files").download(f.storage_path);
    if (!blob) continue;
    const name = String(f.original_name ?? f.id ?? "fichier");
    const lower = name.toLowerCase();
    let content = "";
    try {
      if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        const buf = new Uint8Array(await blob.arrayBuffer());
        const wb = XLSX.read(buf, { type: "array" });
        content = wb.SheetNames
          .map((sn) => `# Feuille: ${sn}\n${XLSX.utils.sheet_to_csv(wb.Sheets[sn])}`)
          .join("\n\n");
      } else if (/\.(csv|tsv|txt|md|json)$/.test(lower)) {
        content = await blob.text();
      } else {
        content = "(format non pris en charge — fournir un CSV, un Excel ou du texte)";
      }
    } catch (e) {
      content = `(erreur de lecture: ${e instanceof Error ? e.message : String(e)})`;
    }
    docs.push({ name, content: content.slice(0, 50_000) });
  }
  return docs;
}
