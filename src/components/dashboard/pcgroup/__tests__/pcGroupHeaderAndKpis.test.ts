// Tests d'intégration légère : vérifie que le header/footer du dashboard
// consolidé et les KPIs (computeConsolidatedFacts + getMonthData) restent
// cohérents quand on ajoute / supprime un mois ou une entité dans la config.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_CONFIG,
  setPCGroupConfig,
  resetPCGroupConfig,
  getPCGroupConfig,
} from '../config/configStore';
import {
  buildHeaderSubtitle,
  countActiveEntities,
} from '../pcGroupHeaderLabels';
import { computeConsolidatedFacts } from '../pcGroupAggregator';
import { getMonthData, getPCGroupAvailableMonths, type MonthId } from '../PCGroupData';
import type { PCGEntityRow, PCGroupConfig } from '../config/types';

function clone(cfg: PCGroupConfig): PCGroupConfig {
  return JSON.parse(JSON.stringify(cfg));
}

describe('PCGroup — header/footer & KPIs réactifs aux changements de config', () => {
  beforeEach(() => {
    setPCGroupConfig(clone(DEFAULT_CONFIG));
  });
  afterEach(() => {
    resetPCGroupConfig();
  });

  // ----------------------- Header subtitle -----------------------
  describe('Sous-titre du header (Filiales + Holding)', () => {
    it('affiche "X Entité(s)" quand aucune entité Holding active', () => {
      const cfg = getPCGroupConfig();
      // Par défaut DEFAULT_CONFIG n'a pas d'entité base_role=holding
      const c = countActiveEntities(cfg.entities);
      expect(c.holding).toBe(0);
      expect(c.filiales).toBe(c.total);

      const subtitle = buildHeaderSubtitle(cfg.entities, 4);
      expect(subtitle).toBe(`${c.total} Entités • 4 mois disponibles`);
    });

    it('passe à "X Filiales + 1 Holding" dès qu\'on ajoute une Holding', () => {
      const cfg = clone(DEFAULT_CONFIG);
      const holding: PCGEntityRow = {
        id: 'd-holding',
        code: 'holding',
        name: 'Holding',
        badge: 'Group',
        gradient: '',
        css_class: 'holding',
        pie_color: '#0F1B3D',
        source_type: 'manual',
        base_role: 'holding',
        display_order: 99,
        is_active: true,
      };
      cfg.entities = [...cfg.entities, holding];
      setPCGroupConfig(cfg);

      const c = countActiveEntities(cfg.entities);
      expect(c.holding).toBe(1);
      expect(c.filiales).toBe(5);
      expect(buildHeaderSubtitle(cfg.entities, 3)).toBe('5 Filiales + 1 Holding • 3 mois disponibles');
    });

    it('décrémente le compte de filiales quand on désactive une entité', () => {
      const cfg = clone(DEFAULT_CONFIG);
      const before = countActiveEntities(cfg.entities).total;
      cfg.entities = cfg.entities.map((e) =>
        e.code === 'spy' ? { ...e, is_active: false } : e,
      );
      setPCGroupConfig(cfg);
      const after = countActiveEntities(cfg.entities);
      expect(after.total).toBe(before - 1);
    });

    it('utilise le pluriel/singulier selon le nombre de mois', () => {
      const cfg = getPCGroupConfig();
      expect(buildHeaderSubtitle(cfg.entities, 1)).toMatch(/1 mois disponible$/);
      expect(buildHeaderSubtitle(cfg.entities, 5)).toMatch(/5 mois disponibles$/);
    });
  });

  // ----------------------- monthLabel & footerLabel -----------------------
  describe('monthLabel / footerLabel par mois', () => {
    const cases: Array<[MonthId, string]> = [
      ['jan-2026', 'Janvier 2026'],
      ['feb-2026', 'Février 2026'],
      ['mar-2026', 'Mars 2026'],
      ['apr-2026', 'Avril 2026'],
    ];
    for (const [id, label] of cases) {
      it(`${id} → "${label}" (header & footer)`, () => {
        const data = getMonthData(id);
        expect(data.monthLabel).toBe(label);
        expect(data.footerLabel).toBe(label);
      });
    }
  });

  // ----------------------- Mois disponibles -----------------------
  describe('Liste des mois disponibles (intersection sources ∩ manuel)', () => {
    it('contient les 4 mois 2026 quand la config par défaut est chargée', () => {
      const months = getPCGroupAvailableMonths().map((m) => m.id);
      expect(months).toEqual(
        expect.arrayContaining(['jan-2026', 'feb-2026', 'mar-2026', 'apr-2026']),
      );
    });

    it('retire un mois quand son bloc manuel est supprimé', () => {
      const cfg = clone(DEFAULT_CONFIG);
      // Supprime tous les manualFacts + holdingFacts d'avril
      cfg.manualFacts = cfg.manualFacts.filter((f) => f.month_id !== 'apr-2026');
      cfg.holdingFacts = cfg.holdingFacts.filter((f) => f.month_id !== 'apr-2026');
      setPCGroupConfig(cfg);

      const months = getPCGroupAvailableMonths().map((m) => m.id);
      expect(months).not.toContain('apr-2026');
      expect(months).toContain('mar-2026');
    });
  });

  // ----------------------- KPIs consolidés -----------------------
  describe('KPIs consolidés (computeConsolidatedFacts)', () => {
    it('produit des facts cohérents pour les mois seedés', () => {
      const facts = computeConsolidatedFacts('mar-2026');
      expect(facts).not.toBeNull();
      expect(facts!.caGroupe).toBeGreaterThan(0);
      // Invariants : SPY/Comment sont inclus dans Digit (produits internes),
      // donc la marge brute = Agency + Structuring + Digit (consolidé).
      const sum =
        facts!.agencyPartPCA +
        facts!.structuringMargeNette +
        facts!.digitMargeNette;
      expect(Math.abs(sum - facts!.margeBruteGroupe)).toBeLessThan(0.5);
      // Réserves = 10 % marge brute, remontée = 90 %
      expect(Math.abs(facts!.reservesFiliales - facts!.margeBruteGroupe * 0.1)).toBeLessThan(0.5);
      expect(Math.abs(facts!.remonteeHolding - facts!.margeBruteGroupe * 0.9)).toBeLessThan(0.5);
      // Résultat net = remontée − frais holding
      expect(Math.abs(facts!.resultatNetHolding - (facts!.remonteeHolding - facts!.fraisHolding))).toBeLessThan(0.5);
    });

    it('renvoie null pour un mois dont le bloc manuel a été supprimé', () => {
      const cfg = clone(DEFAULT_CONFIG);
      cfg.manualFacts = cfg.manualFacts.filter((f) => f.month_id !== 'apr-2026');
      cfg.holdingFacts = cfg.holdingFacts.filter((f) => f.month_id !== 'apr-2026');
      setPCGroupConfig(cfg);

      expect(computeConsolidatedFacts('apr-2026')).toBeNull();
      // Mars reste calculable
      expect(computeConsolidatedFacts('mar-2026')).not.toBeNull();
    });

    it('reflète la modification d\'une entité manuelle (SPY) sans impacter le CA Groupe (SPY est inclus dans Digit)', () => {
      const baseline = computeConsolidatedFacts('mar-2026')!;
      const baselineCA = baseline.caGroupe;
      const baselineSpyCA = baseline.spyCA;

      // Patch : on ajoute +10000 au CA SPY de mars
      const cfg = clone(DEFAULT_CONFIG);
      cfg.manualFacts = cfg.manualFacts.map((f) =>
        f.month_id === 'mar-2026' && f.entity_code === 'spy'
          ? { ...f, ca: f.ca + 10000 }
          : f,
      );
      setPCGroupConfig(cfg);

      const updated = computeConsolidatedFacts('mar-2026')!;
      expect(updated.spyCA).toBe(baselineSpyCA + 10000);
      // SPY étant un sous-composant informatif de Digit, le CA Groupe ne bouge pas.
      expect(Math.abs(updated.caGroupe - baselineCA)).toBeLessThan(0.5);
    });

    it('reflète une modification des frais Holding sur le résultat net', () => {
      const baseline = computeConsolidatedFacts('mar-2026')!;
      const cfg = clone(DEFAULT_CONFIG);
      cfg.holdingFacts = cfg.holdingFacts.map((h) =>
        h.month_id === 'mar-2026' ? { ...h, frais_total: h.frais_total + 5000 } : h,
      );
      setPCGroupConfig(cfg);

      const updated = computeConsolidatedFacts('mar-2026')!;
      expect(updated.fraisHolding).toBe(baseline.fraisHolding + 5000);
      expect(Math.abs(updated.resultatNetHolding - (baseline.resultatNetHolding - 5000))).toBeLessThan(0.5);
    });
  });
});
