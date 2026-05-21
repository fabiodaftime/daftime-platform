import { describe, it } from 'vitest';
import { computeConsolidatedFacts, computeYTD } from '../pcGroupAggregator';

describe('debug', () => {
  it('prints', () => {
    for (const m of ['jan-2026','feb-2026','mar-2026','apr-2026'] as const) {
      const f = computeConsolidatedFacts(m as any);
      if (!f) { console.log(m, 'null'); continue; }
      console.log(m, {
        ca: Math.round(f.caGroupe),
        mb: Math.round(f.margeBruteGroupe),
        res: Math.round(f.reservesFiliales),
        rem: Math.round(f.remonteeHolding),
        net: Math.round(f.resultatNetHolding),
      });
    }
    const y = computeYTD('mar-2026');
    console.log('YTD mar', { ca: Math.round(y.caYTD), mb: Math.round(y.margeBruteYTD), net: Math.round(y.resultatNetYTD) });
  });
});
