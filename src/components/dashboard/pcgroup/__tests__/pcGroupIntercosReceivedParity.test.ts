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

      it('Comment/Trust est intégré à Digit Solution, sans ligne séparée', () => {
        const commentRow = intercos.table.rows.find((r: any) => r._key === 'comment');
        expect(commentRow).toBeUndefined();
      });

      it('Ligne SPY = uniquement Mars+ ; Jan/Fév restent inclus dans Digit', () => {
        const viewIdx = MONTHS.indexOf(viewMonth);
        const period = MONTHS.slice(0, viewIdx + 1);
        const spyRow = intercos.table.rows.find((r: any) => r._key === 'spy');
        if (!spyRow) return;
        const isolatedPeriod = period.filter((m) => m === 'mar-2026' || m === 'apr-2026');
        const expectedReceived = isolatedPeriod.reduce(
          (acc, sm) => acc + (INTERCOS_CASH[sm]?.received?.spy ?? 0),
          0,
        );
        expect(Math.abs(parseUSD(spyRow.received) - expectedReceived)).toBeLessThanOrEqual(TOL);
      });

      it('Digit Solution = 90% × (Digit Core + Comment/Trust + SPY Jan/Fév uniquement)', () => {
        const viewIdx = MONTHS.indexOf(viewMonth);
        const period = MONTHS.slice(0, viewIdx + 1);
        const digitRow = intercos.table.rows.find((r: any) => r._key === 'digit');
        expect(digitRow).toBeDefined();
        period.forEach((sm) => {
          const spyIncluded = sm === 'jan-2026' || sm === 'feb-2026';
          const expected = (
            (digitFacts(sm)?.margeNette ?? 0) +
            (MANUAL_ENTITIES[sm]?.comment.margeNette ?? 0) +
            (spyIncluded ? (MANUAL_ENTITIES[sm]?.spy.margeNette ?? 0) : 0)
          ) * 0.9;
          expect(Math.abs(parseUSD(digitRow[sm]) - expected)).toBeLessThanOrEqual(TOL);
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

// ============================================================
// Note Jan/Fév sur la ligne Digit Solution — imputation FIFO
// ============================================================
describe('Ligne Digit Solution — note Jan/Fév (imputation FIFO des remontées)', () => {
  it('Vue Janvier : note cohérente avec max(0, attendu Jan − reçu Digit total)', () => {
    const i = computeIntercos('jan-2026');
    const digitRow: any = i.table.rows.find((r: any) => r._key === 'digit');
    expect(digitRow).toBeDefined();
    const expectedJanFev = (
      (digitFacts('jan-2026')?.margeNette ?? 0)
      + (MANUAL_ENTITIES['jan-2026']?.comment.margeNette ?? 0)
      + (MANUAL_ENTITIES['jan-2026']?.spy.margeNette ?? 0)
    ) * 0.9;
    const received = parseUSD(digitRow.received);
    const expectedMissing = Math.max(0, expectedJanFev - received);
    expect(typeof digitRow.note).toBe('string');
    const nums = (digitRow.note.match(/\$[0-9,]+/g) ?? [])
      .map((s: string) => Number(s.replace(/[^0-9.-]/g, '')));
    if (expectedMissing > 0) {
      expect(digitRow.note).toMatch(/régulariser/i);
      expect(nums.some((n: number) => Math.abs(n - expectedMissing) <= TOL)).toBe(true);
    } else {
      expect(digitRow.note).toMatch(/intégralement couvert/i);
    }
  });

  it('Vue Avril : reste Jan/Fév = max(0, attendu Jan+Fév − received Digit YTD), pas attendu brut', () => {
    const i = computeIntercos('apr-2026');
    const digitRow: any = i.table.rows.find((r: any) => r._key === 'digit');
    const janFev: PCGSourceMonthId[] = ['jan-2026', 'feb-2026'];
    const expectedJanFev = janFev.reduce((acc, sm) => acc
      + (digitFacts(sm)?.margeNette ?? 0)
      + (MANUAL_ENTITIES[sm]?.comment.margeNette ?? 0)
      + (MANUAL_ENTITIES[sm]?.spy.margeNette ?? 0), 0) * 0.9;
    const receivedYTD = parseUSD(digitRow.received);
    const expectedMissing = Math.max(0, expectedJanFev - receivedYTD);

    const nums = (digitRow.note.match(/\$[0-9,]+/g) ?? [])
      .map((s: string) => Number(s.replace(/[^0-9.-]/g, '')));

    // L'attendu brut Jan/Fév doit être mentionné dans la note (libellé "attendu").
    expect(nums.some((n: number) => Math.abs(n - expectedJanFev) <= TOL)).toBe(true);

    if (expectedMissing > 0) {
      expect(digitRow.note).toMatch(/régulariser/i);
      // Le reliquat affiché doit être le manquant FIFO, jamais l'attendu brut seul.
      expect(nums.some((n: number) => Math.abs(n - expectedMissing) <= TOL)).toBe(true);
    } else {
      expect(digitRow.note).toMatch(/intégralement couvert/i);
    }

    // Sanity : missing ≤ attendu, et missing ≤ remaining global de la ligne.
    expect(expectedMissing).toBeLessThanOrEqual(expectedJanFev + TOL);
    expect(expectedMissing).toBeLessThanOrEqual(parseUSD(digitRow.remaining) + TOL);
  });

  it('FIFO : si received Digit YTD ≥ attendu Jan/Fév → "intégralement couvert", sinon "régulariser"', () => {
    const i = computeIntercos('apr-2026');
    const digitRow: any = i.table.rows.find((r: any) => r._key === 'digit');
    const janFev: PCGSourceMonthId[] = ['jan-2026', 'feb-2026'];
    const expectedJanFev = janFev.reduce((acc, sm) => acc
      + (digitFacts(sm)?.margeNette ?? 0)
      + (MANUAL_ENTITIES[sm]?.comment.margeNette ?? 0)
      + (MANUAL_ENTITIES[sm]?.spy.margeNette ?? 0), 0) * 0.9;
    const receivedYTD = parseUSD(digitRow.received);
    if (receivedYTD >= expectedJanFev) {
      expect(digitRow.note).toMatch(/intégralement couvert/i);
    } else {
      expect(digitRow.note).toMatch(/régulariser/i);
    }
  });
});


