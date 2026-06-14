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
): Promise<Record<string, unknown>> {
  // 1) l'ancienne version courante ne l'est plus
  await applyKey(admin.from(table).update({ is_current: false }), key).eq("is_current", true);

  // 2) prochaine version
  const { data: last } = await applyKey(
    admin.from(table).select("version").order("version", { ascending: false }).limit(1),
    key,
  ).maybeSingle();
  const version = ((last as { version?: number } | null)?.version ?? 0) + 1;

  // 3) insertion de la nouvelle version courante
  const { data, error } = await admin
    .from(table)
    .insert({ ...row, ...key, version, is_current: true })
    .select()
    .single();
  if (error) throw error;
  return data as Record<string, unknown>;
}
