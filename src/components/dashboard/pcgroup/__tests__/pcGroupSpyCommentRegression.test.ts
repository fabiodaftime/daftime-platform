// Non-regression tests for SPY / Comment per-entity tabs.
// ------------------------------------------------------
// Garantit que les KPIs et le waterfall affichés dans les onglets
// `PCGroupSpyTab` et `PCGroupCommentTab` :
//   1. existent pour chaque mois Jan→Avr 2026
//   2. exposent des montants strictement cohérents avec la même
//      source que la vue groupe (`getEntityMonth`) — donc avec les
//      pies / KPIs / YTD du dashboard consolidé
//   3. respectent l'identité comptable Marge Nette = CA − Total Charges
//
// Toute dérive (hardcode oublié, surcharge mal câblée, mauvais mois
// pris en source) déclenche un échec.

import { describe, it, expect } from 'vitest';
import { getMonthData, type MonthId } from '../PCGroupData';
import { getEntityMonth } from '../sources/normalizedAdapters';
import {
  ENTITY_MONTH_FIXTURES,
  FIXTURE_TOLERANCE_USD,
} from './fixtures/entityMonthFixtures';

const MONTHS: MonthId[] = ['jan-2026', 'feb-2026', 'mar-2026', 'apr-2026'];
// On utilise la fixture comme source de vérité figée — toute dérive
// de la source amont casse aussi pcGroupEntityFixtures.test.ts.
const TOLERANCE_USD = FIXTURE_TOLERANCE_USD;

const parseUSD = (s: string): number => {
  const sign = /^-/.test(s.trim()) ? -1 : 1;
  const n = Number(String(s).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? sign * n : 0;
};

const findKpi = (kpis: any[], label: string) =>
  kpis.find((k) => String(k.label).toLowerCase() === label.toLowerCase());

const findWfRow = (wf: any[], label: string) =>
  wf.find((r) => String(r.label).toLowerCase() === label.toLowerCase());

describe.each(['spy', 'comment'] as const)(
  'PCGroup — %s tab : KPIs + waterfall = même source que la vue groupe',
  (entityKey) => {
    describe.each(MONTHS)(`mois = %s`, (monthId) => {
      const data = getMonthData(monthId);
      const facts = getEntityMonth(entityKey, monthId);
      const kpis = entityKey === 'spy' ? data.spyKPIs : (data as any).commentKPIs;
      const wf = entityKey === 'spy' ? data.spyWaterfall : (data as any).commentWaterfall;

      const fixture = ENTITY_MONTH_FIXTURES[entityKey][monthId];

      it('a une source normalisée disponible + fixture figée', () => {
        expect(facts).toBeTruthy();
        expect(kpis).toBeTruthy();
        expect(wf).toBeTruthy();
        expect(fixture, `fixture manquante : ${entityKey}/${monthId}`).toBeTruthy();
        // facts doit aussi matcher la fixture (même source que vue groupe)
        expect(Math.round(facts!.ca)).toBe(fixture!.ca);
        expect(Math.round(facts!.charges)).toBe(fixture!.charges);
        expect(Math.round(facts!.contribution)).toBe(fixture!.contribution);
      });

      it('KPI CA = fixture.ca (même source que pies / overview)', () => {
        const kpiCA = findKpi(kpis, 'CA');
        expect(kpiCA, 'KPI "CA" introuvable').toBeTruthy();
        expect(parseUSD(kpiCA.value)).toBeCloseTo(fixture!.ca, -Math.log10(TOLERANCE_USD));
      });

      it('KPI Marge Nette = fixture.contribution', () => {
        const kpi = findKpi(kpis, 'Marge Nette');
        expect(kpi, 'KPI "Marge Nette" introuvable').toBeTruthy();
        expect(parseUSD(kpi.value)).toBeCloseTo(fixture!.contribution, -Math.log10(TOLERANCE_USD));
      });

      it('KPI Total Charges = fixture.charges', () => {
        const kpi = findKpi(kpis, 'Total Charges');
        expect(kpi, 'KPI "Total Charges" introuvable').toBeTruthy();
        expect(parseUSD(kpi.value)).toBeCloseTo(fixture!.charges, -Math.log10(TOLERANCE_USD));
      });

      it('Waterfall : ligne CA = fixture.ca', () => {
        const row = findWfRow(wf, 'CA');
        expect(row).toBeTruthy();
        expect(parseUSD(row.value)).toBeCloseTo(fixture!.ca, -Math.log10(TOLERANCE_USD));
      });

      it('Waterfall : TOTAL CHARGES = fixture.charges (négatif)', () => {
        const row = findWfRow(wf, 'TOTAL CHARGES');
        expect(row).toBeTruthy();
        expect(Math.abs(parseUSD(row.value))).toBeCloseTo(fixture!.charges, -Math.log10(TOLERANCE_USD));
      });

      it('Waterfall : MARGE NETTE = fixture.contribution', () => {
        const row = findWfRow(wf, 'MARGE NETTE');
        expect(row).toBeTruthy();
        expect(parseUSD(row.value)).toBeCloseTo(fixture!.contribution, -Math.log10(TOLERANCE_USD));
      });

      it('Identité comptable : Marge Nette ≈ CA − Total Charges', () => {
        const diff = fixture!.contribution - (fixture!.ca - fixture!.charges);
        expect(Math.abs(diff)).toBeLessThanOrEqual(TOLERANCE_USD);
      });
    });
  },
);
