// Per-entity slices derived from DigitData for isolated SPY / Comment dashboards.
// Source of truth = the per-product fields already present in DigitData
// (spyKPIs / spyCostsKPIs / spyCostsBreakdown / ctKPIs / ctCostsKPIs / ctCostsBreakdown).

import { getDigitMonthData, DIGIT_AVAILABLE_MONTHS, type DigitMonthId } from './DigitData';

export type EntityScope = 'spy' | 'comment';

export interface EntityKPI { label: string; value: string; sub: string; type: string }
export interface EntityCostLine { label: string; value: string; negative?: boolean }

export interface EntityMonthSlice {
  monthId: DigitMonthId;
  monthLabel: string;
  ca: number;
  marge: number;
  margePct: number;
  kpis: EntityKPI[];
  costsKPIs: EntityKPI[] | null;
  costsBreakdown: EntityCostLine[] | null;
  costsTotal: string | null;
  alert: string | null;
}

const parseUSD = (v: unknown): number => {
  if (typeof v !== 'string') return 0;
  const cleaned = v.replace(/[^0-9.\-]/g, '');
  return cleaned ? parseFloat(cleaned) : 0;
};

export function getEntityMonthSlice(scope: EntityScope, monthId: DigitMonthId): EntityMonthSlice {
  const m = getDigitMonthData(monthId);
  if (scope === 'spy') {
    const ca = parseUSD(m.spyKPIs?.[0]?.value);
    const marge = parseUSD(m.spyKPIs?.[1]?.value);
    return {
      monthId,
      monthLabel: m.monthLabel,
      ca,
      marge,
      margePct: ca > 0 ? (marge / ca) * 100 : 0,
      kpis: (m.spyKPIs ?? []) as EntityKPI[],
      costsKPIs: (m.spyCostsKPIs ?? null) as EntityKPI[] | null,
      costsBreakdown: (m.spyCostsBreakdown ?? null) as EntityCostLine[] | null,
      costsTotal: m.spyCostsTotal ?? null,
      alert: null,
    };
  }
  const ca = parseUSD(m.ctKPIs?.[0]?.value);
  const marge = parseUSD(m.ctKPIs?.[1]?.value);
  return {
    monthId,
    monthLabel: m.monthLabel,
    ca,
    marge,
    margePct: ca > 0 ? (marge / ca) * 100 : 0,
    kpis: (m.ctKPIs ?? []) as EntityKPI[],
    costsKPIs: (m.ctCostsKPIs ?? null) as EntityKPI[] | null,
    costsBreakdown: (m.ctCostsBreakdown ?? null) as EntityCostLine[] | null,
    costsTotal: m.ctCostsTotal ?? null,
    alert: m.ctAlert ?? null,
  };
}

export interface EntityEvolutionPoint { name: string; ca: number; marge: number }

export function getEntityEvolution(scope: EntityScope, upToMonth: DigitMonthId): EntityEvolutionPoint[] {
  const idx = DIGIT_AVAILABLE_MONTHS.findIndex((mm) => mm.id === upToMonth);
  return DIGIT_AVAILABLE_MONTHS.slice(0, idx + 1).map((mm) => {
    const s = getEntityMonthSlice(scope, mm.id);
    return { name: mm.label.split(' ')[0], ca: s.ca, marge: s.marge };
  });
}

export function getEntityYTD(scope: EntityScope, upToMonth: DigitMonthId) {
  const pts = getEntityEvolution(scope, upToMonth);
  const ca = pts.reduce((a, p) => a + p.ca, 0);
  const marge = pts.reduce((a, p) => a + p.marge, 0);
  return { ca, marge, margePct: ca > 0 ? (marge / ca) * 100 : 0, points: pts };
}

export const ENTITY_META: Record<EntityScope, { label: string; short: string; accent: string; route: string; emoji: string }> = {
  spy: { label: 'SPY', short: 'SPY', accent: '#7C3AED', route: '/dashboard-spy', emoji: '🛰️' },
  comment: { label: 'Comment / Trust', short: 'Comment', accent: '#17B169', route: '/dashboard-comment', emoji: '💬' },
};
