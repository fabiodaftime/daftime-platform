// Non-regression : compare `getEntityMonth()` aux fixtures figées.
// Si une source amont change, ce test casse → mise à jour explicite
// requise dans `fixtures/entityMonthFixtures.ts`.

import { describe, it, expect } from 'vitest';
import { getEntityMonth } from '../sources/normalizedAdapters';
import {
  ENTITY_MONTH_FIXTURES,
  FIXTURE_ENTITIES,
  FIXTURE_MONTHS,
  FIXTURE_TOLERANCE_PCT,
  FIXTURE_TOLERANCE_USD,
} from './fixtures/entityMonthFixtures';

describe('getEntityMonth — fixtures figées (non-régression)', () => {
  for (const entity of FIXTURE_ENTITIES) {
    describe(`entité = ${entity}`, () => {
      for (const month of FIXTURE_MONTHS) {
        const fixture = ENTITY_MONTH_FIXTURES[entity][month];
        const label = `${month} match fixture`;
        if (!fixture) {
          it.skip(`${label} (no fixture)`, () => {});
          continue;
        }
        it(label, () => {
          const v = getEntityMonth(entity, month);
          expect(v, `getEntityMonth("${entity}","${month}") returned null`).toBeTruthy();
          expect(Math.abs(Math.round(v!.ca) - fixture.ca)).toBeLessThanOrEqual(FIXTURE_TOLERANCE_USD);
          expect(Math.abs(Math.round(v!.charges) - fixture.charges)).toBeLessThanOrEqual(FIXTURE_TOLERANCE_USD);
          expect(Math.abs(Math.round(v!.contribution) - fixture.contribution)).toBeLessThanOrEqual(FIXTURE_TOLERANCE_USD);
          expect(Math.abs(v!.marginPct - fixture.marginPct)).toBeLessThanOrEqual(FIXTURE_TOLERANCE_PCT);
        });
      }
    });
  }

  it('couvre toutes les entités et tous les mois déclarés', () => {
    for (const e of FIXTURE_ENTITIES) {
      for (const m of FIXTURE_MONTHS) {
        expect(
          ENTITY_MONTH_FIXTURES[e][m],
          `Fixture manquante : ${e}/${m}`,
        ).toBeTruthy();
      }
    }
  });
});
