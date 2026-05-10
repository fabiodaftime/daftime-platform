// Supabase client + React Query hooks for the canonical entity inputs.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { EntityLayoutKey } from './schema';
import { setEntityInputsLayout } from './store';

export interface EntityInputRow {
  id: string;
  entity_layout: string;
  company_id: string | null;
  month_id: string;
  inputs: Record<string, number>;
  notes: string | null;
  updated_at: string;
}

const QK = (layout: EntityLayoutKey) => ['entity-inputs', layout] as const;

export async function fetchEntityInputs(
  layout: EntityLayoutKey,
): Promise<EntityInputRow[]> {
  const { data, error } = await supabase
    .from('entity_monthly_inputs')
    .select('*')
    .eq('entity_layout', layout)
    .order('month_id');
  if (error) throw error;
  return (data ?? []) as EntityInputRow[];
}

export function useEntityInputs(layout: EntityLayoutKey) {
  const qc = useQueryClient();
  const query = useQuery<EntityInputRow[]>({
    queryKey: QK(layout),
    queryFn: () => fetchEntityInputs(layout),
    staleTime: 30_000,
  });

  // Mirror to the sync singleton so non-React consumers (e.g. consolidated
  // aggregator) can read the live values without async plumbing.
  useEffect(() => {
    if (!query.data) return;
    const byMonth: Record<string, Record<string, number>> = {};
    for (const r of query.data) byMonth[r.month_id] = r.inputs ?? {};
    setEntityInputsLayout(layout, byMonth);
  }, [layout, query.data]);

  // Realtime: any change → invalidate so all dashboards reflect it instantly.
  useEffect(() => {
    const channel = supabase
      .channel(`entity-inputs-${layout}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entity_monthly_inputs', filter: `entity_layout=eq.${layout}` },
        () => qc.invalidateQueries({ queryKey: QK(layout) }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [layout, qc]);

  return query;
}

export function useEntityInputsByMonth(layout: EntityLayoutKey) {
  const q = useEntityInputs(layout);
  const byMonth: Record<string, EntityInputRow> = {};
  for (const r of q.data ?? []) byMonth[r.month_id] = r;
  return { ...q, byMonth };
}

interface UpsertArgs {
  layout: EntityLayoutKey;
  monthId: string;
  inputs: Record<string, number>;
  companyId?: string | null;
}

export function useUpsertEntityInputs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ layout, monthId, inputs, companyId = null }: UpsertArgs) => {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id ?? null;
      const { data, error } = await supabase
        .from('entity_monthly_inputs')
        .upsert(
          {
            entity_layout: layout,
            company_id: companyId,
            month_id: monthId,
            inputs,
            updated_by: userId,
          },
          { onConflict: 'entity_layout,company_id,month_id' },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: QK(vars.layout) });
    },
  });
}
