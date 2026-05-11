// Cross-validation utility for the consolidated PCGroup dashboard.
// ---------------------------------------------------------------
// Two checks are performed for every month declared in MONTH_ORDER:
//   1. SOURCE PRESENCE — does each upstream entity (Agency, Structuring,
//      Digit) and the manual block (SPY/Comment/Holding) provide data?
//   2. CONSISTENCY — does the live aggregator output match the legacy
//      "expected" totals frozen in PCGroupData.ts? Useful to detect drift
//      when a source dashboard's numbers change.
//
// Tolerance: $5 USD on absolute values, 0.05 pt on percentages.

import {
  agencyFacts,
  structuringFacts,
  digitFacts,
  type PCGSourceMonthId,
} from './sources/entityAdapters';
import { MANUAL_ENTITIES } from './manualEntities';
import { computeConsolidatedFacts, diagnoseMonth } from './pcGroupAggregator';

const MONTH_ORDER: PCGSourceMonthId[] = ['jan-2026', 'feb-2026', 'mar-2026', 'apr-2026'];
const MONTH_LABELS: Record<PCGSourceMonthId, string> = {
  'jan-2026': 'Janvier 2026',
  'feb-2026': 'Février 2026',
  'mar-2026': 'Mars 2026',
  'apr-2026': 'Avril 2026',
};

// Expected consolidated totals frozen from the legacy PCGroupData.ts blocks.
// Used to detect drift between sources and the original manual consolidation.
// (apr-2026 has no legacy reference — added live → no expected values.)
interface Expected {
  ca: number;
  margeBrute: number;
  resultatNet: number;
  reserves: number;
}
const EXPECTED: Partial<Record<PCGSourceMonthId, Expected>> = {
  'jan-2026': { ca: 198900, margeBrute: 89607, resultatNet: 73586, reserves: 8961 },
  'feb-2026': { ca: 259647, margeBrute: 81373, resultatNet: 62346, reserves: 8137 },
  'mar-2026': { ca: 260071, margeBrute: 106183, resultatNet: 87187, reserves: 10618 },
};

export const DEFAULT_TOLERANCE_USD = 5;

export interface ValidationOptions {
  /** Tolérance en USD sur les écarts vs valeurs figées (défaut $5). */
  toleranceUsd?: number;
  /** Si false, on saute la comparaison aux totaux de référence (présence uniquement). */
  checkMetrics?: boolean;
}

export type ValidationStatus = 'ok' | 'warning' | 'missing';

export interface DeltaRow {
  metric: string;
  expected: number;
  actual: number;
  delta: number;
}

export interface MonthValidation {
  monthId: PCGSourceMonthId;
  label: string;
  status: ValidationStatus;
  presence: {
    agency: boolean;
    structuring: boolean;
    digit: boolean;
    manual: boolean;
  };
  issues: string[];
  deltas: DeltaRow[];
  hasExpected: boolean;
}

export interface ValidationReport {
  months: MonthValidation[];
  summary: {
    total: number;
    ok: number;
    warnings: number;
    missing: number;
  };
}

export function validateAllMonths(opts: ValidationOptions = {}): ValidationReport {
  const tolerance = Math.max(0, opts.toleranceUsd ?? DEFAULT_TOLERANCE_USD);
  const checkMetrics = opts.checkMetrics !== false;

  const months: MonthValidation[] = MONTH_ORDER.map((monthId) => {
    const presence = {
      agency: !!agencyFacts(monthId),
      structuring: !!structuringFacts(monthId),
      digit: !!digitFacts(monthId),
      manual: !!MANUAL_ENTITIES[monthId],
    };

    const issues: string[] = [];
    if (!presence.agency) issues.push('Agency : données mensuelles absentes');
    if (!presence.structuring) issues.push('Structuring : données mensuelles absentes');
    if (!presence.digit) issues.push('Digit : facts numériques absents (DIGIT_NUMERIC_FACTS)');
    if (!presence.manual) issues.push('SPY / Comment / Holding : bloc manuel absent (MANUAL_ENTITIES)');

    // Director % sum check via existing diagnostic
    const diag = diagnoseMonth(monthId);
    diag.issues.forEach((i) => {
      if (!issues.includes(i)) issues.push(i);
    });

    const deltas: DeltaRow[] = [];
    const expected = EXPECTED[monthId];
    const facts = computeConsolidatedFacts(monthId);
    if (checkMetrics && expected && facts) {
      const checks: { metric: string; expected: number; actual: number }[] = [
        { metric: 'CA Groupe', expected: expected.ca, actual: facts.caGroupe },
        { metric: 'Marge Brute Groupe', expected: expected.margeBrute, actual: facts.margeBruteGroupe },
        { metric: 'Résultat Net Holding', expected: expected.resultatNet, actual: facts.resultatNetHolding },
        { metric: 'Réserves Filiales', expected: expected.reserves, actual: facts.reservesFiliales },
      ];
      for (const c of checks) {
        const delta = c.actual - c.expected;
        if (Math.abs(delta) > tolerance) {
          deltas.push({ metric: c.metric, expected: c.expected, actual: c.actual, delta });
          issues.push(
            `Écart ${c.metric} : attendu $${Math.round(c.expected).toLocaleString('en-US')} · calculé $${Math.round(c.actual).toLocaleString('en-US')} (${delta >= 0 ? '+' : ''}$${Math.round(delta).toLocaleString('en-US')})`,
          );
        }
      }
    }

    // ----- SPY / Comment integrity : Marge Nette = CA - Total Charges
    // Détecte toute incohérence saisie dans le bloc manuel (frais
    // recalculés vs marge déclarée). Tolérance = même que l'option.
    if (presence.manual) {
      const manual = MANUAL_ENTITIES[monthId]!;
      const checks: { entity: string; ca: number; charges: number; marge: number; pct: number }[] = [
        { entity: 'SPY', ca: manual.spy.ca, charges: manual.spy.charges, marge: manual.spy.margeNette, pct: manual.spy.marginPct },
        { entity: 'Comment', ca: manual.comment.ca, charges: manual.comment.charges, marge: manual.comment.margeNette, pct: manual.comment.marginPct },
      ];
      for (const c of checks) {
        const expectedMarge = c.ca - c.charges;
        const deltaMarge = c.marge - expectedMarge;
        if (Math.abs(deltaMarge) > tolerance) {
          deltas.push({
            metric: `${c.entity} · Marge Nette vs (CA − Charges)`,
            expected: expectedMarge,
            actual: c.marge,
            delta: deltaMarge,
          });
          issues.push(
            `Incohérence ${c.entity} : Marge Nette saisie $${Math.round(c.marge).toLocaleString('en-US')} ≠ CA − Charges $${Math.round(expectedMarge).toLocaleString('en-US')} (${deltaMarge >= 0 ? '+' : ''}$${Math.round(deltaMarge).toLocaleString('en-US')})`,
          );
        }
        // Marge % cohérente avec marge / CA
        if (c.ca > 0) {
          const expectedPct = (c.marge / c.ca) * 100;
          const deltaPct = c.pct - expectedPct;
          if (Math.abs(deltaPct) > 0.5) {
            issues.push(
              `Incohérence ${c.entity} : Marge % saisie ${c.pct.toFixed(1)}% ≠ Marge / CA ${expectedPct.toFixed(1)}% (${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)} pt)`,
            );
          }
        }
      }
    }

    const allMissing = !presence.agency && !presence.structuring && !presence.digit && !presence.manual;
    let status: ValidationStatus;
    if (allMissing) status = 'missing';
    else if (issues.length > 0) status = 'warning';
    else status = 'ok';

    return {
      monthId,
      label: MONTH_LABELS[monthId],
      status,
      presence,
      issues,
      deltas,
      hasExpected: !!expected,
    };
  });

  return {
    months,
    summary: {
      total: months.length,
      ok: months.filter((m) => m.status === 'ok').length,
      warnings: months.filter((m) => m.status === 'warning').length,
      missing: months.filter((m) => m.status === 'missing').length,
    },
  };
}
