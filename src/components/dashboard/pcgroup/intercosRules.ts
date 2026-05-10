// Intercos transfer rules for the PCGroup consolidated dashboard.
// ---------------------------------------------------------------
// Rule of thumb: each subsidiary remits a fixed % of its monthly net margin
// (or its 50% PCA share for Agency) to the Holding the FOLLOWING month
// (M+1 settlement). Reserves stay in the subsidiary (1 - transferRate).
//
// Edit the rates here when a subsidiary's policy changes — every figure in
// the Intercos tab is recomputed from these rules + the source dashboards.

import type { PCGSourceMonthId, EntityFacts } from './sources/entityAdapters';
import {
  agencyFacts,
  structuringFacts,
  digitFacts,
} from './sources/entityAdapters';
import { MANUAL_ENTITIES } from './manualEntities';

export type IntercoEntityKey = 'agency' | 'structuring' | 'digit' | 'spy' | 'comment';

export interface IntercoRule {
  key: IntercoEntityKey;
  label: string;
  /** Fraction of the source figure transferred to Holding (e.g. 0.90). */
  transferRate: number;
  /** Number of months between the period generating the margin and the
   * month it must be remitted. 1 = M+1 (default policy). */
  settlementLagMonths: number;
  /** Selector returning the base amount on which transferRate applies. */
  baseSelector: (month: PCGSourceMonthId) => number | null;
}

const RATE_DEFAULT = 0.9;
const LAG_DEFAULT = 1;

function safe(facts: EntityFacts | null, sel: (f: EntityFacts) => number): number | null {
  return facts ? sel(facts) : null;
}

export const INTERCO_RULES: IntercoRule[] = [
  {
    key: 'agency',
    label: 'Agency (PCA 50%)',
    transferRate: RATE_DEFAULT,
    settlementLagMonths: LAG_DEFAULT,
    baseSelector: (m) => safe(agencyFacts(m), (f) => f.partPCA ?? f.margeNette / 2),
  },
  {
    key: 'structuring',
    label: 'Structuring',
    transferRate: RATE_DEFAULT,
    settlementLagMonths: LAG_DEFAULT,
    baseSelector: (m) => safe(structuringFacts(m), (f) => f.margeNette),
  },
  {
    key: 'digit',
    label: 'Digit Solution',
    transferRate: RATE_DEFAULT,
    settlementLagMonths: LAG_DEFAULT,
    baseSelector: (m) => safe(digitFacts(m), (f) => f.margeNette),
  },
  {
    key: 'spy',
    label: 'SPY',
    transferRate: RATE_DEFAULT,
    settlementLagMonths: LAG_DEFAULT,
    baseSelector: (m) => MANUAL_ENTITIES[m]?.spy.margeNette ?? null,
  },
  {
    key: 'comment',
    label: 'Comment/Trust',
    transferRate: RATE_DEFAULT,
    settlementLagMonths: LAG_DEFAULT,
    baseSelector: (m) => MANUAL_ENTITIES[m]?.comment.margeNette ?? null,
  },
];

export function computeExpectedTransfer(
  rule: IntercoRule,
  sourceMonth: PCGSourceMonthId,
): number {
  const base = rule.baseSelector(sourceMonth) ?? 0;
  return base * rule.transferRate;
}
