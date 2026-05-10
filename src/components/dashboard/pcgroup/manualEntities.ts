// Manual entity data for SPY, Comment and Holding (no standalone dashboards).
// One block per month → consumed by pcGroupAggregator.
//
// To add a new month: add a key to MANUAL_ENTITIES with the same shape.

import type { PCGSourceMonthId } from './sources/entityAdapters';

export interface ManualEntityFacts {
  ca: number;
  margeNette: number;
  charges: number;
  marginPct: number;
  deals?: number;
}

export interface ManualHoldingBlock {
  // Total frais holding for the month (Compta + Salaires fixes + AI Agent + Tools + Bank Fees + …)
  fraisTotal: number;
  // Detailed breakdown rendered in the consolidatedPL & holdingSynthese blocks
  fraisDetail: { label: string; amount: number }[];
  // Director distribution (must sum to 100)
  distribution: {
    maxencePct: number;
    thibaultPct: number;
    florianPct: number;
    willInThibault?: number; // info-only line "↳ dont Will via Thibault"
  };
}

export interface ManualMonthExtras {
  spy: ManualEntityFacts;
  comment: ManualEntityFacts;
  commentWarning?: string;
  holding: ManualHoldingBlock;
}

// ---------- INTERCOS CASH (actuals reçus + apports) ----------
// Montants RÉELLEMENT encaissés par la Holding pour chaque période-source.
// Les remontées attendues sont calculées par les règles (intercosRules.ts) ;
// seuls les encaissements réels (et les apports ponctuels) restent saisis.
export interface IntercoCashBlock {
  /** Encaissements reçus par entité pour la marge générée durant ce mois. */
  received: Partial<Record<'agency' | 'structuring' | 'digit' | 'spy' | 'comment', number>>;
  /** Apport exceptionnel d'un dirigeant pour combler un retard de remontée. */
  apportMaxence?: number;
}

export const INTERCOS_CASH: Partial<Record<PCGSourceMonthId, IntercoCashBlock>> = {
  // Encaissements partiels Q1 : à date, seuls $38,173 ont été remontés sur les
  // $152,845 exigibles (Jan + Fév). Affectation forfaitaire jusqu'à réconciliation
  // bancaire détaillée.
  'jan-2026': { received: { structuring: 20000, digit: 12000, agency: 1500, spy: 2000, comment: 500 } },
  'feb-2026': { received: { structuring: 1500, digit: 500, agency: 173 }, apportMaxence: 54458 },
  'mar-2026': { received: {} },
  'apr-2026': { received: {} },
};

export const MANUAL_ENTITIES: Partial<Record<PCGSourceMonthId, ManualMonthExtras>> = {
  'jan-2026': {
    spy: { ca: 16750, margeNette: 3262, charges: 13488, marginPct: 19.5, deals: 5 },
    comment: { ca: 2813, margeNette: 2531, charges: 281, marginPct: 90.0, deals: 20 },
    commentWarning: '',
    holding: {
      fraisTotal: 7060,
      fraisDetail: [
        { label: 'Compta + CFO Groupe', amount: 3430 },
        { label: 'Salaire Assistante', amount: 1630 },
        { label: 'Salaires Fixes Sales', amount: 2000 },
      ],
      distribution: { maxencePct: 37.5, thibaultPct: 37.5, florianPct: 25, willInThibault: 10000 },
    },
  },
  'feb-2026': {
    spy: { ca: 27300, margeNette: 3559, charges: 23741, marginPct: 13.0, deals: 5 },
    comment: { ca: 333, margeNette: 140, charges: 193, marginPct: 42.0, deals: 20 },
    commentWarning: 'Activité en forte baisse ce mois. CA divisé par ~8 vs janvier.',
    holding: {
      fraisTotal: 10890,
      fraisDetail: [
        { label: 'Compta + CFO Groupe', amount: 3430 },
        { label: 'Salaire Assistante', amount: 1630 },
        { label: 'Salaires Fixes Sales', amount: 2000 },
        { label: 'Travel Expenses', amount: 3781 },
        { label: 'Bank Fees', amount: 50 },
      ],
      distribution: { maxencePct: 37.5, thibaultPct: 37.5, florianPct: 25, willInThibault: 10000 },
    },
  },
  'mar-2026': {
    spy: { ca: 37350, margeNette: 3470, charges: 33880, marginPct: 9.3, deals: 5 },
    comment: { ca: 861, margeNette: 703, charges: 158, marginPct: 81.6, deals: 20 },
    commentWarning: 'Rebond significatif vs Février. Marge nette excellente à 81.6%.',
    holding: {
      fraisTotal: 8378,
      fraisDetail: [
        { label: 'CFO + Compta Groupe', amount: 3430 },
        { label: 'AI Agent', amount: 2000 },
        { label: 'Salaire Fixe Sales', amount: 2000 },
        { label: 'Tools', amount: 780 },
        { label: 'Frais Bancaires', amount: 88 },
        { label: 'Frais Paddel (non remboursés)', amount: 80 },
      ],
      distribution: { maxencePct: 37.5, thibaultPct: 37.5, florianPct: 25, willInThibault: 10000 },
    },
  },
  'apr-2026': {
    // Source DigitData APR overviewProducts: SPY $38,450 / Marge $3,098 ; Comment $438 / Marge $264
    spy: { ca: 38450, margeNette: 3098, charges: 35352, marginPct: 8.1, deals: 5 },
    comment: { ca: 438, margeNette: 264, charges: 174, marginPct: 60.3, deals: 20 },
    commentWarning: 'Activité résiduelle. CA quasi nul vs Mars.',
    holding: {
      // Frais holding par défaut = base récurrente Mars (à ajuster manuellement quand le détail réel sera connu).
      fraisTotal: 8298,
      fraisDetail: [
        { label: 'CFO + Compta Groupe', amount: 3430 },
        { label: 'AI Agent', amount: 2000 },
        { label: 'Salaire Fixe Sales', amount: 2000 },
        { label: 'Tools', amount: 780 },
        { label: 'Frais Bancaires', amount: 88 },
      ],
      distribution: { maxencePct: 37.5, thibaultPct: 37.5, florianPct: 25, willInThibault: 10000 },
    },
  },
};
