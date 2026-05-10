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
export async function upsertIntercoCash(row: Partial<PCGIntercosCashRow> & { month_id: string; entity_code: string }) {
  const { error } = await supabase
    .from('pcgroup_intercos_cash')
    .upsert(row as any, { onConflict: 'month_id,entity_code' });
  if (error) throw error;
}
export async function deleteIntercoCash(id: string) {
  const { error } = await supabase.from('pcgroup_intercos_cash').delete().eq('id', id);
  if (error) throw error;
}
