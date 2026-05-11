// Breakdown helpers : pour une métrique consolidée donnée, retourne les lignes
// brutes (par entité / source) qui composent le total. Utilisé par le drawer
// de drill-down dans le panneau de validation.

import { computeConsolidatedFacts } from './pcGroupAggregator';
import { MANUAL_ENTITIES } from './manualEntities';
import type { PCGSourceMonthId } from './sources/entityAdapters';

export type BreakdownMetric =
  | 'CA Groupe'
  | 'Marge Brute Groupe'
  | 'Résultat Net Holding'
  | 'Réserves Filiales';

export interface BreakdownRow {
  label: string;
  value: number;
  /** + (additif) ou - (soustractif) */
  sign?: '+' | '-';
  source?: string;
  note?: string;
}

export interface MetricBreakdown {
  metric: BreakdownMetric;
  total: number;
  formula: string;
  rows: BreakdownRow[];
}

export function buildMetricBreakdown(
  metric: BreakdownMetric,
  monthId: PCGSourceMonthId,
): MetricBreakdown | null {
  const f = computeConsolidatedFacts(monthId);
  if (!f) return null;
  const m = MANUAL_ENTITIES[monthId];

  switch (metric) {
    case 'CA Groupe':
      return {
        metric,
        total: f.caGroupe,
        formula: 'CA Agency + CA Structuring + CA Digit Solution (consolidé, SPY & Comment inclus)',
        rows: [
          { label: 'Agency', value: f.agencyCA, sign: '+', source: 'Dashboard Agency' },
          { label: 'Structuring', value: f.structuringCA, sign: '+', source: 'Dashboard Structuring' },
          { label: 'Digit Solution (total)', value: f.digitCA, sign: '+', source: 'Dashboard Digit · inclut SPY + Comment' },
          { label: '   ↳ dont Digit Core', value: f.digitCA - f.spyCA - f.commentCA, source: 'Sous-composant (info)' },
          { label: '   ↳ dont SPY', value: f.spyCA, source: 'Sous-composant (info)' },
          { label: '   ↳ dont Comment', value: f.commentCA, source: 'Sous-composant (info)' },
        ],
      };

    case 'Marge Brute Groupe':
      return {
        metric,
        total: f.margeBruteGroupe,
        formula: 'Marge Agency (PCA 50%) + Marge Structuring + Marge Digit Solution (consolidé)',
        rows: [
          { label: 'Agency (Part PCA)', value: f.agencyPartPCA, sign: '+', source: 'Dashboard Agency · 50% des bénéfices' },
          { label: 'Structuring (Marge Nette)', value: f.structuringMargeNette, sign: '+', source: 'Dashboard Structuring' },
          { label: 'Digit Solution (Marge Nette totale)', value: f.digitMargeNette, sign: '+', source: 'Dashboard Digit · inclut SPY + Comment' },
          { label: '   ↳ dont Digit Core', value: f.digitMargeNette - f.spyMargeNette - f.commentMargeNette, source: 'Sous-composant (info)' },
          { label: '   ↳ dont SPY', value: f.spyMargeNette, source: 'Sous-composant (info)' },
          { label: '   ↳ dont Comment', value: f.commentMargeNette, source: 'Sous-composant (info)' },
        ],
      };

    case 'Réserves Filiales':
      return {
        metric,
        total: f.reservesFiliales,
        formula: '10 % de la Marge Brute Groupe (conservé en trésorerie filiale)',
        rows: [
          { label: 'Marge Brute Groupe', value: f.margeBruteGroupe, source: 'Calcul amont' },
          { label: '× 10 % (taux de réserve)', value: 0.1, note: 'Règle intercos (pcgroup_rules.reserves_pct)' },
          { label: 'Réserves Filiales', value: f.reservesFiliales, sign: '+', source: 'Total' },
        ],
      };

    case 'Résultat Net Holding': {
      const rows: BreakdownRow[] = [
        { label: 'Marge Brute Groupe', value: f.margeBruteGroupe, source: 'Calcul amont' },
        { label: 'Réserves Filiales (10 %)', value: f.reservesFiliales, sign: '-', source: 'Conservé en filiale' },
        { label: 'Remontée Holding (90 %)', value: f.remonteeHolding, sign: '+', source: 'Encaissé par la holding' },
        { label: 'Frais Holding', value: f.fraisHolding, sign: '-', source: 'Bloc manuel · Holding' },
      ];
      if (m?.holding.fraisDetail?.length) {
        for (const fd of m.holding.fraisDetail) {
          rows.push({ label: `   • ${fd.label}`, value: fd.amount, sign: '-', source: 'Détail frais holding' });
        }
      }
      rows.push({ label: 'Résultat Net Holding', value: f.resultatNetHolding, sign: '+', source: 'Total' });
      return {
        metric,
        total: f.resultatNetHolding,
        formula: '(Marge Brute − Réserves 10 %) − Frais Holding',
        rows,
      };
    }
  }
}
