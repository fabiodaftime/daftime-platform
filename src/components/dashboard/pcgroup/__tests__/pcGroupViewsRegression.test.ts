// Tests d'extension : garantissent la cohérence des vues dérivées (YTD,
// réserves, remontée, comparatifs) après la correction de l'agrégateur qui
// consolide désormais Digit Solution = Digit Core + SPY + Comment/Trustpilot.
//
// On vérifie systématiquement :
//   • Les totaux (CA Groupe / Marge Brute Groupe / Réserves / Remontée /
//     Résultat Net) = Agency + Structuring + Digit consolidé (qui inclut
//     SPY + Comment).
//   • Patcher SPY ou Comment se propage exactement (delta = delta) aux
//     totaux groupe, YTD et ligne TOTAL du comparatif.
//   • Les ratios Réserves = 10 % / Remontée = 90 % / Résultat = Remontée − Frais
//     restent vrais sur les agrégats YTD.


import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_CONFIG,
  setPCGroupConfig,
  resetPCGroupConfig,
} from '../config/configStore';
import {
  computeConsolidatedFacts,
  computeYTD,
  buildPCGroupMonthData,
  aggregatePCGroup,
} from '../pcGroupAggregator';
import {
  getPCGroupAvailableMonths,
  getMonthData,
  type MonthId,
} from '../PCGroupData';
import type { PCGroupConfig } from '../config/types';
import type { PCGSourceMonthId } from '../sources/entityAdapters';

const EPS = 1.5; // arrondi affichage
const clone = (cfg: PCGroupConfig): PCGroupConfig => JSON.parse(JSON.stringify(cfg));
const parseUsd = (s: string | undefined | null): number => {
  if (!s) return 0;
  const n = Number(String(s).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const monthIds = getPCGroupAvailableMonths().map((m) => m.id as MonthId);
const SOURCE_IDS = monthIds as unknown as PCGSourceMonthId[];

describe('PCGroup — extension régression : YTD / Réserves / Remontée / Comparatifs', () => {
  beforeEach(() => setPCGroupConfig(clone(DEFAULT_CONFIG)));
  afterEach(() => resetPCGroupConfig());

  // ------------------------------------------------------------------
  // YTD : reste cohérent et exclut SPY/Comment des totaux
  // ------------------------------------------------------------------
  describe('YTD (computeYTD)', () => {
    const last = SOURCE_IDS[SOURCE_IDS.length - 1];

    it('caYTD = somme des CA Groupe mensuels (sans SPY/Comment ajoutés)', () => {
      const ytd = computeYTD(last);
      const expected = ytd.months.reduce(
        (acc, m) => acc + m.facts.agencyCA + m.facts.structuringCA + m.facts.digitCA,
        0,
      );
      expect(Math.abs(ytd.caYTD - expected)).toBeLessThan(EPS);
    });

    it('margeBruteYTD = somme(Agency + Structuring + Digit consolidé)', () => {
      const ytd = computeYTD(last);
      const expected = ytd.months.reduce(
        (acc, m) =>
          acc +
          m.facts.agencyPartPCA +
          m.facts.structuringMargeNette +
          m.facts.digitMargeNette,
        0,
      );
      expect(Math.abs(ytd.margeBruteYTD - expected)).toBeLessThan(EPS);

      // Variante incorrecte : ajouter SPY+Comment doit s'écarter.
      const wrong = expected
        + ytd.perEntityYTD.spy
        + ytd.perEntityYTD.comment;
      expect(Math.abs(ytd.margeBruteYTD - wrong)).toBeGreaterThanOrEqual(EPS);
    });

    it('perEntityYTD.spy + comment ≤ perEntityYTD.digit (sous-composants)', () => {
      const ytd = computeYTD(last);
      expect(ytd.perEntityYTD.spy + ytd.perEntityYTD.comment)
        .toBeLessThanOrEqual(ytd.perEntityYTD.digit + EPS);
    });

    it('Réserves YTD = 10 % de margeBruteYTD ; Résultat Net YTD = somme mensuelle', () => {
      const ytd = computeYTD(last);
      expect(Math.abs(ytd.reservesYTD - ytd.margeBruteYTD * 0.1)).toBeLessThan(EPS);
      const expectedNet = ytd.months.reduce((a, m) => a + m.facts.resultatNetHolding, 0);
      expect(Math.abs(ytd.resultatNetYTD - expectedNet)).toBeLessThan(EPS);
    });

    it('Patcher SPY (+10 000 CA, +3 000 marge) propage exactement aux totaux YTD', () => {
      const baseline = computeYTD(last);
      const cfg = clone(DEFAULT_CONFIG);
      const monthsPatched = cfg.manualFacts.filter((m) => m.entity_code === 'spy').length;
      cfg.manualFacts = cfg.manualFacts.map((m) =>
        m.entity_code === 'spy'
          ? { ...m, ca: m.ca + 10000, contribution: m.contribution + 3000 }
          : m,
      );
      setPCGroupConfig(cfg);
      const updated = computeYTD(last);
      const deltaCa = 10000 * monthsPatched;
      const deltaMarge = 3000 * monthsPatched;
      expect(Math.abs((updated.caYTD - baseline.caYTD) - deltaCa)).toBeLessThan(EPS);
      expect(Math.abs((updated.margeBruteYTD - baseline.margeBruteYTD) - deltaMarge)).toBeLessThan(EPS);
    });

    it('Patcher Comment propage exactement à la marge brute YTD', () => {
      const baseline = computeYTD(last);
      const cfg = clone(DEFAULT_CONFIG);
      const monthsPatched = cfg.manualFacts.filter((m) => m.entity_code === 'comment').length;
      cfg.manualFacts = cfg.manualFacts.map((m) =>
        m.entity_code === 'comment'
          ? { ...m, contribution: m.contribution + 4000 }
          : m,
      );
      setPCGroupConfig(cfg);
      const updated = computeYTD(last);
      const deltaMarge = 4000 * monthsPatched;
      expect(Math.abs((updated.margeBruteYTD - baseline.margeBruteYTD) - deltaMarge)).toBeLessThan(EPS);
    });
  });

  // ------------------------------------------------------------------
  // Réserves / Remontée / Résultat Net mensuels
  // ------------------------------------------------------------------
  describe.each(SOURCE_IDS)('Mois %s — Réserves / Remontée / Résultat', (monthId) => {
    it('Réserves = 10 % marge brute ; Remontée = 90 % marge brute ; Résultat = Remontée − Frais', () => {
      const f = computeConsolidatedFacts(monthId)!;
      expect(Math.abs(f.reservesFiliales - f.margeBruteGroupe * 0.1)).toBeLessThan(EPS);
      expect(Math.abs(f.remonteeHolding - f.margeBruteGroupe * 0.9)).toBeLessThan(EPS);
      expect(Math.abs(f.resultatNetHolding - (f.remonteeHolding - f.fraisHolding))).toBeLessThan(EPS);
    });

    it('Patcher SPY propage exactement (×0.9) à Remontée et (×0.1) à Réserves', () => {
      const baseline = computeConsolidatedFacts(monthId)!;
      const cfg = clone(DEFAULT_CONFIG);
      cfg.manualFacts = cfg.manualFacts.map((m) =>
        m.month_id === monthId && m.entity_code === 'spy'
          ? { ...m, contribution: m.contribution + 7500 }
          : m,
      );
      setPCGroupConfig(cfg);
      const updated = computeConsolidatedFacts(monthId)!;
      expect(Math.abs((updated.reservesFiliales - baseline.reservesFiliales) - 750)).toBeLessThan(EPS);
      expect(Math.abs((updated.remonteeHolding - baseline.remonteeHolding) - 6750)).toBeLessThan(EPS);
      expect(Math.abs((updated.resultatNetHolding - baseline.resultatNetHolding) - 6750)).toBeLessThan(EPS);
    });
  });

  // ------------------------------------------------------------------
  // Tableau comparatif Overview (overviewComparison + overviewComparisonTotal)
  // ------------------------------------------------------------------
  describe.each(SOURCE_IDS)('Mois %s — Comparatif Overview', (monthId) => {
    const buildView = (id: MonthId) => {
      const base = getMonthData(id);
      return buildPCGroupMonthData(id, base, base.monthLabel);
    };

    it('Ligne TOTAL = somme(Agency + Structuring + Digit total) par colonne (jamais + SPY ni + Comment)', () => {
      const view = buildView(monthId as MonthId);
      const rows = view.overviewComparison ?? [];
      const total = view.overviewComparisonTotal!;
      expect(rows.length).toBeGreaterThan(0);
      expect(total).toBeDefined();

      const cols = ['jan', 'feb', 'mar', 'avr'] as const;
      const findRow = (re: RegExp) => rows.find((r) => re.test(r.entity));
      const agency = findRow(/agency/i);
      const struct = findRow(/structuring/i);
      const digitTotal = rows.find((r) => /digit solution \(total\)/i.test(r.entity));
      expect(agency).toBeDefined();
      expect(struct).toBeDefined();
      expect(digitTotal).toBeDefined();

      for (const c of cols) {
        const totalCell = parseUsd((total as any)[c]);
        if (totalCell === 0) continue; // colonne non remplie pour ce mois
        const expected =
          parseUsd((agency as any)[c]) +
          parseUsd((struct as any)[c]) +
          parseUsd((digitTotal as any)[c]);
        expect(Math.abs(totalCell - expected)).toBeLessThan(2);
      }
    });

    it('Les sous-lignes "↳ dont SPY" + "↳ dont Comment" + "↳ dont Digit Core" = ligne "Digit Solution (total)"', () => {
      const view = buildView(monthId as MonthId);
      const rows = view.overviewComparison ?? [];
      const digitTotal = rows.find((r) => /digit solution \(total\)/i.test(r.entity));
      const digitCore = rows.find((r) => /dont digit core/i.test(r.entity));
      const spy = rows.find((r) => /dont spy/i.test(r.entity));
      const comment = rows.find((r) => /dont comment/i.test(r.entity));
      expect(digitTotal && digitCore && spy && comment).toBeTruthy();

      for (const c of ['jan', 'feb', 'mar', 'avr'] as const) {
        const totalCell = parseUsd((digitTotal as any)[c]);
        if (totalCell === 0) continue;
        const sum =
          parseUsd((digitCore as any)[c]) +
          parseUsd((spy as any)[c]) +
          parseUsd((comment as any)[c]);
        expect(Math.abs(totalCell - sum)).toBeLessThan(2);
      }
    });

    it('Patcher SPY propage exactement à la ligne TOTAL du comparatif (mois patché + YTD)', () => {
      const before = buildView(monthId as MonthId).overviewComparisonTotal!;
      const cfg = clone(DEFAULT_CONFIG);
      const monthsPatched = cfg.manualFacts.filter((m) => m.entity_code === 'spy').length;
      cfg.manualFacts = cfg.manualFacts.map((m) =>
        m.entity_code === 'spy'
          ? { ...m, contribution: m.contribution + 6000 }
          : m,
      );
      setPCGroupConfig(cfg);
      const after = buildView(monthId as MonthId).overviewComparisonTotal!;
      for (const c of ['jan', 'feb', 'mar', 'avr'] as const) {
        const beforeVal = parseUsd((before as any)[c]);
        const afterVal = parseUsd((after as any)[c]);
        if (beforeVal === 0 && afterVal === 0) continue;
        expect(Math.abs((afterVal - beforeVal) - 6000)).toBeLessThan(2);
      }
      expect(
        Math.abs(
          (parseUsd((after as any).ytd) - parseUsd((before as any).ytd)) - 6000 * monthsPatched,
        ),
      ).toBeLessThan(2);
    });
  });

  // ------------------------------------------------------------------
  // aggregatePCGroup : perEntityRows / perEntityTotal / monthlyTrend
  // ------------------------------------------------------------------
  describe('aggregatePCGroup — perEntity & monthlyTrend', () => {
    const last = SOURCE_IDS[SOURCE_IDS.length - 1];

    it('perEntityTotal.total = margeBruteYTD = somme(Agency+Structuring+Digit YTD), sans SPY/Comment', () => {
      const agg = aggregatePCGroup(last)!;
      const yt = agg.ytd.facts.perEntityYTD;
      const expected = Math.round(yt.agency + yt.structuring + yt.digit);
      expect(Math.abs(agg.ytd.perEntityTotal.total - expected)).toBeLessThanOrEqual(2);
      expect(Math.abs(agg.ytd.perEntityTotal.total - Math.round(agg.ytd.facts.margeBruteYTD)))
        .toBeLessThanOrEqual(2);
    });

    it('perEntityTotal.months[i] = somme(Agency+Structuring+Digit) pour ce mois (jamais +SPY +Comment)', () => {
      const agg = aggregatePCGroup(last)!;
      const rowsByEntity = Object.fromEntries(
        agg.ytd.perEntityRows.map((r) => [r.entity, r]),
      );
      const a = rowsByEntity['Agency (Part PCA)'];
      const s = rowsByEntity['Structuring'];
      const d = rowsByEntity['Digit Solution'];
      expect(a && s && d).toBeTruthy();

      agg.ytd.perEntityTotal.months.forEach((cell, i) => {
        const expected = a.months[i].value + s.months[i].value + d.months[i].value;
        expect(Math.abs(cell.value - expected)).toBeLessThanOrEqual(2);
      });
    });

    it('monthlyTrend.margin par mois = Agency+Structuring+Digit du même mois', () => {
      const agg = aggregatePCGroup(last)!;
      agg.ytd.monthlyTrend.forEach((t, i) => {
        const f = agg.ytd.facts.months[i].facts;
        const expected = Math.round(
          f.agencyPartPCA + f.structuringMargeNette + f.digitMargeNette,
        );
        expect(Math.abs(t.margin - expected)).toBeLessThanOrEqual(2);
      });
    });

    it('Patcher SPY propage exactement à perEntityTotal.total et monthlyTrend.margin', () => {
      const before = aggregatePCGroup(last)!;
      const baselineTotals = before.ytd.perEntityTotal.months.map((m) => m.value);
      const baselineMargins = before.ytd.monthlyTrend.map((t) => t.margin);

      const cfg = clone(DEFAULT_CONFIG);
      cfg.manualFacts = cfg.manualFacts.map((m) =>
        m.entity_code === 'spy'
          ? { ...m, contribution: m.contribution + 9000, ca: m.ca + 12000 }
          : m,
      );
      setPCGroupConfig(cfg);

      const after = aggregatePCGroup(last)!;
      after.ytd.perEntityTotal.months.forEach((m, i) => {
        expect(Math.abs((m.value - baselineTotals[i]) - 9000)).toBeLessThanOrEqual(2);
      });
      after.ytd.monthlyTrend.forEach((t, i) => {
        expect(Math.abs((t.margin - baselineMargins[i]) - 9000)).toBeLessThanOrEqual(2);
      });
    });
  });
});
