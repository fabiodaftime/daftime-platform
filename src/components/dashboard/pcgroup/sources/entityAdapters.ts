// Adapter: extracts per-month numeric facts for each entity from the standalone
// dashboard data files. This is the bridge between the 3 source dashboards
// (Agency, Structuring=PrimeCircle, Digit) and the consolidated PCGroup view.
//
// Goal: when a new month is added to a source dashboard, the consolidated
// dashboard picks it up automatically without manual re-saisie.

import { getPCMonthData, type PCMonthId } from '../../primecircle/PrimeCircleData';

// Agency source: PrimeCircleAgencyData exports its own monthDataMap. We need
// access to the numeric facts; re-export the getter via dynamic import shim.
import {
  getPCAMonthData,
  type PCAMonthId,
} from '../../primecircle-agency/PrimeCircleAgencyData';

// Digit source data file uses formatted strings throughout, so we expose a
// numeric facts table maintained alongside (single source of truth for Digit
// numerics consumed by the consolidated view).
import { getDigitMonthData, type DigitMonthId } from '../../digit/DigitData';

import { DIGIT_NUMERIC_FACTS } from './digitNumericFacts';

export type PCGSourceMonthId = 'jan-2026' | 'feb-2026' | 'mar-2026' | 'apr-2026';

export interface EntityFacts {
  // Common
  ca: number;          // chiffre d'affaires (gross for Agency, turnover for Structuring/Digit)
  margeNette: number;  // For Agency this is the 100% margin; partPCA holds the 50% share
  partPCA?: number;    // Agency only
  charges: number;
  marginPct: number;
  // Optional numeric extras
  deals?: number;
  clients?: number;
  ticketMoyen?: number;
}

// ---------- AGENCY ----------
export function agencyFacts(month: PCGSourceMonthId): EntityFacts | null {
  try {
    const d = getPCAMonthData(month as PCAMonthId);
    if (!d) return null;
    return {
      ca: d.gross,
      margeNette: d.net,
      partPCA: d.pcaShare,
      charges: d.expenses,
      marginPct: d.marginPct,
      deals: d.transactions,
    };
  } catch {
    return null;
  }
}

// ---------- STRUCTURING (Prime Circle Banking) ----------
export function structuringFacts(month: PCGSourceMonthId): EntityFacts | null {
  try {
    const d = getPCMonthData(month as PCMonthId);
    if (!d) return null;
    const charges = d.costs?.total ?? 0;
    return {
      ca: d.kpis.totalTurnover,
      margeNette: d.kpis.netProfit,
      charges,
      marginPct: d.kpis.netMarginRate,
      clients: d.kpis.totalCustomers,
      ticketMoyen: d.kpis.avgPerCustomer,
    };
  } catch {
    return null;
  }
}

// ---------- DIGIT ----------
// Digit source data is formatted strings; we maintain numeric facts in a
// dedicated companion file for use by the consolidated aggregator.
export function digitFacts(month: PCGSourceMonthId): EntityFacts | null {
  const f = DIGIT_NUMERIC_FACTS[month];
  if (!f) return null;
  // Verify the source dashboard still has this month (consistency check)
  try {
    getDigitMonthData(month as DigitMonthId);
  } catch {
    return null;
  }
  return f;
}

// ---------- AVAILABLE MONTHS = intersection of the three ----------
const ALL_MONTHS: PCGSourceMonthId[] = ['jan-2026', 'feb-2026', 'mar-2026', 'apr-2026'];

export function getAvailableSourceMonths(): PCGSourceMonthId[] {
  return ALL_MONTHS.filter(
    (m) => agencyFacts(m) && structuringFacts(m) && digitFacts(m),
  );
}
