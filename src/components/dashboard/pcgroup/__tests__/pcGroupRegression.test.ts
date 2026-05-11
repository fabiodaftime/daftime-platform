// Régression PCGroup — Jan/Fév/Mars 2026
// ----------------------------------------
// Garde-fou : vérifie que l'aggregator (sources + manuel) produit exactement
// les valeurs consolidées historiques affichées dans PCGroupData.ts, et que
// les invariants (somme des marges = marge brute, réserves = 10%, résultat
// net = remontée − frais holding) sont respectés.

import { describe, it, expect } from 'vitest';
import {
  aggregatePCGroup,
  computeConsolidatedFacts,
  computeYTD,
  diagnoseMonth,
} from '../pcGroupAggregator';
import type { PCGSourceMonthId } from '../sources/entityAdapters';

interface Expected {
  caGroupe: number;
  margeBruteGroupe: number;
  reservesFiliales: number;
  remonteeHolding: number;
  resultatNetHolding: number;
}

// NB: depuis la consolidation SPY+Comment dans Digit (produits internes,
// déjà inclus dans digitFacts), les totaux Groupe ne les ajoutent plus —
// d'où la révision des valeurs attendues.
const EXPECTED: Record<'jan-2026' | 'feb-2026' | 'mar-2026', Expected> = {
  'jan-2026': {
    caGroupe: 179_337,
    margeBruteGroupe: 83_814,
    reservesFiliales: 8_381,
    remonteeHolding: 75_433,
    resultatNetHolding: 68_373,
  },
  'feb-2026': {
    caGroupe: 232_014,
    margeBruteGroupe: 77_674,
    reservesFiliales: 7_767,
    remonteeHolding: 69_907,
    resultatNetHolding: 59_017,
  },
  'mar-2026': {
    caGroupe: 221_860,
    margeBruteGroupe: 102_010,
    reservesFiliales: 10_201,
    remonteeHolding: 91_809,
    resultatNetHolding: 83_431,
  },
};

// Tolérance d'arrondi : les valeurs affichées sont arrondies au $ près.
const TOL = 1.5;

const MONTHS = Object.keys(EXPECTED) as Array<keyof typeof EXPECTED>;

describe('PCGroup — régression valeurs consolidées (Jan-Mars 2026)', () => {
  for (const monthId of MONTHS) {
    const exp = EXPECTED[monthId];

    describe(monthId, () => {
      const facts = computeConsolidatedFacts(monthId as PCGSourceMonthId);

      it('le mois est aggrégeable (toutes sources présentes)', () => {
        expect(facts).not.toBeNull();
        expect(diagnoseMonth(monthId as PCGSourceMonthId).ok).toBe(true);
      });

      it(`CA Groupe = ${exp.caGroupe}`, () => {
        expect(facts!.caGroupe).toBeCloseTo(exp.caGroupe, 0);
        expect(Math.abs(facts!.caGroupe - exp.caGroupe)).toBeLessThanOrEqual(TOL);
      });

      it(`Marge Brute Groupe = ${exp.margeBruteGroupe}`, () => {
        expect(Math.abs(facts!.margeBruteGroupe - exp.margeBruteGroupe)).toBeLessThanOrEqual(TOL);
      });

      it(`Réserves Filiales = ${exp.reservesFiliales}`, () => {
        expect(Math.abs(facts!.reservesFiliales - exp.reservesFiliales)).toBeLessThanOrEqual(TOL);
      });

      it(`Remontée Holding = ${exp.remonteeHolding}`, () => {
        expect(Math.abs(facts!.remonteeHolding - exp.remonteeHolding)).toBeLessThanOrEqual(TOL);
      });

      it(`Résultat Net Holding = ${exp.resultatNetHolding}`, () => {
        expect(Math.abs(facts!.resultatNetHolding - exp.resultatNetHolding)).toBeLessThanOrEqual(TOL);
      });
    });
  }
});

describe('PCGroup — invariants de cohérence', () => {
  for (const monthId of MONTHS) {
    describe(monthId, () => {
      const f = computeConsolidatedFacts(monthId as PCGSourceMonthId)!;

      it('somme Agency + Structuring + Digit (consolidé) = Marge Brute Groupe', () => {
        // SPY et Comment sont des produits inclus dans digitMargeNette.
        const sum = f.agencyPartPCA + f.structuringMargeNette + f.digitMargeNette;
        expect(Math.abs(sum - f.margeBruteGroupe)).toBeLessThan(0.01);
      });

      it('somme Agency + Structuring + Digit (consolidé) = CA Groupe', () => {
        const sum = f.agencyCA + f.structuringCA + f.digitCA;
        expect(Math.abs(sum - f.caGroupe)).toBeLessThan(0.01);
      });

      it('SPY et Comment sont inclus dans Digit (pas additionnés au groupe)', () => {
        // Invariant anti-double-comptage : SPY + Comment ≤ marge Digit totale.
        expect(f.spyMargeNette + f.commentMargeNette).toBeLessThanOrEqual(f.digitMargeNette + 0.01);
        expect(f.spyCA + f.commentCA).toBeLessThanOrEqual(f.digitCA + 0.01);
      });

      it('Réserves = 10% Marge Brute', () => {
        expect(Math.abs(f.reservesFiliales - f.margeBruteGroupe * 0.1)).toBeLessThan(0.01);
      });

      it('Remontée = 90% Marge Brute', () => {
        expect(Math.abs(f.remonteeHolding - f.margeBruteGroupe * 0.9)).toBeLessThan(0.01);
      });

      it('Résultat Net = Remontée − Frais Holding', () => {
        expect(Math.abs(f.resultatNetHolding - (f.remonteeHolding - f.fraisHolding))).toBeLessThan(0.01);
      });

      it('Distribution dirigeants = Résultat Net (à 1$ près)', () => {
        const sum = f.maxenceAmount + f.thibaultAmount + f.florianAmount;
        expect(Math.abs(sum - f.resultatNetHolding)).toBeLessThan(1);
      });
    });
  }

  it('YTD Mars = somme(Jan + Fév + Mars)', () => {
    const ytd = computeYTD('mar-2026');
    const expectedCa =
      EXPECTED['jan-2026'].caGroupe +
      EXPECTED['feb-2026'].caGroupe +
      EXPECTED['mar-2026'].caGroupe;
    const expectedMb =
      EXPECTED['jan-2026'].margeBruteGroupe +
      EXPECTED['feb-2026'].margeBruteGroupe +
      EXPECTED['mar-2026'].margeBruteGroupe;
    const expectedNet =
      EXPECTED['jan-2026'].resultatNetHolding +
      EXPECTED['feb-2026'].resultatNetHolding +
      EXPECTED['mar-2026'].resultatNetHolding;
    expect(Math.abs(ytd.caYTD - expectedCa)).toBeLessThanOrEqual(3);
    expect(Math.abs(ytd.margeBruteYTD - expectedMb)).toBeLessThanOrEqual(3);
    expect(Math.abs(ytd.resultatNetYTD - expectedNet)).toBeLessThanOrEqual(3);
  });

  it('aggregatePCGroup expose KPIs cohérents', () => {
    for (const monthId of MONTHS) {
      const agg = aggregatePCGroup(monthId as PCGSourceMonthId)!;
      expect(agg).not.toBeNull();
      expect(agg.kpis.caGroupe.raw).toBeCloseTo(agg.facts.caGroupe, 5);
      expect(agg.kpis.margeBrute.raw).toBeCloseTo(agg.facts.margeBruteGroupe, 5);
      // somme entityBreakdown agency+structuring+digit ≈ margeBruteGroupe
      // (spy/comment sont des sous-composantes informatives de digit)
      const sumBreakdown = agg.entityBreakdown
        .filter((e) => e.key === 'agency' || e.key === 'structuring' || e.key === 'digit')
        .reduce((a, e) => a + e.margeNette, 0);
      expect(Math.abs(sumBreakdown - Math.round(agg.facts.margeBruteGroupe))).toBeLessThanOrEqual(3);
    }
  });
});
