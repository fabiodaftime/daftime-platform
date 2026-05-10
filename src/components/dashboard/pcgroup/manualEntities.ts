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
};
