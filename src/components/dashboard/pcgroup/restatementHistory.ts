// ============================================================
// Restatement History — registre statique versionné
// ============================================================
// Source de vérité unique pour suivre toutes les corrections de
// chiffres financiers déjà publiés. À chaque restatement (mise à
// jour d'une donnée déjà visible dans un dashboard d'un mois clos),
// on AJOUTE une entrée ici. On ne modifie / on ne supprime jamais
// une entrée passée — c'est un journal.
//
// Périmètre : Prime Circle Group (Agency, Structuring, Digit,
// SPY, Comment) + impacts consolidés (Holding / Marge Brute Groupe).
//
// Convention :
//  - oldValue / newValue en USD (ou %), unité explicite via `unit`
//  - delta = newValue - oldValue (calculé à l'affichage)
//  - cascadeImpacts = liste libre des KPI consolidés impactés
//  - reason = courte phrase business (pourquoi la correction)
//  - source = qui / quoi a déclenché (ex: "Closing Avril", "Audit Blink")
// ============================================================

import type { PCGSourceMonthId } from './sources/entityAdapters';

export type RestatementEntity =
  | 'agency'
  | 'structuring'
  | 'digit'
  | 'spy'
  | 'comment'
  | 'group';

export type RestatementUnit = 'usd' | 'pct' | 'count';

export interface RestatementCascadeImpact {
  /** KPI affecté côté consolidé / autre vue (ex: "YTD Net", "Marge Brute Groupe") */
  label: string;
  /** Variation chiffrée (signed). Ex: +4159, -45 */
  delta: number;
  unit?: RestatementUnit;
}

export interface RestatementEntry {
  id: string;
  /** Mois corrigé (mois où la donnée appartient) */
  monthId: PCGSourceMonthId;
  entity: RestatementEntity;
  /** KPI corrigé (libellé business). Ex: "Gross Revenue", "Total Expenses" */
  kpi: string;
  oldValue: number;
  newValue: number;
  unit: RestatementUnit;
  /** Date de la correction (ISO YYYY-MM-DD) */
  restatedOn: string;
  /** Raison business courte */
  reason: string;
  /** Origine du restatement : closing, audit, fix donnée source… */
  source: string;
  /** Impacts en cascade sur d'autres KPI / vues consolidées */
  cascadeImpacts?: RestatementCascadeImpact[];
}

// ------------------------------------------------------------
// REGISTRE (ordre chronologique de saisie — le plus récent en bas)
// ------------------------------------------------------------
export const RESTATEMENT_HISTORY: RestatementEntry[] = [
  // ===== Restatement Feb 2026 PCA — Closing Mars =====
  {
    id: 'pca-feb-2026-gross-v1',
    monthId: 'feb-2026',
    entity: 'agency',
    kpi: 'Gross Revenue',
    oldValue: 35080,
    newValue: 36184,
    unit: 'usd',
    restatedOn: '2026-04-15',
    reason: 'Réconciliation Stripe — abonnements Feb sous-déclarés.',
    source: 'Closing Mars 2026',
    cascadeImpacts: [
      { label: 'PCA Net Revenue Feb', delta: 2305 },
      { label: 'PCA Share (50%) Feb', delta: 1152 },
      { label: 'Marge Brute Groupe Feb', delta: 1152 },
    ],
  },
  {
    id: 'pca-feb-2026-expenses-v1',
    monthId: 'feb-2026',
    entity: 'agency',
    kpi: 'Total Expenses',
    oldValue: 10606,
    newValue: 9406,
    unit: 'usd',
    restatedOn: '2026-04-15',
    reason: 'Setup Cost Feb réduit (2500 → 1300) après revue agents.',
    source: 'Closing Mars 2026',
    cascadeImpacts: [
      { label: 'PCA Net Revenue Feb', delta: 1200 },
      { label: 'PCA Share (50%) Feb', delta: 600 },
    ],
  },

  // ===== Restatement Jan 2026 PCA — Closing Avril =====
  {
    id: 'pca-jan-2026-gross-v1',
    monthId: 'jan-2026',
    entity: 'agency',
    kpi: 'Gross Revenue',
    oldValue: 10726,
    newValue: 14885,
    unit: 'usd',
    restatedOn: '2026-05-10',
    reason: 'Subscriptions Jan sous-déclarées — rattrapage facturation.',
    source: 'Closing Avril 2026',
    cascadeImpacts: [
      { label: 'PCA Net Revenue Jan', delta: 4159 },
      { label: 'PCA Share (50%) Jan', delta: 2079 },
      { label: 'Marge Brute Groupe Jan', delta: 2079 },
      { label: 'Résultat Net Holding Jan', delta: 1871 },
      { label: 'YTD Gross PCA', delta: 4159 },
    ],
  },

  // ===== Restatement Mar 2026 PCA — Closing Avril =====
  {
    id: 'pca-mar-2026-expenses-v1',
    monthId: 'mar-2026',
    entity: 'agency',
    kpi: 'Total Expenses',
    oldValue: 16555,
    newValue: 16510,
    unit: 'usd',
    restatedOn: '2026-05-10',
    reason: 'Suppression Transaction Fees (-$45) — déjà comptés ailleurs.',
    source: 'Closing Avril 2026',
    cascadeImpacts: [
      { label: 'YTD Expenses PCA', delta: -45 },
    ],
  },

  // ===== Restatement May 2026 Structuring — Reclass OpEx → Holding =====
  {
    id: 'pcs-may-2026-opex-reclass-v1',
    monthId: 'may-2026',
    entity: 'structuring',
    kpi: 'Total Costs',
    oldValue: 33453,
    newValue: 26688,
    unit: 'usd',
    restatedOn: '2026-06-04',
    reason: "OpEx Mai (Tools, Travel, Lunch, Event, Transport, Global Expense, Marketing Tools) requalifiées en charges Holding — n'appartiennent pas à l'activité Structuring.",
    source: 'Revue Closing Mai 2026',
    cascadeImpacts: [
      { label: 'Structuring Net Profit Mai', delta: 6765 },
      { label: 'Structuring Net Margin Mai', delta: 11.9, unit: 'pct' },
      { label: 'Frais Holding Mai', delta: 6765 },
      { label: 'YTD Structuring Net Profit', delta: 6765 },
    ],
  },
];

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
export function getRestatementsByEntity(entity: RestatementEntity): RestatementEntry[] {
  return RESTATEMENT_HISTORY.filter((r) => r.entity === entity);
}

export function getRestatementsByMonth(monthId: PCGSourceMonthId): RestatementEntry[] {
  return RESTATEMENT_HISTORY.filter((r) => r.monthId === monthId);
}

export function getAllRestatements(): RestatementEntry[] {
  return [...RESTATEMENT_HISTORY].sort((a, b) =>
    b.restatedOn.localeCompare(a.restatedOn),
  );
}

export const ENTITY_LABELS: Record<RestatementEntity, string> = {
  agency: 'Prime Circle Agency',
  structuring: 'Structuring',
  digit: 'Digit Solution',
  spy: 'SPY',
  comment: 'Comment / Trustpilot',
  group: 'Consolidé Groupe',
};

export const MONTH_LABELS: Record<PCGSourceMonthId, string> = {
  'jan-2026': 'Janvier 2026',
  'feb-2026': 'Février 2026',
  'mar-2026': 'Mars 2026',
  'apr-2026': 'Avril 2026',
  'may-2026': 'Mai 2026',
};

export function formatRestatementValue(v: number, unit: RestatementUnit): string {
  if (unit === 'pct') return `${v.toFixed(1)}%`;
  if (unit === 'count') return v.toLocaleString('en-US');
  // USD
  const sign = v < 0 ? '-' : '';
  return `${sign}$${Math.abs(v).toLocaleString('en-US')}`;
}

export function formatDelta(delta: number, unit: RestatementUnit): string {
  const prefix = delta > 0 ? '+' : '';
  return `${prefix}${formatRestatementValue(delta, unit)}`;
}

export function deltaPct(oldV: number, newV: number): number | null {
  if (!oldV) return null;
  return ((newV - oldV) / Math.abs(oldV)) * 100;
}
