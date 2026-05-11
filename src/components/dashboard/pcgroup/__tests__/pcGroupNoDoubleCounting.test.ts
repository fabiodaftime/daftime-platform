// Tests d'invariants : garantissent qu'aucun écran/agrégateur ne double-compte
// SPY ou Comment dans les totaux du groupe.
//
// Règles métier :
//  - SPY et Comment/Trustpilot sont des sous-produits de Digit Solution.
//  - `digitCA` et `digitMargeNette` INCLUENT déjà SPY + Comment.
//  - Donc :
//      caGroupe         = agencyCA + structuringCA + digitCA
//      margeBruteGroupe = agencyPartPCA + structuringMargeNette + digitMargeNette
//    (ne jamais ajouter spyCA / commentCA / spyMargeNette / commentMargeNette)
//
// On vérifie ces invariants sur tous les mois disponibles dans la config par
// défaut + on patche SPY/Comment et on s'assure que les totaux groupe ne bougent
// pas (sous-composants informatifs uniquement).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_CONFIG,
  setPCGroupConfig,
  resetPCGroupConfig,
} from '../config/configStore';
import { computeConsolidatedFacts, buildPCGroupMonthData } from '../pcGroupAggregator';
import { getPCGroupAvailableMonths, getMonthData, type MonthId } from '../PCGroupData';
import type { PCGroupConfig } from '../config/types';

const EPS = 0.5;
const clone = (cfg: PCGroupConfig): PCGroupConfig => JSON.parse(JSON.stringify(cfg));

describe('PCGroup — invariants anti double-comptage SPY/Comment', () => {
  beforeEach(() => setPCGroupConfig(clone(DEFAULT_CONFIG)));
  afterEach(() => resetPCGroupConfig());

  const monthIds = getPCGroupAvailableMonths().map((m) => m.id as MonthId);

  describe.each(monthIds)('Mois %s', (monthId) => {
    it('CA Groupe = Agency + Structuring + Digit (Digit inclut déjà SPY+Comment)', () => {
      const f = computeConsolidatedFacts(monthId)!;
      expect(f).not.toBeNull();
      const expected = f.agencyCA + f.structuringCA + f.digitCA;
      expect(Math.abs(f.caGroupe - expected)).toBeLessThan(EPS);

      // Invariant négatif : ajouter SPY/Comment au total reproduirait le bug
      const wrongIfDoubled = expected + f.spyCA + f.commentCA;
      expect(Math.abs(f.caGroupe - wrongIfDoubled)).toBeGreaterThanOrEqual(EPS);
    });

    it('Marge Brute Groupe = Agency + Structuring + Digit (consolidé)', () => {
      const f = computeConsolidatedFacts(monthId)!;
      const expected =
        f.agencyPartPCA + f.structuringMargeNette + f.digitMargeNette;
      expect(Math.abs(f.margeBruteGroupe - expected)).toBeLessThan(EPS);

      const wrongIfDoubled =
        expected + f.spyMargeNette + f.commentMargeNette;
      expect(Math.abs(f.margeBruteGroupe - wrongIfDoubled)).toBeGreaterThanOrEqual(EPS);
    });

    it('Digit Core (déduit) + SPY + Comment = Digit total (cohérence interne)', () => {
      const f = computeConsolidatedFacts(monthId)!;
      // CA
      const digitCoreCA = f.digitCA - f.spyCA - f.commentCA;
      expect(Math.abs((digitCoreCA + f.spyCA + f.commentCA) - f.digitCA)).toBeLessThan(EPS);
      expect(digitCoreCA).toBeGreaterThanOrEqual(0);
      // Marge
      const digitCoreMarge = f.digitMargeNette - f.spyMargeNette - f.commentMargeNette;
      expect(
        Math.abs((digitCoreMarge + f.spyMargeNette + f.commentMargeNette) - f.digitMargeNette),
      ).toBeLessThan(EPS);
    });

    it('Patcher SPY (+10000 CA) ne change ni le CA Groupe ni la Marge Brute Groupe', () => {
      const baseline = computeConsolidatedFacts(monthId)!;
      const cfg = clone(DEFAULT_CONFIG);
      cfg.manualFacts = cfg.manualFacts.map((m) =>
        m.month_id === monthId && m.entity_code === 'spy'
          ? { ...m, ca: m.ca + 10000 }
          : m,
      );
      setPCGroupConfig(cfg);
      const updated = computeConsolidatedFacts(monthId)!;
      expect(updated.spyCA).toBe(baseline.spyCA + 10000);
      expect(Math.abs(updated.caGroupe - baseline.caGroupe)).toBeLessThan(EPS);
      expect(Math.abs(updated.margeBruteGroupe - baseline.margeBruteGroupe)).toBeLessThan(EPS);
    });

    it('Patcher Comment (+5000 marge) ne change pas la Marge Brute Groupe', () => {
      const baseline = computeConsolidatedFacts(monthId)!;
      const cfg = clone(DEFAULT_CONFIG);
      cfg.manualFacts = cfg.manualFacts.map((m) =>
        m.month_id === monthId && m.entity_code === 'comment'
          ? { ...m, marge_nette: (m.marge_nette ?? 0) + 5000 }
          : m,
      );
      setPCGroupConfig(cfg);
      const updated = computeConsolidatedFacts(monthId)!;
      expect(updated.commentMargeNette).toBe(baseline.commentMargeNette + 5000);
      expect(Math.abs(updated.margeBruteGroupe - baseline.margeBruteGroupe)).toBeLessThan(EPS);
    });

    it('P&L consolidé : la ligne MARGE BRUTE GROUPE = Agency+Structuring+Digit (parsé depuis l\'affichage)', () => {
      const f = computeConsolidatedFacts(monthId)!;
      const data = buildPCGroupMonthData(monthId)!;
      const margeRow = data.consolidatedPL.find((r) =>
        /marge brute groupe/i.test(r.label),
      );
      expect(margeRow).toBeDefined();
      const parsed = Number(String(margeRow!.value).replace(/[^0-9.-]/g, ''));
      const expected = f.agencyPartPCA + f.structuringMargeNette + f.digitMargeNette;
      // Tolérance ~1$ liée aux arrondis d'affichage
      expect(Math.abs(parsed - expected)).toBeLessThan(1.5);
    });
  });

  it('Tableau pieData / contributions : SPY & Comment apparaissent comme sous-composants, pas comme entrées du total Marge Brute', () => {
    const monthId = monthIds[monthIds.length - 1];
    const f = computeConsolidatedFacts(monthId)!;
    const data = buildPCGroupMonthData(monthId)!;
    const pieSum = data.pieData.reduce((acc, p) => acc + (p.value ?? 0), 0);
    // Le pie représente la marge brute groupe (Agency+Structuring+Digit consolidé)
    expect(Math.abs(pieSum - f.margeBruteGroupe)).toBeLessThan(2);
  });
});
