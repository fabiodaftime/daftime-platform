// ============================================================================
// Tests d'intégration — Round-trip Supabase ↔ rounding.ts
// ----------------------------------------------------------------------------
// Postgres `numeric` préserve la précision arbitraire : si on écrit 123.456789
// en base, on relit 123.456789. La règle d'arrondi au centime DOIT donc être
// appliquée côté client, et de manière cohérente entre l'écriture (writer) et
// la lecture (reader).
//
// Stratégie : on monte un mock Supabase minimal qui imite le comportement
// `numeric` (round-trip exact, peut renvoyer string ou number selon
// PostgREST), puis on vérifie :
//   1. `roundMoney` est idempotent à travers le round-trip
//   2. `normalizeMoneyFromDb` rattrape les valeurs non-arrondies (defensive)
//   3. `assertRoundedMoney` bloque l'écriture si la valeur n'est pas arrondie
//   4. Les montants relus respectent la précision de la devise (USD/EUR/AED)
//   5. Les sommes calculées après lecture égalent les sommes écrites au centime
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  roundMoney,
  assertRoundedMoney,
  normalizeMoneyFromDb,
  sumMoney,
  marginPct,
  type SupportedCurrency,
} from '../rounding';

// ----------------------------------------------------------------------------
// Mock Supabase "numeric" — préserve la précision exacte comme Postgres
// ----------------------------------------------------------------------------
interface MoneyRow {
  id: string;
  entity_code: string;
  amount: number | string; // PostgREST peut renvoyer string pour numeric
  currency: SupportedCurrency;
}

class FakeNumericTable {
  private rows: MoneyRow[] = [];
  private counter = 0;

  /** Imite `.insert()` — accepte la valeur telle quelle (pas de coercition). */
  insert(row: Omit<MoneyRow, 'id'>): MoneyRow {
    // Simule Postgres `numeric` : la valeur est stockée exactement.
    const stored: MoneyRow = { id: `r${++this.counter}`, ...row };
    this.rows.push(stored);
    return stored;
  }

  /** Imite `.select()` — peut renvoyer number OU string (selon PostgREST). */
  selectAll(returnAsString = false): MoneyRow[] {
    return this.rows.map((r) => ({
      ...r,
      amount: returnAsString ? String(r.amount) : Number(r.amount),
    }));
  }

  reset() {
    this.rows = [];
    this.counter = 0;
  }
}

const CURRENCIES: SupportedCurrency[] = ['USD', 'EUR', 'AED'];

describe('Round-trip Supabase ↔ rounding (writer arrondit, reader vérifie)', () => {
  const table = new FakeNumericTable();
  beforeEach(() => table.reset());

  describe.each(CURRENCIES)('[%s]', (currency) => {
    it('valeur arrondie à l\'écriture → relue identique au centime', () => {
      const samples = [0, 0.01, 0.10, 123.45, -98.76, 1_234_567.89];
      for (const raw of samples) {
        const rounded = roundMoney(raw, currency);
        assertRoundedMoney(rounded, currency); // garde-fou pré-write
        table.insert({ entity_code: 'X', amount: rounded, currency });
      }
      const rows = table.selectAll(false);
      const readBack = rows.map((r) => normalizeMoneyFromDb(r.amount, currency));
      const expected = samples.map((v) => roundMoney(v, currency));
      expect(readBack).toEqual(expected);
    });

    it('artefact flottant écrit brut → reader rattrape via normalize', () => {
      // Cas pathologique : un dev oublie roundMoney() avant write.
      table.insert({ entity_code: 'X', amount: 0.1 + 0.2, currency }); // 0.30000000000000004
      const [row] = table.selectAll(false);
      expect(normalizeMoneyFromDb(row.amount, currency)).toBe(0.3);
    });

    it('PostgREST renvoie une string → normalize parse + arrondit', () => {
      table.insert({ entity_code: 'X', amount: 999.995, currency });
      const [row] = table.selectAll(true); // mode string
      expect(typeof row.amount).toBe('string');
      expect(normalizeMoneyFromDb(row.amount, currency)).toBe(1000); // 999.995 → 1000.00
    });

    it('null / undefined / "" → 0 (jamais NaN)', () => {
      expect(normalizeMoneyFromDb(null, currency)).toBe(0);
      expect(normalizeMoneyFromDb(undefined, currency)).toBe(0);
      expect(normalizeMoneyFromDb('', currency)).toBe(0);
      expect(normalizeMoneyFromDb('abc', currency)).toBe(0);
    });

    it('assertRoundedMoney bloque une valeur sur-précise avant write', () => {
      expect(() => assertRoundedMoney(123.456, currency)).toThrow(/précision/);
      expect(() => assertRoundedMoney(NaN, currency)).toThrow(/non finie/);
      // mais accepte les valeurs déjà conformes
      expect(() => assertRoundedMoney(123.45, currency)).not.toThrow();
      expect(() => assertRoundedMoney(-0, currency)).not.toThrow();
    });

    it('Σ après relecture = Σ avant écriture (centime exact)', () => {
      const ventes = [1234.56, 789.01, 0.10, 0.10, 0.10];
      const totalAvant = sumMoney(ventes, currency);
      ventes.forEach((v) =>
        table.insert({ entity_code: 'V', amount: roundMoney(v, currency), currency }),
      );
      const rows = table.selectAll(false);
      const totalApres = sumMoney(
        rows.map((r) => normalizeMoneyFromDb(r.amount, currency)),
        currency,
      );
      expect(totalApres).toBe(totalAvant);
    });

    it('Marge % calculée depuis valeurs relues = depuis valeurs écrites', () => {
      const ca = roundMoney(1000, currency);
      const marge = roundMoney(333.33, currency);
      table.insert({ entity_code: 'CA', amount: ca, currency });
      table.insert({ entity_code: 'MARGE', amount: marge, currency });
      const rows = table.selectAll(true); // pire cas : string
      const caRead = normalizeMoneyFromDb(rows[0].amount, currency);
      const margeRead = normalizeMoneyFromDb(rows[1].amount, currency);
      expect(marginPct(margeRead, caRead)).toBe(marginPct(marge, ca));
    });
  });
});

// ----------------------------------------------------------------------------
// Scénario réel : 12 mois × 3 entités, persistance + agrégation
// ----------------------------------------------------------------------------
describe('Round-trip multi-mois × multi-entités (USD)', () => {
  it('agrégat mensuel post-relecture = agrégat pré-écriture (centime exact)', () => {
    const table = new FakeNumericTable();
    const entities = ['core', 'spy', 'comment'];
    const monthlyValues = entities.map((_, i) =>
      Array.from({ length: 12 }, (_, m) => 1000 + i * 100 + m * 0.07),
    );

    // Write
    entities.forEach((e, i) =>
      monthlyValues[i].forEach((v) =>
        table.insert({ entity_code: e, amount: roundMoney(v, 'USD'), currency: 'USD' }),
      ),
    );

    // Read + sum
    const rows = table.selectAll(true);
    const total = sumMoney(
      rows.map((r) => normalizeMoneyFromDb(r.amount, 'USD')),
      'USD',
    );

    // Référence : somme directe des valeurs arrondies
    const ref = sumMoney(
      monthlyValues.flat().map((v) => roundMoney(v, 'USD')),
      'USD',
    );

    expect(total).toBe(ref);
  });
});
