// Garantit que le KPI "Somme Remontée" (receivedTotal) et le total de la
// colonne "Déjà Remonté" du tableau (totalReceived) sont calculés à partir
// de la même source (INTERCOS_CASH) et donnent la même valeur sur chaque
// mois de vue (jan → avril 2026).
//
// Régression : un filtre `dueIdx > viewIdx` excluait le mois courant du KPI,
// causant un écart visible (ex: 38k vs 128k). Ce test verrouille la parité.

import { describe, it, expect } from 'vitest';
import { computeIntercos } from '../pcGroupIntercosCompute';
import { INTERCOS_CASH, MANUAL_ENTITIES } from '../manualEntities';
import { digitFacts, type PCGSourceMonthId } from '../sources/entityAdapters';

const parseUSD = (s: string) => Number(String(s).replace(/[^0-9.-]/g, '')) || 0;
const MONTHS: PCGSourceMonthId[] = ['jan-2026', 'feb-2026', 'mar-2026', 'apr-2026'];
const TOL = 1; // arrondi USD

describe('Flux Intercos — parité receivedTotal vs totalReceived', () => {
  MONTHS.forEach((viewMonth) => {
    describe(`vue ${viewMonth}`, () => {
      const intercos = computeIntercos(viewMonth);

      // KPI "Somme Remontée" = 2e carte
      const kpiReceived = parseUSD(intercos.kpis[1].value);
      // Total de la colonne "Déjà Remonté" du tableau (clé `received`)
      const tableReceived = parseUSD(intercos.table.total.received);

      it('KPI Somme Remontée === Total tableau Déjà Remonté', () => {
        expect(Math.abs(kpiReceived - tableReceived)).toBeLessThanOrEqual(TOL);
      });

      it('= somme INTERCOS_CASH.received sur jan → vue (même source)', () => {
        const viewIdx = MONTHS.indexOf(viewMonth);
        const source = MONTHS.slice(0, viewIdx + 1).reduce((acc, sm) => {
          const block = INTERCOS_CASH[sm];
          if (!block) return acc;
          return (
            acc +
            Object.values(block.received).reduce<number>(
              (s, v) => s + (v ?? 0),
              0,
            )
          );
        }, 0);
        expect(Math.abs(kpiReceived - source)).toBeLessThanOrEqual(TOL);
        expect(Math.abs(tableReceived - source)).toBeLessThanOrEqual(TOL);
      });

      it('= somme par entité affichée dans le tableau', () => {
        const sumRows = intercos.table.rows.reduce(
          (a: number, r: any) => a + parseUSD(r.received),
          0,
        );
        expect(Math.abs(tableReceived - sumRows))
          .toBeLessThanOrEqual(intercos.table.rows.length);
      });

      it('Tableau Flux Intercos : chaque ligne entité = somme INTERCOS_CASH.received[entity] sur la période', () => {
        const viewIdx = MONTHS.indexOf(viewMonth);
        const period = MONTHS.slice(0, viewIdx + 1);
        intercos.table.rows.forEach((row: any) => {
          const key = row._key as string;
          const expected = period.reduce((acc, sm) => {
            const block = INTERCOS_CASH[sm];
            return acc + (block?.received?.[key as keyof typeof block.received] ?? 0);
          }, 0);
          expect(Math.abs(parseUSD(row.received) - expected)).toBeLessThanOrEqual(TOL);
        });
      });

      it('Tableau Flux Intercos : remaining = max(0, ytd − received) pour chaque ligne et le total', () => {
        intercos.table.rows.forEach((row: any) => {
          const expected = Math.max(0, parseUSD(row.ytd) - parseUSD(row.received));
          expect(Math.abs(parseUSD(row.remaining) - expected)).toBeLessThanOrEqual(TOL);
        });
        const total = intercos.table.total;
        const expectedTotal = Math.max(0, parseUSD(total.ytd) - parseUSD(total.received));
        expect(Math.abs(parseUSD(total.remaining) - expectedTotal)).toBeLessThanOrEqual(TOL);
      });
    });
  });
});

// ============================================================
// Phases métier : MaxScale (Jan/Fév) vs DG Solutions (Mars+), SPY isolé
// ============================================================
describe('Phases métier — MaxScale / DG Solutions / SPY isolé', () => {
  it('Aucune phase MaxScale ni SPY isolé en vue Janvier', () => {
    const i: any = computeIntercos('jan-2026');
    expect(i.maxScalePhase).not.toBeNull();
    expect(i.dgSolutionsPhase).toBeNull();
    expect(i.spyIsolated).toBeNull();
  });

  it('Vue Mars : phase MaxScale (Jan+Fév) + phase DG (Mars) + SPY isolé (Mars)', () => {
    const i: any = computeIntercos('mar-2026');
    expect(i.maxScalePhase).not.toBeNull();
    expect(i.dgSolutionsPhase).not.toBeNull();
    expect(i.spyIsolated).not.toBeNull();
  });

  it('DG remontable Mars+ = (digit + comment) × 90% — SPY EXCLU', () => {
    const i: any = computeIntercos('apr-2026');
    const period: PCGSourceMonthId[] = ['mar-2026', 'apr-2026'];
    const dg = period.reduce((a, m) => a + (digitFacts(m)?.margeNette ?? 0), 0);
    const comm = period.reduce((a, m) => a + (MANUAL_ENTITIES[m]?.comment.margeNette ?? 0), 0);
    const expected = (dg + comm) * 0.9;
    expect(Math.abs(parseUSD(i.dgSolutionsPhase.remontable) - expected)).toBeLessThanOrEqual(TOL);

    // SPY ne doit PAS être dans la base
    const spy = period.reduce((a, m) => a + (MANUAL_ENTITIES[m]?.spy.margeNette ?? 0), 0);
    const baseAvecSpy = (dg + comm + spy) * 0.9;
    expect(parseUSD(i.dgSolutionsPhase.remontable)).toBeLessThan(baseAvecSpy);
  });

  it('Pot MaxScale Jan+Fév = Σ (digit + comment + spy) margeNette', () => {
    const i: any = computeIntercos('feb-2026');
    const period: PCGSourceMonthId[] = ['jan-2026', 'feb-2026'];
    const sum = period.reduce((a, m) => {
      return a
        + (digitFacts(m)?.margeNette ?? 0)
        + (MANUAL_ENTITIES[m]?.comment.margeNette ?? 0)
        + (MANUAL_ENTITIES[m]?.spy.margeNette ?? 0);
    }, 0);
    expect(Math.abs(parseUSD(i.maxScalePhase.totalResultat) - sum)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(parseUSD(i.maxScalePhase.theorique) - sum * 0.9)).toBeLessThanOrEqual(TOL);
  });

  it('SPY isolé Mars+ = Σ spy facts ; cash SPY tracé séparément', () => {
    const i: any = computeIntercos('apr-2026');
    const period: PCGSourceMonthId[] = ['mar-2026', 'apr-2026'];
    const rev = period.reduce((a, m) => a + (MANUAL_ENTITIES[m]?.spy.ca ?? 0), 0);
    const prof = period.reduce((a, m) => a + (MANUAL_ENTITIES[m]?.spy.margeNette ?? 0), 0);
    const cash = period.reduce((a, m) => a + (INTERCOS_CASH[m]?.received?.spy ?? 0), 0);
    expect(Math.abs(parseUSD(i.spyIsolated.revenue) - rev)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(parseUSD(i.spyIsolated.profit) - prof)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(parseUSD(i.spyIsolated.cashRecu) - cash)).toBeLessThanOrEqual(TOL);
  });
});

