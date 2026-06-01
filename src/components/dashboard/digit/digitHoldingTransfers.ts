// Calcul des remontées Holding pour Digit Group, splitté par sous-activité
// (Core / SPY / Comment-Trust). Source unique de vérité pour le tab
// "Remontées Holding" du dashboard Digit.
//
// Règles métier :
//   • Chaque sous-activité doit 90% de sa marge nette à la Holding (M+1).
//   • Les encaissements proviennent de `INTERCOS_CASH[m].received[key]`.
//   • Les remontées reçues d'une activité sont imputées en FIFO sur ses
//     propres mois (cohérent avec le tableau PCGroup).
//
// → Renvoie : 3 cartes de balance + tableau historique mensuel + total.

import { digitFacts, type PCGSourceMonthId } from '../pcgroup/sources/entityAdapters';
import { INTERCOS_CASH, MANUAL_ENTITIES } from '../pcgroup/manualEntities';
import { fmtF } from './DigitData';

// Taux de remontée par sous-activité. SPY = 0 : entité isolée, marges
// conservées en propre, aucune remontée vers la Holding.
const MONTH_ORDER: PCGSourceMonthId[] = ['jan-2026', 'feb-2026', 'mar-2026', 'apr-2026'];
const MONTH_LONG: Record<PCGSourceMonthId, string> = {
  'jan-2026': 'Janvier 2026',
  'feb-2026': 'Février 2026',
  'mar-2026': 'Mars 2026',
  'apr-2026': 'Avril 2026',
};
const MONTH_SHORT: Record<PCGSourceMonthId, string> = {
  'jan-2026': 'Jan',
  'feb-2026': 'Fév',
  'mar-2026': 'Mars',
  'apr-2026': 'Avril',
};

export type SubActivityKey = 'core' | 'spy' | 'comment';
export interface SubActivity {
  key: SubActivityKey;
  label: string;
  receivedKey: 'digit' | 'spy' | 'comment';
  color: string;
  transferRate: number; // 0.9 = 90% remonté, 0 = entité isolée
}
export const SUB_ACTIVITIES: SubActivity[] = [
  { key: 'core', label: 'Digit Solution (Core)', receivedKey: 'digit', color: '#1E56A0', transferRate: 0.9 },
  { key: 'spy', label: 'SPY', receivedKey: 'spy', color: '#7C3AED', transferRate: 0 },
  { key: 'comment', label: 'Comment / Trust', receivedKey: 'comment', color: '#17B169', transferRate: 0.9 },
];

export function getTransferRate(key: SubActivityKey): number {
  return SUB_ACTIVITIES.find((s) => s.key === key)?.transferRate ?? 0;
}

const usd = (n: number) => fmtF(Math.round(n));

function marginFor(key: SubActivityKey, m: PCGSourceMonthId): number {
  if (key === 'core') return digitFacts(m)?.margeNette ?? 0;
  if (key === 'spy') return MANUAL_ENTITIES[m]?.spy.margeNette ?? 0;
  return MANUAL_ENTITIES[m]?.comment.margeNette ?? 0;
}

function receivedFor(key: SubActivityKey, m: PCGSourceMonthId): number {
  const rk = SUB_ACTIVITIES.find((s) => s.key === key)!.receivedKey;
  return INTERCOS_CASH[m]?.received?.[rk] ?? 0;
}

export interface MonthBreakdown {
  month: PCGSourceMonthId;
  shortLabel: string;
  longLabel: string;
  margin: number;
  expected: number;     // 90% margin
  received: number;
  balance: number;      // expected - received (cumulé FIFO sur cette ligne)
  status: 'paid' | 'partial' | 'pending' | 'overpaid';
}

export interface SubActivitySummary {
  key: SubActivityKey;
  label: string;
  color: string;
  totalMargin: number;
  totalExpected: number;
  totalReceived: number;
  totalRemaining: number;     // FIFO : reliquat des mois non encore couverts
  recoveryRate: number;       // %
  rows: MonthBreakdown[];     // historique mensuel
}

export interface DigitHoldingTransfersData {
  upToMonth: PCGSourceMonthId;
  upToLabel: string;
  subActivities: SubActivitySummary[];
  totals: {
    margin: number;
    expected: number;
    received: number;
    remaining: number;
    recoveryRate: number;
  };
  // Helpers d'affichage
  fmt: (n: number) => string;
}

/** Construit la vue Remontées Holding pour le dashboard Digit, jusqu'au mois
 * `viewMonth` inclus. FIFO : les encaissements d'une activité couvrent en
 * priorité ses mois les plus anciens. */
export function computeDigitHoldingTransfers(
  viewMonth: PCGSourceMonthId,
): DigitHoldingTransfersData {
  const viewIdx = MONTH_ORDER.indexOf(viewMonth);
  const months = MONTH_ORDER.slice(0, viewIdx + 1);

  const subActivities: SubActivitySummary[] = SUB_ACTIVITIES.map((sub) => {
    // 1) Construire les lignes mensuelles brutes (expected/received par mois).
    const baseRows = months.map((m) => {
      const margin = marginFor(sub.key, m);
      const expected = margin * TRANSFER_RATE;
      const received = receivedFor(sub.key, m);
      return { month: m, margin, expected, received };
    });

    // 2) Allocation FIFO : on prend le pool total reçu et on l'impute sur les
    //    mois dans l'ordre chronologique (cohérent avec PCGroup).
    const pool = baseRows.reduce((acc, r) => acc + r.received, 0);
    let remainingPool = pool;
    const rows: MonthBreakdown[] = baseRows.map((r) => {
      const covered = Math.min(remainingPool, r.expected);
      remainingPool -= covered;
      const balance = Math.max(0, r.expected - covered);
      let status: MonthBreakdown['status'] = 'pending';
      if (r.expected <= 0) status = 'paid';
      else if (covered >= r.expected - 1) status = 'paid';
      else if (covered > 0) status = 'partial';
      return {
        month: r.month,
        shortLabel: MONTH_SHORT[r.month],
        longLabel: MONTH_LONG[r.month],
        margin: r.margin,
        expected: r.expected,
        received: r.received,
        balance,
        status,
      };
    });

    const totalMargin = baseRows.reduce((a, r) => a + r.margin, 0);
    const totalExpected = baseRows.reduce((a, r) => a + r.expected, 0);
    const totalReceived = pool;
    const totalRemaining = Math.max(0, totalExpected - totalReceived);
    const recoveryRate = totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0;

    return {
      key: sub.key,
      label: sub.label,
      color: sub.color,
      totalMargin,
      totalExpected,
      totalReceived,
      totalRemaining,
      recoveryRate,
      rows,
    };
  });

  const totals = subActivities.reduce(
    (acc, s) => ({
      margin: acc.margin + s.totalMargin,
      expected: acc.expected + s.totalExpected,
      received: acc.received + s.totalReceived,
      remaining: acc.remaining + s.totalRemaining,
    }),
    { margin: 0, expected: 0, received: 0, remaining: 0 },
  );
  const recoveryRate = totals.expected > 0 ? (totals.received / totals.expected) * 100 : 0;

  return {
    upToMonth: viewMonth,
    upToLabel: MONTH_LONG[viewMonth],
    subActivities,
    totals: { ...totals, recoveryRate },
    fmt: usd,
  };
}
