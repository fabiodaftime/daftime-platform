// Non-régression Flux Intercos — vue simplifiée Avril 2026.
// Vérifie uniquement les 3 indicateurs visibles :
//   • Somme à Remonter  (= ytd des transferts attendus)
//   • Somme Remontée    (= cash effectivement reçu par la Holding)
//   • Solde             (= à Remonter - Remontée)
// + structure du tableau : 1 colonne par mois source + Total à Remonter (ytd).

import { describe, it, expect } from 'vitest';
import { computeIntercos } from '../pcGroupIntercosCompute';
import { INTERCO_RULES, computeExpectedTransfer } from '../intercosRules';
import { INTERCOS_CASH } from '../manualEntities';
import type { PCGSourceMonthId } from '../sources/entityAdapters';

const VIEW: PCGSourceMonthId = 'apr-2026';
const SOURCE_MONTHS: PCGSourceMonthId[] = ['jan-2026', 'feb-2026', 'mar-2026', 'apr-2026'];

const parseUSD = (s: string) => Number(String(s).replace(/[^0-9.-]/g, '')) || 0;

describe('Flux Intercos — vue simplifiée Avril 2026', () => {
  const intercos = computeIntercos(VIEW);

  // Sources de vérité recalculées à partir des mêmes adapters que la vue groupe.
  const expectedToRemit = SOURCE_MONTHS.reduce(
    (acc, m) => acc + INTERCO_RULES.reduce((a, r) => a + computeExpectedTransfer(r, m), 0),
    0,
  );
  const expectedReceived = SOURCE_MONTHS.reduce((acc, m) => {
    const block = INTERCOS_CASH[m];
    if (!block) return acc;
    return acc + Object.values(block.received).reduce<number>((s, v) => s + (v ?? 0), 0);
  }, 0);
  const expectedSolde = Math.max(0, expectedToRemit - expectedReceived);

  describe('KPIs (3 cartes)', () => {
    it('expose exactement 3 cartes : à Remonter / Remontée / Solde', () => {
      expect(intercos.kpis).toHaveLength(3);
      const labels = intercos.kpis.map((k: any) => k.label);
      expect(labels).toEqual(['Somme à Remonter', 'Somme Remontée', 'Solde']);
    });

    it('Somme à Remonter = total YTD des transferts attendus', () => {
      expect(Math.abs(parseUSD(intercos.kpis[0].value) - Math.round(expectedToRemit)))
        .toBeLessThanOrEqual(INTERCO_RULES.length * SOURCE_MONTHS.length);
    });

    it('Somme Remontée = total cash reçu par la Holding', () => {
      expect(Math.abs(parseUSD(intercos.kpis[1].value) - Math.round(expectedReceived)))
        .toBeLessThanOrEqual(1);
    });

    it('Solde = Somme à Remonter - Somme Remontée (clamp ≥ 0)', () => {
      expect(Math.abs(parseUSD(intercos.kpis[2].value) - Math.round(expectedSolde)))
        .toBeLessThanOrEqual(INTERCO_RULES.length * SOURCE_MONTHS.length);
    });

    it('aucun KPI ne mentionne "exigible" ou "non exigible"', () => {
      const blob = JSON.stringify(intercos.kpis).toLowerCase();
      expect(blob).not.toMatch(/exigible/);
    });
  });

  describe('Tableau détail', () => {
    const table = intercos.table;

    it('1 colonne par mois source (jan, fév, mars, avril)', () => {
      expect(table.columns.map((c: any) => c.key)).toEqual(SOURCE_MONTHS);
    });

    it('chaque ligne : Total à Remonter = somme des montants mensuels affichés', () => {
      table.rows.forEach((row: any) => {
        const monthsSum = SOURCE_MONTHS.reduce((a, m) => a + parseUSD(row[m] ?? ''), 0);
        // Tolérance : arrondi à l'unité × nb mois ; on autorise aussi les
        // cellules non-numériques ("Inclus Digit") qui parsent à 0.
        expect(Math.abs(parseUSD(row.ytd) - monthsSum)).toBeLessThanOrEqual(SOURCE_MONTHS.length);
      });
    });

    it('total : Total à Remonter = somme des lignes', () => {
      const sumRowsYtd = table.rows.reduce((a: number, r: any) => a + parseUSD(r.ytd), 0);
      expect(Math.abs(parseUSD(table.total.ytd) - sumRowsYtd))
        .toBeLessThanOrEqual(INTERCO_RULES.length);
    });
  });
});
