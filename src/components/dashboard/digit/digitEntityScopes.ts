// Per-entity slices for isolated SPY / Comment dashboards.
// Source de vérité = `getDigitEntityPnL` (cf. contract/digitEntityContract.ts).
// Les listes (kpis, costsBreakdown) restent extraites de DigitData pour
// l'affichage détaillé — les chiffres headline (ca/marge/margePct) viennent
// du contrat pour garantir la cohérence avec la conso group.

import { getDigitMonthData, DIGIT_AVAILABLE_MONTHS, type DigitMonthId } from './DigitData';
import { getDigitEntityPnL, type DigitEntity } from './contract/digitEntityContract';

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

export function getEntityMonthSlice(scope: EntityScope, monthId: DigitMonthId): EntityMonthSlice {
  const m = getDigitMonthData(monthId);
  const entity: DigitEntity = scope === 'spy' ? 'spy' : 'comment';
  const pnl = getDigitEntityPnL(entity, monthId);

  const isSpy = scope === 'spy';
  return {
    monthId,
    monthLabel: m.monthLabel,
    ca: pnl.ca,
    marge: pnl.marge,
    margePct: pnl.margePct,
    kpis: (isSpy ? m.spyKPIs ?? [] : m.ctKPIs ?? []) as EntityKPI[],
    costsKPIs: (isSpy ? m.spyCostsKPIs ?? null : m.ctCostsKPIs ?? null) as EntityKPI[] | null,
    costsBreakdown: (isSpy ? m.spyCostsBreakdown ?? null : m.ctCostsBreakdown ?? null) as EntityCostLine[] | null,
    costsTotal: (isSpy ? m.spyCostsTotal ?? null : m.ctCostsTotal ?? null),
    alert: isSpy ? null : (m.ctAlert ?? null),
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
