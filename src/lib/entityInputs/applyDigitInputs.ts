// Apply Digit canonical inputs (DB-driven) on top of the legacy static
// `DigitMonthData` produced by `getDigitMonthData`. The headline KPIs and
// per-product cards become DERIVED from a small set of editable numbers.
//
// This is the seam that turns the static dashboard into a reactive, single-
// source-of-truth view without rewriting all 670 lines of DigitData.ts at once.

import { fmtF } from '@/components/dashboard/digit/DigitData';
import type { DigitInputs } from './schema';

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

export function applyDigitInputsToMonthData<T extends Record<string, any>>(
  monthData: T,
  inputs: DigitInputs | null,
): T {
  if (!inputs) return monthData;

  // Source de vérité = somme des composantes (Core + SPY + Comment).
  // Les champs `ca_total` / `marge_total` sont conservés pour compatibilité
  // mais ne sont plus utilisés en affichage : ils provoquaient des écarts
  // avec la Vue Groupe quand la saisie n'était pas réconciliée.
  const ca = (inputs.ca_core ?? 0) + (inputs.ca_spy ?? 0) + (inputs.ca_comment ?? 0);
  const marge = (inputs.marge_core ?? 0) + (inputs.marge_spy ?? 0) + (inputs.marge_comment ?? 0);
  const margePct = ca > 0 ? (marge / ca) * 100 : 0;
  const ticket = inputs.deals_total > 0 ? ca / inputs.deals_total : 0;

  // Override the 4 headline KPI cards (Vue d'ensemble)
  const overviewKPIs = Array.isArray(monthData.overviewKPIs)
    ? [...monthData.overviewKPIs]
    : [];
  if (overviewKPIs[0]) {
    overviewKPIs[0] = {
      ...overviewKPIs[0],
      value: fmtF(Math.round(ca)),
      sub: `${inputs.deals_total} deals • Ticket moyen ${fmtF(Math.round(ticket))}`,
    };
  }
  if (overviewKPIs[1]) {
    overviewKPIs[1] = {
      ...overviewKPIs[1],
      value: fmtF(Math.round(marge)),
      sub: `${fmtPct(margePct)} du CA`,
    };
  }
  if (overviewKPIs[2]) {
    overviewKPIs[2] = { ...overviewKPIs[2], value: String(inputs.deals_total) };
  }
  if (overviewKPIs[3]) {
    overviewKPIs[3] = { ...overviewKPIs[3], value: fmtPct(margePct) };
  }

  // Override the 3 product cards (Core / SPY / Comment)
  const products = [
    { ca: inputs.ca_core, marge: inputs.marge_core, label: 'Digit Solution (Core)' },
    { ca: inputs.ca_spy, marge: inputs.marge_spy, label: 'SPY' },
    { ca: inputs.ca_comment, marge: inputs.marge_comment, label: 'Comment/Trust' },
  ];
  const overviewProducts = Array.isArray(monthData.overviewProducts)
    ? monthData.overviewProducts.map((p: any, i: number) => {
        const src = products[i];
        if (!src) return p;
        const pct = src.ca > 0 ? (src.marge / src.ca) * 100 : 0;
        return {
          ...p,
          value: fmtF(Math.round(src.ca)),
          sub: `Marge ${fmtF(Math.round(src.marge))} (${fmtPct(pct)})`,
        };
      })
    : [];

  return { ...monthData, overviewKPIs, overviewProducts };
}
