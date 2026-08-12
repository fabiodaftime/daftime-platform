// Insère une nouvelle version "courante" dans une table versionnée
// (contexts / standardized_data / dashboards), en basculant l'ancienne is_current=false
// et en incrémentant le numéro de version, pour une clé logique donnée.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type KeyCols = Record<string, string | null>;

function applyKey<T>(query: T, key: KeyCols): T {
  let q = query as unknown as {
    eq: (k: string, v: unknown) => unknown;
    is: (k: string, v: null) => unknown;
  };
  for (const [k, v] of Object.entries(key)) {
    q = (v === null ? q.is(k, null) : q.eq(k, v)) as typeof q;
  }
  return q as unknown as T;
}

export async function insertVersion(
  admin: SupabaseClient,
  table: string,
  key: KeyCols,
  row: Record<string, unknown>,
  opts?: {
    // Garde-fou anti-régression : si la nouvelle version est PLUS PAUVRE que la courante,
    // on l'enregistre quand même (traçabilité) mais SANS la rendre courante — l'ancienne reste en place.
    demoteIfPoorer?: (candidate: Record<string, unknown>, current: Record<string, unknown>) => boolean;
  },
): Promise<Record<string, unknown> & { _demoted?: boolean }> {
  // 0) éventuel garde-fou : on lit la version courante et on compare la richesse.
  let demote = false;
  if (opts?.demoteIfPoorer) {
    const { data: cur } = await applyKey(
      admin.from(table).select("*").eq("is_current", true).limit(1),
      key,
    ).maybeSingle();
    if (cur) demote = opts.demoteIfPoorer(row, cur as Record<string, unknown>);
  }

  // 1) l'ancienne version courante ne l'est plus — SAUF si la nouvelle est démote (plus pauvre).
  if (!demote) await applyKey(admin.from(table).update({ is_current: false }), key).eq("is_current", true);

  // 2) prochaine version
  const { data: last } = await applyKey(
    admin.from(table).select("version").order("version", { ascending: false }).limit(1),
    key,
  ).maybeSingle();
  const version = ((last as { version?: number } | null)?.version ?? 0) + 1;

  // 3) insertion (courante seulement si non démote)
  const { data, error } = await admin
    .from(table)
    .insert({ ...row, ...key, version, is_current: !demote })
    .select()
    .single();
  if (error) throw error;
  return { ...(data as Record<string, unknown>), _demoted: demote };
}

// Richesse d'une ligne standardized_data : « plus pauvre » = perd des breakdowns (même période/docs
// → régression) ou perd toutes ses sections. Sert de garde-fou anti-écrasement.
export function poorerStandardized(cand: Record<string, unknown>, cur: Record<string, unknown>): boolean {
  const nb = (r: Record<string, unknown>) => Object.keys(((r?.data as { breakdowns?: object })?.breakdowns) ?? {}).length;
  const ns = (r: Record<string, unknown>) => (((r?.data as { sections?: unknown[] })?.sections) ?? []).length;
  if (nb(cand) < nb(cur)) return true;                 // perd des breakdowns
  if (nb(cur) > 0 && nb(cand) === 0) return true;      // en avait, plus aucun
  if (ns(cur) > 0 && ns(cand) === 0) return true;      // perd toutes les sections
  return false;
}
