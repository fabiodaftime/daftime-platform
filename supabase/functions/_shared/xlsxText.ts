// Excel → CSV NORMALISÉ pour les parsers déterministes :
//  - dates en ISO (YYYY-MM-DD[ HH:MM]) recalculées depuis le numéro de série Excel → indépendant du
//    fuseau horaire (un objet Date transformait le 27/05 en 26/05 selon le TZ de la machine) ;
//  - nombres BRUTS (pas « -273,55 € » ni « 1 234,56 ») ;
//  - classeur mono-feuille → CSV direct (l'en-tête reste en 1re ligne, sinon aucun parser ne reconnaît
//    le fichier) ; multi-feuilles → blocs « # Feuille: X ».
// La bibliothèque SheetJS est INJECTÉE (esm.sh côté edge, npm côté banc de test) : module pur.

// deno-lint-ignore no-explicit-any
type XLSXLib = any;

// Chemin du CSV « préparé » d'un Excel, dans le dossier du client (policies storage : 1er dossier =
// id client). Lié à l'id ET à la date de mise à jour du fichier → jamais de CSV périmé après ré-upload.
// Partagé front (conversion navigateur, CPU illimité) / edge (lecture rapide).
export function derivedCsvPath(f: { id: string; storage_path?: string | null; updated_at?: string | null }): string | null {
  const client = (f.storage_path ?? "").split("/")[0];
  if (!client) return null;
  const v = Date.parse(f.updated_at ?? "") || 0;
  return `${client}/_derived/${f.id}-${v}.csv`;
}
export const isExcelName = (name: string | null | undefined) => /\.xlsx?$/i.test(String(name ?? ""));

export function workbookToText(XLSX: XLSXLib, buf: Uint8Array): string {
  const wb = XLSX.read(buf, { type: "array", cellNF: true, cellText: false, cellFormula: false, cellHTML: false, cellStyles: false });
  const esc = (s: string) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const pad = (n: number) => String(n).padStart(2, "0");
  // deno-lint-ignore no-explicit-any
  const cellText = (c: any): string => {
    if (!c) return "";
    if (c.t === "n" && c.z && XLSX.SSF.is_date(c.z)) {
      const d = XLSX.SSF.parse_date_code(c.v);
      if (d) return `${d.y}-${pad(d.m)}-${pad(d.d)}${d.H || d.M ? ` ${pad(d.H)}:${pad(d.M)}` : ""}`;
    }
    if (c.t === "d" && c.v instanceof Date) return c.v.toISOString().slice(0, 10);
    if (c.t === "n") return String(Math.round(c.v * 1e6) / 1e6);
    if (c.t === "b") return c.v ? "true" : "false";
    return c.v == null ? "" : String(c.v);
  };
  const sheets: { name: string; csv: string }[] = [];
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws || !ws["!ref"]) continue;
    const rg = XLSX.utils.decode_range(ws["!ref"]);
    const lines: string[] = [];
    for (let r = rg.s.r; r <= rg.e.r; r++) {
      const row: string[] = [];
      for (let c = rg.s.c; c <= rg.e.c; c++) row.push(esc(cellText(ws[XLSX.utils.encode_cell({ r, c })])));
      if (row.some((x) => x !== "")) lines.push(row.join(","));
    }
    if (lines.length) sheets.push({ name, csv: lines.join("\n") });
  }
  if (sheets.length <= 1) return sheets[0]?.csv ?? "";
  return sheets.map((s) => `# Feuille: ${s.name}\n${s.csv}`).join("\n\n");
}
