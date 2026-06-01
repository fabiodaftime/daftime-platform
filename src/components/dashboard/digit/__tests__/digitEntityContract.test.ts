// Verrouille le contrat Digit hybride (Option C).
//
// Invariants testés :
//   1. Le contrat retourne bien 3 entités (core/spy/comment) avec des chiffres
//      cohérents avec DigitData pour le fallback statique.
//   2. La conso group = somme stricte des 3 entités (pas de double-comptage).
//   3. L'adapter PCGroup `digitFacts` (vue Core only) renvoie le même CA et
//      la même marge que `getDigitEntityPnL('core', month)`.

import { describe, it, expect } from 'vitest';
import { getDigitEntityPnL, DIGIT_GROUP_MAPPING } from '../contract/digitEntityContract';
import { consolidateDigitGroup } from '../contract/digitGroupConsolidator';
import { DIGIT_AVAILABLE_MONTHS } from '../DigitData';
import { digitFacts } from '../../pcgroup/sources/entityAdapters';

describe('Digit hybrid contract (Option C)', () => {
  it('expose exactement 3 entités dans le mapping', () => {
    expect(DIGIT_GROUP_MAPPING).toEqual(['core', 'spy', 'comment']);
  });

  for (const m of DIGIT_AVAILABLE_MONTHS) {
    it(`[${m.id}] consolidation group = somme exacte des entités`, () => {
      const group = consolidateDigitGroup(m.id);
      const sumCa = group.breakdown.reduce((s, p) => s + p.ca, 0);
      const sumMarge = group.breakdown.reduce((s, p) => s + p.marge, 0);
      expect(group.ca).toBeCloseTo(sumCa, 6);
      expect(group.marge).toBeCloseTo(sumMarge, 6);
      expect(group.breakdown).toHaveLength(3);
    });

    it(`[${m.id}] adapter PCGroup.digitFacts == contrat core`, () => {
      const facts = digitFacts(m.id as any);
      const core = getDigitEntityPnL('core', m.id);
      expect(facts).not.toBeNull();
      // Tolérance d'arrondi pour les fallbacks historiques.
      expect(Math.abs((facts!.ca ?? 0) - core.ca)).toBeLessThan(2);
      expect(Math.abs((facts!.margeNette ?? 0) - core.marge)).toBeLessThan(2);
    });
  }
});
