// Digit numeric facts per month — companion to DigitData.ts (which exposes
// formatted strings). These figures are used by the consolidated PCGroup
// aggregator. Update here when Digit's monthly numbers change.
//
// Source of truth values mirror what DigitData.ts displays for each month.

import type { EntityFacts } from './entityAdapters';

type Month = 'jan-2026' | 'feb-2026' | 'mar-2026' | 'apr-2026';

export const DIGIT_NUMERIC_FACTS: Record<Month, EntityFacts> = {
  'jan-2026': {
    ca: 114649,
    margeNette: 40198,
    charges: 74451,
    marginPct: 35.1,
    deals: 267,
    ticketMoyen: 429,
  },
  'feb-2026': {
    ca: 122330,
    margeNette: 43249,
    charges: 79081,
    marginPct: 35.4,
    deals: 213,
    ticketMoyen: 574,
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
    // Will be filled when Avril is added to the consolidated view
    ca: 0,
    margeNette: 0,
    charges: 0,
    marginPct: 0,
  },
};
