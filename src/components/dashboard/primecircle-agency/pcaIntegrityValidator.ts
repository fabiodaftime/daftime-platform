// PCA Integrity Validator
// -----------------------
// Two families of checks, run after every data import / restatement :
//   1. ALIGNMENT (per month) — internal coherence of declared figures :
//        • net   = gross - expenses          (±$1)
//        • pcaShare ≈ net / 2                 (±$1)
//        • marginPct ≈ net / gross * 100      (±0.2 pt)
//        • Σ expenseBreakdown.value = expenses
//        • waterfall GROSS REVENUE  = gross
//        • waterfall TOTAL EXPENSES = -expenses
//        • waterfall NET REVENUE    = net
//        • waterfall PCA Share      = pcaShare
//        • Σ(positive waterfall non-bold) = gross
//        • Σ(negative waterfall non-bold) = -expenses
//   2. AUTO-YTD RECOMPUTE — declared `ytd*` of each month must equal
//      the cumulative sum of the monthly figures up to that month.
//        • ytdGross    = Σ gross    (jan..month)
//        • ytdExpenses = Σ expenses (jan..month)
//        • ytdNet      = Σ net      (jan..month)
//        • ytdPcaShare = Σ pcaShare (jan..month)
//
// Each issue is surfaced with the recomputed value so the operator can
// patch PrimeCircleAgencyData.ts in one read.

import {
  getPCAMonthData,
  PCA_AVAILABLE_MONTHS,
  type PCAMonthData,
  type PCAMonthId,
} from './PrimeCircleAgencyData';

export const PCA_TOLERANCE_USD = 1;
export const PCA_TOLERANCE_PCT = 0.2;

export type IntegrityStatus = 'ok' | 'warning';

export interface AlignmentIssue {
  rule: string;
  expected: number;
  actual: number;
  delta: number;
  unit: 'usd' | 'pct';
}

export interface YtdIssue {
  field: 'ytdGross' | 'ytdExpenses' | 'ytdNet' | 'ytdPcaShare';
  declared: number;
  recomputed: number;
  delta: number;
}

export interface PCAMonthIntegrity {
  monthId: PCAMonthId;
  label: string;
  status: IntegrityStatus;
  alignment: AlignmentIssue[];
  ytd: YtdIssue[];
  recomputedYtd: {
    ytdGross: number;
    ytdExpenses: number;
    ytdNet: number;
    ytdPcaShare: number;
  };
}

export interface PCAIntegrityReport {
  months: PCAMonthIntegrity[];
  summary: { total: number; ok: number; warnings: number };
}

function alignment(d: PCAMonthData): AlignmentIssue[] {
  const out: AlignmentIssue[] = [];
  const push = (rule: string, expected: number, actual: number, unit: 'usd' | 'pct' = 'usd') => {
    const delta = actual - expected;
    const tol = unit === 'usd' ? PCA_TOLERANCE_USD : PCA_TOLERANCE_PCT;
    if (Math.abs(delta) > tol) out.push({ rule, expected, actual, delta, unit });
  };

  push('Net = Gross − Expenses', d.gross - d.expenses, d.net);
  push('PCA Share = Net / 2', d.net / 2, d.pcaShare);
  if (d.gross > 0) push('Marge % = Net / Gross × 100', (d.net / d.gross) * 100, d.marginPct, 'pct');

  // expenseBreakdown sum
  const breakdownSum = d.expenseBreakdown.reduce((s, x) => s + (x.value || 0), 0);
  push('Σ expenseBreakdown = Expenses', d.expenses, breakdownSum);

  // waterfall checks
  const wf = d.waterfallRows;
  const findRow = (label: string) => wf.find((r) => r.l.toUpperCase().includes(label));
  const grossRow = findRow('GROSS REVENUE');
  const expRow = findRow('TOTAL EXPENSES');
  const netRow = findRow('NET REVENUE');
  const shareRow = wf.find((r) => /PCA SHARE/i.test(r.l));
  if (grossRow) push('Waterfall GROSS REVENUE = Gross', d.gross, grossRow.v);
  if (expRow) push('Waterfall TOTAL EXPENSES = −Expenses', -d.expenses, expRow.v);
  if (netRow) push('Waterfall NET REVENUE = Net', d.net, netRow.v);
  if (shareRow) push('Waterfall PCA Share = pcaShare', d.pcaShare, shareRow.v);

  // Σ positive non-bold rows = gross ; Σ negative non-bold rows = -expenses
  const sumPos = wf.filter((r) => !r.b && r.v > 0).reduce((s, r) => s + r.v, 0);
  const sumNeg = wf.filter((r) => !r.b && r.v < 0).reduce((s, r) => s + r.v, 0);
  if (sumPos > 0) push('Σ (revenue lines) = Gross', d.gross, sumPos);
  if (sumNeg < 0) push('Σ (expense lines) = −Expenses', -d.expenses, sumNeg);

  return out;
}

export function validatePCAIntegrity(): PCAIntegrityReport {
  const orderedIds = PCA_AVAILABLE_MONTHS.map((m) => m.id as PCAMonthId);
  let cumGross = 0;
  let cumExp = 0;
  let cumNet = 0;
  let cumShare = 0;

  const months: PCAMonthIntegrity[] = orderedIds.map((id) => {
    const d = getPCAMonthData(id);
    cumGross += d.gross;
    cumExp += d.expenses;
    cumNet += d.net;
    cumShare += d.pcaShare;

    const recomputedYtd = {
      ytdGross: cumGross,
      ytdExpenses: cumExp,
      ytdNet: cumNet,
      ytdPcaShare: cumShare,
    };

    const ytd: YtdIssue[] = [];
    const ytdCheck = (
      field: YtdIssue['field'],
      declared: number,
      recomputed: number,
    ) => {
      const delta = declared - recomputed;
      if (Math.abs(delta) > PCA_TOLERANCE_USD) ytd.push({ field, declared, recomputed, delta });
    };
    ytdCheck('ytdGross', d.ytdGross, cumGross);
    ytdCheck('ytdExpenses', d.ytdExpenses, cumExp);
    ytdCheck('ytdNet', d.ytdNet, cumNet);
    ytdCheck('ytdPcaShare', d.ytdPcaShare, cumShare);

    const align = alignment(d);
    const status: IntegrityStatus = align.length === 0 && ytd.length === 0 ? 'ok' : 'warning';

    return {
      monthId: id,
      label: d.monthLabel,
      status,
      alignment: align,
      ytd,
      recomputedYtd,
    };
  });

  return {
    months,
    summary: {
      total: months.length,
      ok: months.filter((m) => m.status === 'ok').length,
      warnings: months.filter((m) => m.status === 'warning').length,
    },
  };
}
