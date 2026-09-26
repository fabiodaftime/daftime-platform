// Orchestration front de la standardisation.
// - Les Excel sont convertis ICI (navigateur, CPU illimité) en CSV normalisé, déposé à côté du fichier :
//   l'edge runtime n'a que ~2 s de CPU et un gros Excel en consomme à lui seul ~1 s.
// - Le serveur traite les fichiers PAR LOTS : on relance tant qu'il répond { partial: true }.
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { invokeFn } from '@/lib/genericApi';
import { derivedCsvPath, isExcelName, workbookToText } from '../../supabase/functions/_shared/xlsxText';

const BUCKET = 'client-files';
type FileRow = { id: string; original_name: string | null; storage_path: string | null; updated_at: string | null };

export async function prepareExcelFiles(files: FileRow[]): Promise<number> {
  let n = 0;
  for (const f of files.filter((x) => isExcelName(x.original_name) && x.storage_path)) {
    const dp = derivedCsvPath(f);
    if (!dp) continue;
    const folder = dp.slice(0, dp.lastIndexOf('/')), base = dp.slice(dp.lastIndexOf('/') + 1);
    const { data: existing } = await supabase.storage.from(BUCKET).list(folder, { search: base, limit: 1 });
    if (existing?.some((o) => o.name === base)) continue;
    const { data: blob, error } = await supabase.storage.from(BUCKET).download(f.storage_path!);
    if (error || !blob) throw new Error(`Téléchargement impossible : ${f.original_name}`);
    const text = workbookToText(XLSX, new Uint8Array(await blob.arrayBuffer()));
    const up = await supabase.storage.from(BUCKET).upload(dp, new Blob([text], { type: 'text/csv' }), { upsert: true, contentType: 'text/csv' });
    if (up.error) throw up.error;
    n++;
  }
  return n;
}

export type StdProgress = { done: number; total: number; step: string };

export async function runStandardize(
  clientId: string, period: string,
  opts: { filesPeriod?: string; onProgress?: (p: StdProgress) => void } = {},
): Promise<{ demoted?: boolean; warning?: string }> {
  const filesPeriod = opts.filesPeriod ?? period;
  const { data: rows } = await supabase.from('files' as any).select('id, original_name, storage_path, updated_at').eq('client_id', clientId).eq('period', filesPeriod);
  const files = ((rows as any[]) ?? []) as FileRow[];
  if (files.some((f) => isExcelName(f.original_name))) {
    opts.onProgress?.({ done: 0, total: files.length, step: 'Préparation des fichiers Excel' });
    await prepareExcelFiles(files);
  }
  const prepared = new Set<string>();
  for (let i = 0; i < 60; i++) {
    const res = await invokeFn<any>('standardize-data', { client_id: clientId, period, files_period: filesPeriod });
    if (!res?.partial) return res ?? {};
    opts.onProgress?.({ done: res.done ?? 0, total: res.total ?? files.length, step: 'Lecture des fichiers' });
    const need = ((res.needs_preparation ?? []) as { id: string; name: string }[]).filter((x) => !prepared.has(x.id));
    if (need.length) {
      await prepareExcelFiles(files.filter((f) => need.some((x) => x.id === f.id)));
      need.forEach((x) => prepared.add(x.id));
    } else if ((res.needs_preparation ?? []).length && !(res.pending ?? []).length) {
      throw new Error(`Conversion Excel impossible : ${(res.needs_preparation as { name: string }[]).map((x) => x.name).join(', ')}`);
    }
  }
  throw new Error('Standardisation interrompue : trop de passages (réessaie, le travail déjà fait est conservé).');
}

// Mois couverts par les exports déposés (plages « AAAA-MM-JJ - AAAA-MM-JJ » ou « AAAAMMJJ-AAAAMMJJ » du nom).
export function coveredMonths(names: (string | null | undefined)[]): string[] {
  let from = '', to = '';
  for (const n of names) {
    const s = String(n ?? '');
    const m = s.match(/(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})/) ?? s.match(/(\d{4})(\d{2})(\d{2})\s*-\s*(\d{4})(\d{2})(\d{2})/);
    if (!m) continue;
    const a = m.length > 3 ? `${m[1]}-${m[2]}` : m[1].slice(0, 7), b = m.length > 3 ? `${m[4]}-${m[5]}` : m[2].slice(0, 7);
    if (!from || a < from) from = a; if (!to || b > to) to = b;
  }
  if (!from || !to || from === to) return from ? [`${from}-01`] : [];
  const out: string[] = []; let [y, mo] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  while ((y < ty || (y === ty && mo <= tm)) && out.length < 36) { out.push(`${y}-${String(mo).padStart(2, '0')}-01`); mo++; if (mo > 12) { mo = 1; y++; } }
  return out;
}
