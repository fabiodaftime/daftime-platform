// Source de vérité — Mai 2026.
// SPY : 0 confirmé (Récap_Finance marque 0 pour mai).
// Comment/Trust : reflète DigitData MAY overviewProducts.
// Frais holding Mai : base récurrente + Travel 2486 + Bank Fees 56 + Oh My Desk 86.
// Intercos mai : encaissés début mai (183 500 + 146 800 AED) — déjà
// enregistrés dans le suivi des remontées d'Avril (note "mai 2026").
import type { ManualMonthFile } from './types';

const MAY_2026: ManualMonthFile = {
  monthId: 'may-2026',
  extras: {
    spy: { ca: 0, margeNette: 0, charges: 0, marginPct: 0, deals: 0 },
    comment: { ca: 489, margeNette: 280, charges: 209, marginPct: 57.3, deals: 20 },
    commentWarning: 'CA en légère hausse vs Avril (+11.7%). SPY : aucune donnée transmise pour Mai.',
    holding: {
      fraisTotal: 10838,
      fraisDetail: [
        { label: 'CFO + Compta Groupe', amount: 3430 },
        { label: 'AI Agent', amount: 2000 },
        { label: 'Salaire Fixe Sales', amount: 2000 },
        { label: 'Tools', amount: 780 },
        { label: 'Travel Expenses', amount: 2486 },
        { label: 'Oh My Desk (Office Rent)', amount: 86 },
        { label: 'Frais Bancaires', amount: 56 },
      ],
      distribution: { maxencePct: 37.5, thibaultPct: 37.5, florianPct: 25, willInThibault: 10000 },
    },
  },
  intercosCash: { received: {} },
};

export default MAY_2026;
