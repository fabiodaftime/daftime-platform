// Client Supabase pour la configuration PCGroup.
// Lit les 6 tables et les mutations CRUD.

import { supabase } from '@/integrations/supabase/client';
import type {
  PCGroupConfig,
  PCGEntityRow,
  PCGMonthRow,
  PCGRuleRow,
  PCGManualFactRow,
  PCGHoldingFactRow,
  PCGIntercosCashRow,
} from './types';

export async function fetchPCGroupConfig(): Promise<PCGroupConfig> {
  const [entities, months, rules, manualFacts, holdingFacts, intercosCash] = await Promise.all([
    supabase.from('pcgroup_entities').select('*').order('display_order'),
    supabase.from('pcgroup_months').select('*').order('display_order'),
    supabase.from('pcgroup_rules').select('*'),
    supabase.from('pcgroup_manual_facts').select('*'),
    supabase.from('pcgroup_holding_facts').select('*'),
    supabase.from('pcgroup_intercos_cash').select('*'),
  ]);

  // En cas d'erreur, on remonte une exception pour que React Query gère le retry.
  for (const r of [entities, months, rules, manualFacts, holdingFacts, intercosCash]) {
    if (r.error) throw r.error;
  }

  return {
    entities: (entities.data ?? []) as PCGEntityRow[],
    months: (months.data ?? []) as PCGMonthRow[],
    rules: (rules.data ?? []) as PCGRuleRow[],
    manualFacts: (manualFacts.data ?? []) as PCGManualFactRow[],
    holdingFacts: (holdingFacts.data ?? []).map((h: any) => ({
      ...h,
      frais_detail: Array.isArray(h.frais_detail) ? h.frais_detail : [],
    })) as PCGHoldingFactRow[],
    intercosCash: (intercosCash.data ?? []) as PCGIntercosCashRow[],
  };
}

// ---------- Mutations entités ----------
export async function upsertEntity(row: Partial<PCGEntityRow> & { code: string }) {
  const { error } = await supabase
    .from('pcgroup_entities')
    .upsert(row as any, { onConflict: 'code' });
  if (error) throw error;
}
export async function deleteEntity(id: string) {
  const { error } = await supabase.from('pcgroup_entities').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Mutations mois ----------
export async function upsertMonth(row: Partial<PCGMonthRow> & { month_id: string }) {
  const { error } = await supabase
    .from('pcgroup_months')
    .upsert(row as any, { onConflict: 'month_id' });
  if (error) throw error;
}
export async function deleteMonth(id: string) {
  const { error } = await supabase.from('pcgroup_months').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Mutations règles ----------
export async function upsertRule(row: Partial<PCGRuleRow> & { month_id: string }) {
  const { error } = await supabase
    .from('pcgroup_rules')
    .upsert(row as any, { onConflict: 'month_id' });
  if (error) throw error;
}

// ---------- Mutations manual facts ----------
export async function upsertManualFact(row: Partial<PCGManualFactRow> & { month_id: string; entity_code: string }) {
  const { error } = await supabase
    .from('pcgroup_manual_facts')
    .upsert(row as any, { onConflict: 'month_id,entity_code' });
  if (error) throw error;
}
export async function deleteManualFact(id: string) {
  const { error } = await supabase.from('pcgroup_manual_facts').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Mutations holding ----------
export async function upsertHoldingFact(row: Partial<PCGHoldingFactRow> & { month_id: string }) {
  const { error } = await supabase
    .from('pcgroup_holding_facts')
    .upsert(row as any, { onConflict: 'month_id' });
  if (error) throw error;
}

// ---------- Mutations intercos cash ----------
async function getActor() {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return { id: null as string | null, name: null as string | null };
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name,email')
    .eq('id', user.id)
    .maybeSingle();
  return {
    id: user.id,
    name: profile?.full_name || profile?.email || user.email || null,
  };
}

async function logIntercoCashAudit(params: {
  month_id: string;
  entity_code: string;
  action: 'create' | 'update' | 'delete';
  old_amount: number | null;
  new_amount: number | null;
  note?: string | null;
}) {
  const actor = await getActor();
  await supabase.from('pcgroup_intercos_cash_audit').insert({
    month_id: params.month_id,
    entity_code: params.entity_code,
    action: params.action,
    old_amount: params.old_amount,
    new_amount: params.new_amount,
    actor_id: actor.id,
    actor_name: actor.name,
    note: params.note ?? null,
  } as any);
}

export async function upsertIntercoCash(row: Partial<PCGIntercosCashRow> & { month_id: string; entity_code: string }) {
  // Lit la valeur précédente pour le journal d'audit
  const { data: existing } = await supabase
    .from('pcgroup_intercos_cash')
    .select('id, amount_received')
    .eq('month_id', row.month_id)
    .eq('entity_code', row.entity_code)
    .maybeSingle();

  const { error } = await supabase
    .from('pcgroup_intercos_cash')
    .upsert(row as any, { onConflict: 'month_id,entity_code' });
  if (error) throw error;

  await logIntercoCashAudit({
    month_id: row.month_id,
    entity_code: row.entity_code,
    action: existing ? 'update' : 'create',
    old_amount: existing ? Number(existing.amount_received ?? 0) : null,
    new_amount: row.amount_received != null ? Number(row.amount_received) : null,
  });
}

export async function deleteIntercoCash(id: string) {
  const { data: existing } = await supabase
    .from('pcgroup_intercos_cash')
    .select('month_id, entity_code, amount_received')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase.from('pcgroup_intercos_cash').delete().eq('id', id);
  if (error) throw error;

  if (existing) {
    await logIntercoCashAudit({
      month_id: existing.month_id,
      entity_code: existing.entity_code,
      action: 'delete',
      old_amount: Number(existing.amount_received ?? 0),
      new_amount: null,
    });
  }
}

export async function fetchIntercoCashAudit(filters?: {
  month_id?: string;
  entity_code?: string;
  limit?: number;
}) {
  let q = supabase
    .from('pcgroup_intercos_cash_audit')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(filters?.limit ?? 200);
  if (filters?.month_id) q = q.eq('month_id', filters.month_id);
  if (filters?.entity_code) q = q.eq('entity_code', filters.entity_code);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
