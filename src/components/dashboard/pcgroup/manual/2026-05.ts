// Source de vérité — Mai 2026.
// SPY : aucune donnée transmise (entité indépendante — à compléter).
// Comment/Trust : reflète DigitData MAY overviewProducts.
// Frais holding par défaut = base récurrente Avril (à ajuster quand le détail réel sera connu).
import type { ManualMonthFile } from './types';

const MAY_2026: ManualMonthFile = {
  monthId: 'may-2026',
  extras: {
    spy: { ca: 0, margeNette: 0, charges: 0, marginPct: 0, deals: 0 },
    comment: { ca: 489, margeNette: 280, charges: 209, marginPct: 57.3, deals: 20 },
    commentWarning: 'CA en légère hausse vs Avril (+11.7%). SPY : aucune donnée transmise pour Mai.',
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

export default MAY_2026;
