// Validates that PCGroup facts for Digit / SPY / Comment-Trust are
// monthly figures (not cumulated YTD) and consistent with the Digit
// dashboard breakdown. Catches the most common data-entry mistake:
// entering Digit total (Core + SPY + Comment) as `digit.ca`, which
// causes double-counting at consolidation.

import type { PCGSourceMonthId } from './sources/entityAdapters';
import { digitFacts } from './sources/entityAdapters';
import { MANUAL_ENTITIES } from './manualEntities';
import { getDigitMonthData, type DigitMonthId } from '../digit/DigitData';

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: ValidationSeverity;
  entity: 'digit' | 'spy' | 'comment' | 'group';
  month: PCGSourceMonthId;
  monthLabel: string;
  field: string;
  message: string;
  expected?: number;
  actual?: number;
}

const MONTH_LABEL: Record<PCGSourceMonthId, string> = {
  'jan-2026': 'Janvier 2026',
  'feb-2026': 'Février 2026',
  'mar-2026': 'Mars 2026',
  'apr-2026': 'Avril 2026',
};

/** Parse a USD-formatted string like "$114,649" → 114649. */
function parseUSD(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return 0;
  const n = Number(v.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export { MONTH_LABEL as DIGIT_MONTH_LABEL };

/** Read the 3 sub-product values from the Digit dashboard for a month. */
export function readDigitDashboard(month: PCGSourceMonthId) {
  try {
    const d = getDigitMonthData(month as DigitMonthId);
    const core = d.overviewProducts?.find((p: any) => /Core/i.test(p.label));
    const spy = d.overviewProducts?.find((p: any) => /^SPY/i.test(p.label));
    const ct = d.overviewProducts?.find((p: any) => /Comment|Trust/i.test(p.label));
    return {
      coreCa: parseUSD(core?.value),
      spyCa: parseUSD(spy?.value),
      ctCa: parseUSD(ct?.value),
      coreMarge: parseUSD(/Marge\s+\$([\d,]+)/.exec(core?.sub ?? '')?.[1]),
      spyMarge: parseUSD(/Marge\s+\$([\d,]+)/.exec(spy?.sub ?? '')?.[1]),
      ctMarge: parseUSD(/Marge\s+\$([\d,]+)/.exec(ct?.sub ?? '')?.[1]),
    };
  } catch {
    return null;
  }
}

const REL_TOL = 0.05; // 5 % tolerance for CA matching
const ABS_TOL = 50; // 50 USD absolute tolerance

function approxEqual(a: number, b: number) {
  if (Math.abs(a - b) <= ABS_TOL) return true;
  if (b === 0) return false;
  return Math.abs(a - b) / Math.abs(b) <= REL_TOL;
}

export function validateDigitConsistency(
  months: PCGSourceMonthId[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const m of months) {
    const dash = readDigitDashboard(m);
    if (!dash) continue;
    const monthLabel = MONTH_LABEL[m];

    // ---- Digit (Core only expected) ----
    const dFacts = digitFacts(m);
    if (dFacts) {
      const cumulated = dash.coreCa + dash.spyCa + dash.ctCa;
      // Cumulation detection: digit.ca matches the total instead of Core
      if (
        approxEqual(dFacts.ca, cumulated) &&
        !approxEqual(dFacts.ca, dash.coreCa) &&
        dash.spyCa + dash.ctCa > ABS_TOL
      ) {
        issues.push({
          severity: 'error',
          entity: 'digit',
          month: m,
          monthLabel,
          field: 'ca',
          actual: dFacts.ca,
          expected: dash.coreCa,
          message: `Digit Solution semble cumulé (Core + SPY + Comment). CA saisi $${Math.round(dFacts.ca).toLocaleString()} ≈ total dashboard $${Math.round(cumulated).toLocaleString()}. Doit être Core uniquement ($${Math.round(dash.coreCa).toLocaleString()}).`,
        });
      } else if (!approxEqual(dFacts.ca, dash.coreCa) && dash.coreCa > 0) {
        issues.push({
          severity: 'warning',
          entity: 'digit',
          month: m,
          monthLabel,
          field: 'ca',
          actual: dFacts.ca,
          expected: dash.coreCa,
          message: `CA Digit Core incohérent : PCGroup $${Math.round(dFacts.ca).toLocaleString()} vs dashboard Digit $${Math.round(dash.coreCa).toLocaleString()}.`,
        });
      }
    }

    // ---- SPY ----
    const spy = MANUAL_ENTITIES[m]?.spy;
    if (spy && dash.spyCa > 0 && !approxEqual(spy.ca, dash.spyCa)) {
      issues.push({
        severity: 'warning',
        entity: 'spy',
        month: m,
        monthLabel,
        field: 'ca',
        actual: spy.ca,
        expected: dash.spyCa,
        message: `CA SPY incohérent : PCGroup $${Math.round(spy.ca).toLocaleString()} vs dashboard Digit $${Math.round(dash.spyCa).toLocaleString()}.`,
      });
    }

    // ---- Comment / Trust ----
    const comment = MANUAL_ENTITIES[m]?.comment;
    if (comment && dash.ctCa > 0 && !approxEqual(comment.ca, dash.ctCa)) {
      issues.push({
        severity: 'warning',
        entity: 'comment',
        month: m,
        monthLabel,
        field: 'ca',
        actual: comment.ca,
        expected: dash.ctCa,
        message: `CA Comment/Trust incohérent : PCGroup $${Math.round(comment.ca).toLocaleString()} vs dashboard Digit $${Math.round(dash.ctCa).toLocaleString()}.`,
      });
    }

    // ---- Sum check : Digit Group total = Core + SPY + Comment ----
    // Garantit qu'aucun cumul/erreur de saisie ne fait diverger
    // (PCGroup sub-entities) ↔ (total Digit Group affiché sur le dashboard).
    const corePCG = dFacts?.ca ?? 0;
    const spyPCG = MANUAL_ENTITIES[m]?.spy?.ca ?? 0;
    const commentPCG = MANUAL_ENTITIES[m]?.comment?.ca ?? 0;
    const sumPCG = corePCG + spyPCG + commentPCG;
    const sumDash = dash.coreCa + dash.spyCa + dash.ctCa;
    if (sumDash > 0 && !approxEqual(sumPCG, sumDash)) {
      const delta = sumPCG - sumDash;
      issues.push({
        severity: 'error',
        entity: 'group',
        month: m,
        monthLabel,
        field: 'ca_sum',
        actual: sumPCG,
        expected: sumDash,
        message: `Total Digit Group incohérent : Σ(Core $${Math.round(corePCG).toLocaleString()} + SPY $${Math.round(spyPCG).toLocaleString()} + Comment $${Math.round(commentPCG).toLocaleString()}) = $${Math.round(sumPCG).toLocaleString()} vs total dashboard $${Math.round(sumDash).toLocaleString()} (Δ ${delta >= 0 ? '+' : ''}$${Math.round(delta).toLocaleString()}). Vérifier qu'aucun montant n'est compté deux fois.`,
      });
    }

    // ---- Marge sum check ----
    const margeCorePCG = dFacts?.margeNette ?? 0;
    const margeSpyPCG = MANUAL_ENTITIES[m]?.spy?.margeNette ?? 0;
    const margeCommentPCG = MANUAL_ENTITIES[m]?.comment?.margeNette ?? 0;
    const margeSumPCG = margeCorePCG + margeSpyPCG + margeCommentPCG;
    const margeSumDash = dash.coreMarge + dash.spyMarge + dash.ctMarge;
    if (margeSumDash > 0 && !approxEqual(margeSumPCG, margeSumDash)) {
      const delta = margeSumPCG - margeSumDash;
      issues.push({
        severity: 'warning',
        entity: 'group',
        month: m,
        monthLabel,
        field: 'marge_sum',
        actual: margeSumPCG,
        expected: margeSumDash,
        message: `Marge Digit Group incohérente : Σ sous-entités $${Math.round(margeSumPCG).toLocaleString()} vs total dashboard $${Math.round(margeSumDash).toLocaleString()} (Δ ${delta >= 0 ? '+' : ''}$${Math.round(delta).toLocaleString()}).`,
      });
    }
  }

  // ---- Cross-month cumulation check (per entity) ----
  // If month N values look like cumulative (≥ sum of months 1..N-1), flag.
  const checkCumulCrossMonth = (
    entity: ValidationIssue['entity'],
    label: string,
    getCa: (m: PCGSourceMonthId) => number | null,
  ) => {
    const series = months.map((m) => ({ m, ca: getCa(m) ?? 0 }));
    for (let i = 1; i < series.length; i++) {
      const prevSum = series.slice(0, i).reduce((a, x) => a + x.ca, 0);
      const cur = series[i].ca;
      // Only flag if previous sum is meaningful and current ≈ prevSum + something significant
      if (prevSum > ABS_TOL * 4 && cur > prevSum * 1.5 && cur > prevSum + ABS_TOL) {
        // Suspicious: current month is much larger than cumulative previous months
        // (could indicate the value is YTD cumulated)
        const ytdLike = approxEqual(cur, prevSum + (cur - prevSum));
        if (ytdLike && cur >= prevSum * 1.8) {
          issues.push({
            severity: 'warning',
            entity,
            month: series[i].m,
            monthLabel: MONTH_LABEL[series[i].m],
            field: 'ca',
            actual: cur,
            message: `${label} : valeur du mois inhabituellement élevée vs mois précédents (possible cumul YTD).`,
          });
        }
      }
    }
  };

  checkCumulCrossMonth('digit', 'CA Digit Core', (m) => digitFacts(m)?.ca ?? null);
  checkCumulCrossMonth('spy', 'CA SPY', (m) => MANUAL_ENTITIES[m]?.spy?.ca ?? null);
  checkCumulCrossMonth('comment', 'CA Comment/Trust', (m) => MANUAL_ENTITIES[m]?.comment?.ca ?? null);

  return issues;
}
