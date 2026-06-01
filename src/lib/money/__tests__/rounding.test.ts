// ============================================================================
// Tests — règles d'arrondi & précision au centime
// ----------------------------------------------------------------------------
// Verrouille les règles définies dans src/lib/money/rounding.ts pour chaque
// devise supportée (USD / EUR / AED) et chaque métrique (CA, charges,
// marge, marge %, évolution), sur les scénarios limites :
//   - artefacts flottants (0.1 + 0.2)
//   - demi-centime (0.005, -0.005)
//   - très grandes valeurs (millions/milliards)
//   - très petites valeurs (sub-centime)
//   - zéro, négatif, signes mixtes
//   - division par zéro (CA = 0, prev = 0)
//   - NaN / Infinity en entrée
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  roundHalfAwayFromZero,
  roundMoney,
  sumMoney,
  marginPct,
  evolutionAbs,
  evolutionPct,
  CURRENCY_DECIMALS,
  type SupportedCurrency,
} from '../rounding';

const CURRENCIES: SupportedCurrency[] = ['USD', 'EUR', 'AED'];

// ---------------------------------------------------------------------------
// roundHalfAwayFromZero — comportement de base
// ---------------------------------------------------------------------------
describe('roundHalfAwayFromZero', () => {
  it('arrondit 0.005 → 0.01 (half away from zero, pas banker)', () => {
    expect(roundHalfAwayFromZero(0.005, 2)).toBe(0.01);
  });
  it('arrondit -0.005 → -0.01 (symétrie autour de zéro)', () => {
    expect(roundHalfAwayFromZero(-0.005, 2)).toBe(-0.01);
  });
  it('arrondit 0.015 → 0.02 (pas 0.01 comme banker)', () => {
    expect(roundHalfAwayFromZero(0.015, 2)).toBe(0.02);
  });
  it('neutralise l\'artefact 0.1 + 0.2 = 0.30000000000000004', () => {
    expect(roundHalfAwayFromZero(0.1 + 0.2, 2)).toBe(0.3);
  });
  it('NaN → 0, Infinity → 0 (jamais propagé)', () => {
    expect(roundHalfAwayFromZero(NaN, 2)).toBe(0);
    expect(roundHalfAwayFromZero(Infinity, 2)).toBe(0);
    expect(roundHalfAwayFromZero(-Infinity, 2)).toBe(0);
  });
  it('idempotence : arrondir 2 fois = arrondir 1 fois', () => {
    const samples = [123.456, -98.7654, 0.005, 1_234_567.891];
    for (const v of samples) {
      const once = roundHalfAwayFromZero(v, 2);
      expect(roundHalfAwayFromZero(once, 2)).toBe(once);
    }
  });
});

// ---------------------------------------------------------------------------
// roundMoney / sumMoney — par devise
// ---------------------------------------------------------------------------
describe.each(CURRENCIES)('roundMoney + sumMoney [%s]', (cur) => {
  it(`arrondit à ${CURRENCY_DECIMALS[cur]} décimales`, () => {
    expect(roundMoney(123.4567, cur)).toBe(123.46);
    expect(roundMoney(-0.005, cur)).toBe(-0.01);
  });

  it('Σ de 100 × 0.1 = 10 exactement (pas 9.99...)', () => {
    const arr = Array(100).fill(0.1);
    expect(sumMoney(arr, cur)).toBe(10);
  });

  it('Σ avec demi-centimes : chaque item arrondi half-away-from-zero puis sommé', () => {
    // 0.005 → 0.01 (half away from zero), ×4 = 0.04
    expect(sumMoney([0.005, 0.005, 0.005, 0.005], cur)).toBe(0.04);
  });

  it('grandes valeurs (1B + 0.01) = 1_000_000_000.01', () => {
    expect(sumMoney([1_000_000_000, 0.01], cur)).toBe(1_000_000_000.01);
  });

  it('signes mixtes : 1234.56 + (-1234.56) = 0', () => {
    expect(sumMoney([1234.56, -1234.56], cur)).toBe(0);
  });

  it('liste vide → 0', () => {
    expect(sumMoney([], cur)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// marginPct — marge / CA × 100
// ---------------------------------------------------------------------------
describe.each(CURRENCIES)('marginPct [%s]', (_cur) => {
  it('marge=33.33, CA=100 → 33.33 %', () => {
    expect(marginPct(33.33, 100)).toBe(33.33);
  });
  it('arrondi à 0.01 % : 1/3 → 33.33 (pas 33.333...)', () => {
    expect(marginPct(1, 3)).toBe(33.33);
  });
  it('CA = 0 → 0 (jamais NaN, jamais Infinity)', () => {
    expect(marginPct(500, 0)).toBe(0);
  });
  it('CA négatif (cas remboursement net) reste défini', () => {
    expect(marginPct(-50, -100)).toBe(50);
  });
  it('marge négative → pct négatif', () => {
    expect(marginPct(-25, 100)).toBe(-25);
  });
  it('NaN / Infinity en CA → 0', () => {
    expect(marginPct(100, NaN)).toBe(0);
    expect(marginPct(100, Infinity)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// evolutionAbs / evolutionPct — M vs M-1
// ---------------------------------------------------------------------------
describe.each(CURRENCIES)('evolution [%s]', (cur) => {
  it('Δ absolu arrondi à la devise', () => {
    expect(evolutionAbs(100.005, 50, cur)).toBe(50.01);
  });
  it('Δ % : +50 → +100 = +100 %', () => {
    expect(evolutionPct(100, 50)).toBe(100);
  });
  it('Δ % : -50 → +50 = -200 % (utilise |prev|)', () => {
    expect(evolutionPct(50, -50)).toBe(200);
  });
  it('prev = 0 → null (non défini, jamais Infinity)', () => {
    expect(evolutionPct(100, 0)).toBeNull();
  });
  it('prev = 0 et curr = 0 → null', () => {
    expect(evolutionPct(0, 0)).toBeNull();
  });
  it('curr = prev → 0 %', () => {
    expect(evolutionPct(123.45, 123.45)).toBe(0);
  });
  it('arrondi à 0.01 % : 1 → 3 = +200 %', () => {
    expect(evolutionPct(3, 1)).toBe(200);
  });
  it('NaN / Infinity en prev → null', () => {
    expect(evolutionPct(100, NaN)).toBeNull();
    expect(evolutionPct(100, Infinity)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Scénarios intégrés : CA / Charges / Marge / Marge % / Évolution
// par devise, au centime près
// ---------------------------------------------------------------------------
describe.each(CURRENCIES)('Scénario complet métier [%s]', (cur) => {
  it('CA = Σ ventes, Charges = Σ coûts, Marge = CA - Charges (centime exact)', () => {
    const ventes = [1234.56, 789.01, 0.10, 0.10, 0.10]; // artefact flottant
    const couts = [500.005, 250.005, 100]; // demi-centime
    const ca = sumMoney(ventes, cur);
    const charges = sumMoney(couts, cur);
    const marge = roundMoney(ca - charges, cur);

    expect(ca).toBe(2023.87);
    expect(charges).toBe(850.02); // 500.01 + 250.01 + 100
    expect(marge).toBe(roundMoney(2023.87 - 850.02, cur));
    // Identité comptable : CA = Charges + Marge (au centime)
    expect(roundMoney(charges + marge, cur)).toBe(ca);
  });

  it('Marge % cohérente avec CA et Marge arrondis', () => {
    const ca = sumMoney([1000], cur);
    const marge = sumMoney([333.33], cur);
    expect(marginPct(marge, ca)).toBe(33.33);
  });

  it('Évolution M-1=0 sur une entité nouvellement créée → Δabs défini, Δ% = null', () => {
    expect(evolutionAbs(1234.56, 0, cur)).toBe(1234.56);
    expect(evolutionPct(1234.56, 0)).toBeNull();
  });

  it('Précision préservée sur 1000 itérations de 0.01', () => {
    const arr = Array(1000).fill(0.01);
    expect(sumMoney(arr, cur)).toBe(10);
  });
});
