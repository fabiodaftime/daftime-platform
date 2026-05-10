// Source de vérité — Février 2026.
import type { ManualMonthFile } from './types';

const FEB_2026: ManualMonthFile = {
  monthId: 'feb-2026',
  extras: {
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
  intercosCash: {
    received: { structuring: 1500, digit: 500, agency: 173 },
    apportMaxence: 54458,
  },
};

export default FEB_2026;
