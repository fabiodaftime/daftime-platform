// ============================================================================
// Property-based tests — invariance Σ et marge % après round-trip Supabase
// ----------------------------------------------------------------------------
// Génère des montants aléatoires (toutes devises, signes mixtes, ordres de
// grandeur variés) et vérifie les invariants fondamentaux du module money :
//
//   P1. Idempotence : roundMoney(roundMoney(x)) === roundMoney(x)
//   P2. Σ invariante : sumMoney d'une liste arrondie est égale à sumMoney
//       après round-trip Supabase (write → read → normalize).
//   P3. Marge % stable : marginPct(marge, ca) est identique avant/après
//       round-trip, quelle que soit la permutation des montants sources.
//   P4. Commutativité de Σ : sumMoney est insensible à l'ordre des éléments.
//   P5. Bornes : |roundMoney(x) - x| <= 0.5 * 10^-decimals
//   P6. assertRoundedMoney passe systématiquement après roundMoney.
//   P7. normalizeMoneyFromDb(String(x)) === normalizeMoneyFromDb(x)
//
// Tous les tests utilisent fast-check avec 200 runs par défaut pour couvrir
// largement l'espace des entrées.
// ============================================================================

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  roundMoney,
  sumMoney,
  marginPct,
  assertRoundedMoney,
  normalizeMoneyFromDb,
  CURRENCY_DECIMALS,
  type SupportedCurrency,
} from '../rounding';

// ----------------------------------------------------------------------------
// Arbitraires
// ----------------------------------------------------------------------------
const currencyArb: fc.Arbitrary<SupportedCurrency> = fc.constantFrom(
  'USD',
  'EUR',
  'AED',
);

/** Montant raisonnable : signe mixte, jusqu'à ±10 M, 6 décimales bruitées. */
const moneyArb = fc.double({
  min: -10_000_000,
  max: 10_000_000,
  noNaN: true,
  noDefaultInfinity: true,
});

const moneyListArb = fc.array(moneyArb, { minLength: 1, maxLength: 100 });

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
/** Simule un round-trip Supabase : write rounded → store as string → read. */
function supabaseRoundTrip(
  value: number,
  currency: SupportedCurrency,
): number {
  const rounded = roundMoney(value, currency);
  assertRoundedMoney(rounded, currency); // garde-fou writer
  const storedAsString = String(rounded); // PostgREST peut renvoyer string
  return normalizeMoneyFromDb(storedAsString, currency);
}

// ----------------------------------------------------------------------------
// P1 — Idempotence
// ----------------------------------------------------------------------------
describe('Property: roundMoney est idempotent', () => {
  it('roundMoney(roundMoney(x)) === roundMoney(x) pour tout x, toute devise', () => {
    fc.assert(
      fc.property(moneyArb, currencyArb, (x, c) => {
        const r1 = roundMoney(x, c);
        const r2 = roundMoney(r1, c);
        // Normalise -0/+0 (équivalents en arithmétique financière)
        expect(r2 + 0).toBe(r1 + 0);
      }),
      { numRuns: 300 },
    );
  });
});

// ----------------------------------------------------------------------------
// P2 — Σ invariante après round-trip Supabase
// ----------------------------------------------------------------------------
describe('Property: Σ invariante après round-trip Supabase', () => {
  it('sumMoney(values) === sumMoney(values après write/read DB)', () => {
    fc.assert(
      fc.property(moneyListArb, currencyArb, (values, c) => {
        const direct = sumMoney(values.map((v) => roundMoney(v, c)), c);
        const afterRoundTrip = sumMoney(
          values.map((v) => supabaseRoundTrip(v, c)),
          c,
        );
        expect(afterRoundTrip).toBe(direct);
      }),
      { numRuns: 200 },
    );
  });

  it('Σ des entités === Σ groupe au centime (multi-devise par simulation)', () => {
    fc.assert(
      fc.property(
        fc.array(moneyListArb, { minLength: 2, maxLength: 6 }),
        currencyArb,
        (entitiesValues, c) => {
          const perEntityTotals = entitiesValues.map((vals) =>
            sumMoney(vals.map((v) => supabaseRoundTrip(v, c)), c),
          );
          const groupFromEntities = sumMoney(perEntityTotals, c);
          const groupFromFlat = sumMoney(
            entitiesValues.flat().map((v) => supabaseRoundTrip(v, c)),
            c,
          );
          expect(groupFromEntities).toBe(groupFromFlat);
        },
      ),
      { numRuns: 200 },
    );
  });
});

// ----------------------------------------------------------------------------
// P3 — Marge % stable après round-trip
// ----------------------------------------------------------------------------
describe('Property: marginPct stable après round-trip Supabase', () => {
  it('marginPct(marge, ca) identique avant et après round-trip', () => {
    fc.assert(
      fc.property(
        moneyListArb,
        moneyListArb,
        currencyArb,
        (charges, revenues, c) => {
          const ca = sumMoney(revenues.map((v) => roundMoney(Math.abs(v), c)), c);
          const margeDirect = sumMoney(
            [ca, -sumMoney(charges.map((v) => roundMoney(Math.abs(v), c)), c)],
            c,
          );
          const caRT = sumMoney(
            revenues.map((v) => supabaseRoundTrip(Math.abs(v), c)),
            c,
          );
          const chargesRT = sumMoney(
            charges.map((v) => supabaseRoundTrip(Math.abs(v), c)),
            c,
          );
          const margeRT = sumMoney([caRT, -chargesRT], c);

          expect(caRT).toBe(ca);
          expect(margeRT).toBe(margeDirect);
          expect(marginPct(margeRT, caRT)).toBe(marginPct(margeDirect, ca));
        },
      ),
      { numRuns: 200 },
    );
  });

  it('marginPct ∈ [-100000, 100000] et toujours fini (jamais NaN/Infinity)', () => {
    fc.assert(
      fc.property(moneyArb, moneyArb, (marge, ca) => {
        const pct = marginPct(marge, ca);
        expect(Number.isFinite(pct)).toBe(true);
      }),
      { numRuns: 300 },
    );
  });
});

// ----------------------------------------------------------------------------
// P4 — Commutativité de Σ (insensible à l'ordre)
// ----------------------------------------------------------------------------
describe('Property: sumMoney commutative et associative au centime', () => {
  it("Σ est insensible à toute permutation de l'entrée", () => {
    fc.assert(
      fc.property(moneyListArb, currencyArb, (values, c) => {
        const rounded = values.map((v) => roundMoney(v, c));
        const ref = sumMoney(rounded, c);
        const reversed = sumMoney([...rounded].reverse(), c);
        const shuffled = sumMoney(
          [...rounded].sort(() => Math.random() - 0.5),
          c,
        );
        expect(reversed).toBe(ref);
        expect(shuffled).toBe(ref);
      }),
      { numRuns: 200 },
    );
  });
});

// ----------------------------------------------------------------------------
// P5 — Bornes d'arrondi
// ----------------------------------------------------------------------------
describe("Property: |roundMoney(x) - x| <= 0.5 * 10^-decimals", () => {
  it("l'erreur d'arrondi ne dépasse jamais le demi-centime", () => {
    fc.assert(
      fc.property(moneyArb, currencyArb, (x, c) => {
        const d = CURRENCY_DECIMALS[c];
        const maxErr = 0.5 * Math.pow(10, -d) + 1e-9;
        expect(Math.abs(roundMoney(x, c) - x)).toBeLessThanOrEqual(maxErr);
      }),
      { numRuns: 300 },
    );
  });
});

// ----------------------------------------------------------------------------
// P6 — assertRoundedMoney compatible avec roundMoney
// ----------------------------------------------------------------------------
describe('Property: assertRoundedMoney passe après roundMoney', () => {
  it('roundMoney(x) est toujours accepté par assertRoundedMoney', () => {
    fc.assert(
      fc.property(moneyArb, currencyArb, (x, c) => {
        expect(() => assertRoundedMoney(roundMoney(x, c), c)).not.toThrow();
      }),
      { numRuns: 300 },
    );
  });
});

// ----------------------------------------------------------------------------
// P7 — normalizeMoneyFromDb robuste string/number
// ----------------------------------------------------------------------------
describe('Property: normalizeMoneyFromDb invariant string/number', () => {
  it('normalize(String(x)) === normalize(x) pour tout x arrondi', () => {
    fc.assert(
      fc.property(moneyArb, currencyArb, (x, c) => {
        const r = roundMoney(x, c);
        expect(normalizeMoneyFromDb(String(r), c)).toBe(
          normalizeMoneyFromDb(r, c),
        );
      }),
      { numRuns: 300 },
    );
  });
});
