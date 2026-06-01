// ============================================================================
// Tests de non-régression — Consolidation Digit Group EXACTE au centime
// ----------------------------------------------------------------------------
// Vérifie que TOUTES les métriques exposées par le consolidator sont la
// somme contractuelle stricte des entités (core + spy + comment) :
//   - CA
//   - Charges (CA - Marge)
//   - Marge nette
//   - Marge % (recalculée depuis la somme, jamais moyennée)
//   - Évolution mensuelle (delta M/M-1) = somme des deltas par entité
//
// "Au centime" = égalité stricte (===) sur des sommes en nombre, pas
// d'arrondi intermédiaire dans le consolidator.
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  consolidateDigitGroup,
} from '../contract/digitGroupConsolidator';
import {
  getDigitEntityPnL,
  DIGIT_GROUP_MAPPING,
} from '../contract/digitEntityContract';
import { DIGIT_AVAILABLE_MONTHS } from '../DigitData';

const MONTHS = DIGIT_AVAILABLE_MONTHS.map((m) => m.id);

describe('Digit conso — somme exacte au centime des entités', () => {
  for (const monthId of MONTHS) {
    describe(`mois ${monthId}`, () => {
      const group = consolidateDigitGroup(monthId);
      const entities = DIGIT_GROUP_MAPPING.map((e) => getDigitEntityPnL(e, monthId));

      it('CA group === Σ CA entités (strict)', () => {
        const expected = entities.reduce((s, e) => s + e.ca, 0);
        expect(group.ca).toBe(expected);
      });

      it('Marge group === Σ Marge entités (strict)', () => {
        const expected = entities.reduce((s, e) => s + e.marge, 0);
        expect(group.marge).toBe(expected);
      });

      it('Charges group === Σ Charges entités (strict)', () => {
        const expected = entities.reduce((s, e) => s + e.charges, 0);
        // group.charges = group.ca - group.marge, doit égaler Σ(ca_i - marge_i)
        expect(group.charges).toBeCloseTo(expected, 10);
      });

      it('Marge % recalculée depuis les sommes (jamais moyenne pondérée naïve)', () => {
        const sumCa = entities.reduce((s, e) => s + e.ca, 0);
        const sumMarge = entities.reduce((s, e) => s + e.marge, 0);
        const expectedPct = sumCa > 0 ? (sumMarge / sumCa) * 100 : 0;
        expect(group.margePct).toBeCloseTo(expectedPct, 10);
      });

      it('Deals group === Σ deals entités', () => {
        const expected = entities.reduce((s, e) => s + (e.deals ?? 0), 0);
        expect(group.deals).toBe(expected);
      });

      it('breakdown préserve ordre + identité des entités', () => {
        expect(group.breakdown.map((b) => b.entity)).toEqual([...DIGIT_GROUP_MAPPING]);
      });

      it('aucun NaN / Infinity dans les métriques consolidées', () => {
        for (const v of [group.ca, group.marge, group.charges, group.margePct, group.deals]) {
          expect(Number.isFinite(v)).toBe(true);
        }
      });
    });
  }
});

describe('Digit conso — évolution mensuelle = somme des évolutions par entité', () => {
  for (let i = 1; i < MONTHS.length; i++) {
    const prev = MONTHS[i - 1];
    const curr = MONTHS[i];

    it(`Δ CA (${prev} → ${curr}) group = Σ Δ CA entités`, () => {
      const gPrev = consolidateDigitGroup(prev);
      const gCurr = consolidateDigitGroup(curr);
      const deltaGroup = gCurr.ca - gPrev.ca;
      const deltaEntities = DIGIT_GROUP_MAPPING.reduce((s, e) => {
        return s + (getDigitEntityPnL(e, curr).ca - getDigitEntityPnL(e, prev).ca);
      }, 0);
      expect(deltaGroup).toBeCloseTo(deltaEntities, 10);
    });

    it(`Δ Marge (${prev} → ${curr}) group = Σ Δ Marge entités`, () => {
      const gPrev = consolidateDigitGroup(prev);
      const gCurr = consolidateDigitGroup(curr);
      const deltaGroup = gCurr.marge - gPrev.marge;
      const deltaEntities = DIGIT_GROUP_MAPPING.reduce((s, e) => {
        return s + (getDigitEntityPnL(e, curr).marge - getDigitEntityPnL(e, prev).marge);
      }, 0);
      expect(deltaGroup).toBeCloseTo(deltaEntities, 10);
    });

    it(`Δ Charges (${prev} → ${curr}) group = Σ Δ Charges entités`, () => {
      const gPrev = consolidateDigitGroup(prev);
      const gCurr = consolidateDigitGroup(curr);
      const deltaGroup = gCurr.charges - gPrev.charges;
      const deltaEntities = DIGIT_GROUP_MAPPING.reduce((s, e) => {
        return s + (getDigitEntityPnL(e, curr).charges - getDigitEntityPnL(e, prev).charges);
      }, 0);
      expect(deltaGroup).toBeCloseTo(deltaEntities, 10);
    });
  }
});

describe('Digit conso — invariant identité (CA = Charges + Marge) par entité ET au group', () => {
  for (const monthId of MONTHS) {
    it(`[${monthId}] CA group = Charges group + Marge group`, () => {
      const g = consolidateDigitGroup(monthId);
      expect(g.ca).toBeCloseTo(g.charges + g.marge, 10);
    });

    for (const e of DIGIT_GROUP_MAPPING) {
      it(`[${monthId}/${e}] CA = Charges + Marge`, () => {
        const p = getDigitEntityPnL(e, monthId);
        expect(p.ca).toBeCloseTo(p.charges + p.marge, 10);
      });
    }
  }
});
