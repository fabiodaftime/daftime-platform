// Garantit que le KPI "Somme Remontée" (receivedTotal) et le total de la
// colonne "Déjà Remonté" du tableau (totalReceived) sont calculés à partir
// de la même source (INTERCOS_CASH) et donnent la même valeur sur chaque
// mois de vue (jan → avril 2026).
//
// Régression : un filtre `dueIdx > viewIdx` excluait le mois courant du KPI,
// causant un écart visible (ex: 38k vs 128k). Ce test verrouille la parité.

import { describe, it, expect } from 'vitest';
import { computeIntercos } from '../pcGroupIntercosCompute';
import { INTERCOS_CASH } from '../manualEntities';
import type { PCGSourceMonthId } from '../sources/entityAdapters';

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
    });
  });
});
