// Digit numeric facts per month — companion to DigitData.ts (which exposes
// formatted strings). These figures are used by the consolidated PCGroup
// aggregator. Update here when Digit's monthly numbers change.
//
// Source of truth values mirror what DigitData.ts displays for each month.

import type { EntityFacts } from './entityAdapters';

type Month = 'jan-2026' | 'feb-2026' | 'mar-2026' | 'apr-2026' | 'may-2026';

export const DIGIT_NUMERIC_FACTS: Record<Month, EntityFacts> = {
  'jan-2026': {
    ca: 114649,
    margeNette: 41198,
    charges: 73451,
    marginPct: 35.9,
    deals: 267,
    ticketMoyen: 429,
  },
  'feb-2026': {
    // Recap_Finance_2026 (10) — corrections COO Digit : Setup deals 170→233, Core Marge +$1k, Comment CA/Marge réactualisés
    ca: 122330,
    margeNette: 44249,
    charges: 78081,
    marginPct: 36.2,
    deals: 276,
    ticketMoyen: 443,
  },
  'mar-2026': {
    ca: 120458,
    margeNette: 57458,
    charges: 63000,
    marginPct: 47.7,
    deals: 288,
    ticketMoyen: 418,
  },
  'apr-2026': {
    ca: 113001,
    margeNette: 42223,
    charges: 70778,
    marginPct: 37.4,
    deals: 313,
    ticketMoyen: 485,
  },
  'may-2026': {
    // Source: Recap_Finance_2026 (10) — Core Marge ajustée à $30,016
    ca: 102920,
    margeNette: 30016,
    charges: 72904,
    marginPct: 29.2,
    deals: 350,
    ticketMoyen: 294,
  },
};
