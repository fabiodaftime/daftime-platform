// Source de vérité — Janvier 2026 (Holding, SPY, Comment, Intercos cash).
import type { ManualMonthFile } from './types';

const JAN_2026: ManualMonthFile = {
  monthId: 'jan-2026',
  extras: {
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
  intercosCash: {
    received: { structuring: 20000, digit: 12000, agency: 1500, spy: 2000, comment: 500 },
  },
};

export default JAN_2026;
