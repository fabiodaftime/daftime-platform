// Non-régression : structure du tableau Flux Intercos pour Avril 2026.
// Vérifie :
//   1) exactement 1 colonne par mois source (jan, fév, mars, avril)
//   2) la colonne "Non Exigible" = somme des transferts dont due-date > view
//   3) la colonne YTD (par ligne et total) = exigible + non-exigible
// Source de vérité : INTERCO_RULES + computeExpectedTransfer (mêmes adapters
// que la vue Groupe).

import { describe, it, expect } from 'vitest';
import { computeIntercos } from '../pcGroupIntercosCompute';
import { INTERCO_RULES, computeExpectedTransfer } from '../intercosRules';
import type { PCGSourceMonthId } from '../sources/entityAdapters';

const VIEW: PCGSourceMonthId = 'apr-2026';
const SOURCE_MONTHS: PCGSourceMonthId[] = ['jan-2026', 'feb-2026', 'mar-2026', 'apr-2026'];

// Parse "$1,234" / "-$1,234" → number
const parseUSD = (s: string) =>
  Number(String(s).replace(/[^0-9.-]/g, '')) || 0;

describe('Flux Intercos — tableau Avril 2026', () => {
  const intercos = computeIntercos(VIEW);
  const table = intercos.table;

  it('expose exactement 1 colonne par mois source (jan, fév, mars, avril)', () => {
    const monthCols = table.columns.map((c: any) => c.key);
    expect(monthCols).toEqual(SOURCE_MONTHS);
    expect(table.columns).toHaveLength(SOURCE_MONTHS.length);
  });

  it('flag isExigible cohérent : jan/fév/mars exigibles en avril, avril non-exigible', () => {
    const flags = Object.fromEntries(
      table.columns.map((c: any) => [c.key, c.isExigible]),
    );
    expect(flags['jan-2026']).toBe(true);
    expect(flags['feb-2026']).toBe(true);
    expect(flags['mar-2026']).toBe(true);
    expect(flags['apr-2026']).toBe(false);
  });

  it('expose 1 ligne par règle interco (5 entités) + 1 total', () => {
    expect(table.rows).toHaveLength(INTERCO_RULES.length);
    expect(table.total.entity).toBe('TOTAL ATTENDU');
  });

  it('chaque ligne : Non Exigible = transfert d\'avril ; YTD = exigible + non-exigible', () => {
    INTERCO_RULES.forEach((rule, i) => {
      const row = table.rows[i];
      const expectedAprUsd = Math.round(computeExpectedTransfer(rule, 'apr-2026'));
      const expectedExigUsd = Math.round(
        ['jan-2026', 'feb-2026', 'mar-2026']
          .map((m) => computeExpectedTransfer(rule, m as PCGSourceMonthId))
          .reduce((a, b) => a + b, 0),
      );

      expect(parseUSD(row.notYetDue)).toBe(expectedAprUsd);
      expect(parseUSD(row.exigible)).toBe(expectedExigUsd);
      expect(parseUSD(row.ytd)).toBe(expectedExigUsd + expectedAprUsd);
    });
  });

  it('total : Non Exigible et YTD = somme des lignes', () => {
    const sumRows = (key: string) =>
      table.rows.reduce((a: number, r: any) => a + parseUSD(r[key]), 0);

    expect(parseUSD(table.total.notYetDue)).toBe(sumRows('notYetDue'));
    expect(parseUSD(table.total.ytd)).toBe(sumRows('ytd'));
    expect(parseUSD(table.total.exigible)).toBe(sumRows('exigible'));
    // Identité comptable : YTD total = exigible total + non-exigible total
    expect(parseUSD(table.total.ytd)).toBe(
      parseUSD(table.total.exigible) + parseUSD(table.total.notYetDue),
    );
  });
});
