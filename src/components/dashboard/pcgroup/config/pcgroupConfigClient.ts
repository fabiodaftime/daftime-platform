// Client Supabase pour la configuration PCGroup.
// Lit les 6 tables et les mutations CRUD.

import { supabase } from '@/integrations/supabase/client';
import { setPCGroupConfig } from './configStore';
import type {
  PCGroupConfig,
  PCGEntityRow,
  PCGMonthRow,
  PCGRuleRow,
  PCGManualFactRow,
  PCGHoldingFactRow,
  PCGIntercosCashRow,
} from './types';

/** Recharge la config et hydrate le store → recalcule automatiquement
 *  les soldes restants partout dans le dashboard. */
export async function refreshPCGroupConfig(): Promise<void> {
  const fresh = await fetchPCGroupConfig();
  setPCGroupConfig(fresh);
}

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

/**
 * Validation côté client appliquée AVANT toute écriture en base.
 * Empêche les remontées incohérentes :
 *  - montant manquant / non numérique / négatif
 *  - mois ou entité inconnus
 *  - dépassement du cumul attendu pour l'entité (toutes lignes confondues)
 *  - tolérance par rapport à un plafond optionnel passé en paramètre
 */
export class IntercoCashValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntercoCashValidationError';
  }
}

export async function validateIntercoCashInput(row: {
  month_id: string;
  entity_code: string;
  amount_received: number | null | undefined;
  expected_total?: number; // plafond cumulé (optionnel) calculé par l'UI
}) {
  const amount = Number(row.amount_received);
  if (row.amount_received == null || Number.isNaN(amount)) {
    throw new IntercoCashValidationError('Montant requis et numérique.');
  }
  if (!Number.isFinite(amount)) {
    throw new IntercoCashValidationError('Montant invalide (non fini).');
  }
  if (amount < 0) {
    throw new IntercoCashValidationError('Le montant remonté ne peut pas être négatif.');
  }

  const [{ data: month }, { data: entity }, { data: siblings }] = await Promise.all([
    supabase
      .from('pcgroup_months')
      .select('month_id,is_active')
      .eq('month_id', row.month_id)
      .maybeSingle(),
    supabase
      .from('pcgroup_entities')
      .select('code,is_active')
      .eq('code', row.entity_code)
      .maybeSingle(),
    supabase
      .from('pcgroup_intercos_cash')
      .select('month_id, amount_received')
      .eq('entity_code', row.entity_code),
  ]);

  if (!month || !month.is_active) {
    throw new IntercoCashValidationError(`Mois inconnu ou inactif : ${row.month_id}`);
  }
  if (!entity || !entity.is_active) {
    throw new IntercoCashValidationError(`Entité inconnue ou inactive : ${row.entity_code}`);
  }

  // Cumul prévisionnel pour l'entité (en remplaçant le mois en cours par la nouvelle valeur)
  if (row.expected_total != null && row.expected_total > 0) {
    const others = (siblings ?? [])
      .filter((s) => s.month_id !== row.month_id)
      .reduce((acc, s) => acc + Number(s.amount_received ?? 0), 0);
    const projected = others + amount;
    const tolerance = Math.max(50, row.expected_total * 0.001); // 0.1 % ou 50 USD
    if (projected > row.expected_total + tolerance) {
      throw new IntercoCashValidationError(
        `Cumul ${projected.toFixed(0)} > attendu ${row.expected_total.toFixed(0)} pour ${row.entity_code}. ` +
          `Vérifiez qu'aucun montant n'est attribué à plusieurs entités.`,
      );
    }
  }
}

export async function upsertIntercoCash(
  row: Partial<PCGIntercosCashRow> & { month_id: string; entity_code: string },
  options?: { expected_total?: number },
) {
  await validateIntercoCashInput({
    month_id: row.month_id,
    entity_code: row.entity_code,
    amount_received: row.amount_received as number | null | undefined,
    expected_total: options?.expected_total,
  });

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

  // Recalcule automatiquement les soldes restants partout dans le dashboard.
  await refreshPCGroupConfig();
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

  // Recalcule automatiquement les soldes restants partout dans le dashboard.
  await refreshPCGroupConfig();
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
