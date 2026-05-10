// Source de vérité — Avril 2026.
// Note SPY/Comment : reflète DigitData APR overviewProducts.
// Frais holding par défaut = base récurrente Mars (à ajuster quand le détail réel sera connu).
import type { ManualMonthFile } from './types';

const APR_2026: ManualMonthFile = {
  monthId: 'apr-2026',
  extras: {
    spy: { ca: 38450, margeNette: 3098, charges: 35352, marginPct: 8.1, deals: 5 },
    comment: { ca: 438, margeNette: 264, charges: 174, marginPct: 60.3, deals: 20 },
    commentWarning: 'Activité résiduelle. CA quasi nul vs Mars.',
    holding: {
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
  intercosCash: { received: {} },
};

export default APR_2026;
