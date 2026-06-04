// Calcul des remontées Holding pour Digit Group, aligné sur la règle métier
// Prime Circle utilisée par le dashboard consolidé (`pcGroupIntercosCompute.ts`).
//
// Règles métier (identiques à la Conso) :
//   • Phase MaxScale (Jan/Fév) : Digit + Comment + SPY agrégés dans un seul
//     pot "Digit Solution". Les remontées reçues (digit + comment + spy)
//     couvrent indistinctement ce pot.
//   • À partir de Mars : Digit + Comment restent agrégés dans "Digit Solution
//     (Core)". SPY est isolé et suivi séparément (received.spy uniquement).
//   • Comment/Trust n'a JAMAIS de remontée séparée — toujours intégré dans
//     Core. La sous-activité 'comment' est conservée pour compat de routing
//     (vues scopées entité), mais son taux de remontée est 0.
//   • Imputation FIFO : les encaissements d'une sous-activité couvrent en
//     priorité ses mois les plus anciens (même logique que PCGroup).
//
// → Renvoie : 3 sous-activités (core / spy / comment) + tableau historique
//   mensuel + total. Source unique de vérité pour le tab "Remontées Holding"
//   du dashboard Digit.

import { digitFacts, type PCGSourceMonthId } from '../pcgroup/sources/entityAdapters';
import { INTERCOS_CASH, MANUAL_ENTITIES } from '../pcgroup/manualEntities';
import { fmtF } from './DigitData';

const MONTH_ORDER: PCGSourceMonthId[] = ['jan-2026', 'feb-2026', 'mar-2026', 'apr-2026', 'may-2026'];
const MAXSCALE_MONTHS: PCGSourceMonthId[] = ['jan-2026', 'feb-2026'];
const isMaxscale = (m: PCGSourceMonthId) => MAXSCALE_MONTHS.includes(m);

const MONTH_LONG: Record<PCGSourceMonthId, string> = {
  'jan-2026': 'Janvier 2026',
  'feb-2026': 'Février 2026',
  'mar-2026': 'Mars 2026',
  'apr-2026': 'Avril 2026',
  'may-2026': 'Mai 2026',
};
const MONTH_SHORT: Record<PCGSourceMonthId, string> = {
  'jan-2026': 'Jan',
  'feb-2026': 'Fév',
  'mar-2026': 'Mars',
  'apr-2026': 'Avril',
  'may-2026': 'Mai',
};

export type SubActivityKey = 'core' | 'spy' | 'comment';
export interface SubActivity {
  key: SubActivityKey;
  label: string;
  color: string;
  transferRate: number; // 0.9 = 90% remonté, 0 = bundled / pas de remontée séparée
}
export const SUB_ACTIVITIES: SubActivity[] = [
  { key: 'core',    label: 'Digit Solution (Core + Comment + SPY Jan/Fév)', color: '#1E56A0', transferRate: 0.9 },
  { key: 'spy',     label: 'SPY (isolé Mars+)',                              color: '#7C3AED', transferRate: 0.9 },
  { key: 'comment', label: 'Comment / Trust (intégré dans Core)',            color: '#17B169', transferRate: 0   },
];

export function getTransferRate(key: SubActivityKey): number {
  return SUB_ACTIVITIES.find((s) => s.key === key)?.transferRate ?? 0;
}

const usd = (n: number) => fmtF(Math.round(n));

// Marge mensuelle de chaque sous-activité, alignée sur la règle Conso.
function marginFor(key: SubActivityKey, m: PCGSourceMonthId): number {
  if (key === 'core') {
    const digit = digitFacts(m)?.margeNette ?? 0;
    const comment = MANUAL_ENTITIES[m]?.comment.margeNette ?? 0;
    const spyBundled = isMaxscale(m) ? (MANUAL_ENTITIES[m]?.spy.margeNette ?? 0) : 0;
    return digit + comment + spyBundled;
  }
  if (key === 'spy') {
    // SPY isolé uniquement à partir de Mars. Jan/Fév → bundled dans Core.
    return isMaxscale(m) ? 0 : (MANUAL_ENTITIES[m]?.spy.margeNette ?? 0);
  }
  // comment : toujours intégré dans Core, pas de remontée propre.
  return 0;
}

// Cash reçu par la Holding Digit pour chaque sous-activité.
function receivedFor(key: SubActivityKey, m: PCGSourceMonthId): number {
  const r = INTERCOS_CASH[m]?.received ?? {};
  if (key === 'core') {
    const digit = r.digit ?? 0;
    const comment = r.comment ?? 0;
    const spyBundled = isMaxscale(m) ? (r.spy ?? 0) : 0;
    return digit + comment + spyBundled;
  }
  if (key === 'spy') {
    return isMaxscale(m) ? 0 : (r.spy ?? 0);
  }
  return 0;
}

export interface MonthBreakdown {
  month: PCGSourceMonthId;
  shortLabel: string;
  longLabel: string;
  margin: number;
  expected: number;     // 90% margin
  received: number;
  balance: number;      // expected - received (cumulé FIFO sur cette ligne)
  status: 'paid' | 'partial' | 'pending' | 'overpaid' | 'bundled';
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
  transferRate: number;
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
  fmt: (n: number) => string;
}

/** Construit la vue Remontées Holding pour le dashboard Digit, jusqu'au mois
 *  `viewMonth` inclus. FIFO : les encaissements d'une activité couvrent en
 *  priorité ses mois les plus anciens. Mêmes règles que la Conso. */
export function computeDigitHoldingTransfers(
  viewMonth: PCGSourceMonthId,
): DigitHoldingTransfersData {
  const viewIdx = MONTH_ORDER.indexOf(viewMonth);
  const months = MONTH_ORDER.slice(0, viewIdx + 1);

  const subActivities: SubActivitySummary[] = SUB_ACTIVITIES.map((sub) => {
    const baseRows = months.map((m) => {
      const margin = marginFor(sub.key, m);
      const expected = margin * sub.transferRate;
      const received = receivedFor(sub.key, m);
      return { month: m, margin, expected, received };
    });

    // FIFO : pool total reçu imputé sur les mois dans l'ordre chronologique.
    const pool = baseRows.reduce((acc, r) => acc + r.received, 0);
    let remainingPool = pool;
    const rows: MonthBreakdown[] = baseRows.map((r) => {
      const covered = Math.min(remainingPool, r.expected);
      remainingPool -= covered;
      const balance = Math.max(0, r.expected - covered);
      let status: MonthBreakdown['status'] = 'pending';
      // SPY Jan/Fév : bundled dans Core, on le marque explicitement.
      if (sub.key === 'spy' && isMaxscale(r.month)) status = 'bundled';
      else if (sub.transferRate === 0) status = 'bundled';
      else if (r.expected <= 0) status = 'paid';
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
      transferRate: sub.transferRate,
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
