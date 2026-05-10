// Source de vérité — Mars 2026.
import type { ManualMonthFile } from './types';

const MAR_2026: ManualMonthFile = {
  monthId: 'mar-2026',
  extras: {
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
  intercosCash: { received: {} },
};

export default MAR_2026;
