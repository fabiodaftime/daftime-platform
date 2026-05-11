// Frozen fixtures for `getEntityMonth(entity, month)`.
// -----------------------------------------------------
// Source de vérité figée pour les tests de non-régression : si une
// source amont (PC, Digit, MANUAL_ENTITIES, …) change ses chiffres,
// les tests qui consomment ces fixtures échoueront, ce qui force une
// revue explicite + une mise à jour assumée des fixtures.
//
// Mise à jour autorisée uniquement si :
//   1. La donnée source réelle a changé (nouveau closing mensuel)
//   2. Le changement a été validé fonctionnellement
//   3. La vue groupe (pies, KPIs, YTD) a été cross-checked en parallèle
//
// Tolérance par défaut : ±$1 USD (arrondi à l'unité), ±0.1 pt sur Marge %.

import type { EntityKey } from '../../sources/normalizedAdapters';
import type { PCGSourceMonthId } from '../../sources/entityAdapters';

export interface EntityMonthFixture {
  ca: number;
  charges: number;
  contribution: number;
  marginPct: number;
}

export const ENTITY_MONTH_FIXTURES: Record<
  EntityKey,
  Partial<Record<PCGSourceMonthId, EntityMonthFixture>>
> = {
  agency: {
    'jan-2026': { ca: 14885, charges: 6237, contribution: 4324, marginPct: 58.1 },
    'feb-2026': { ca: 36184, charges: 9406, contribution: 13389, marginPct: 74.0 },
    'mar-2026': { ca: 46402, charges: 16510, contribution: 14946, marginPct: 64.4 },
    'apr-2026': { ca: 58853, charges: 13313, contribution: 22770, marginPct: 77.4 },
  },
  structuring: {
    'jan-2026': { ca: 53962, charges: 12591, contribution: 41371, marginPct: 76.7 },
    'feb-2026': { ca: 73500, charges: 52464, contribution: 21036, marginPct: 28.6 },
    'mar-2026': { ca: 55000, charges: 25394, contribution: 29606, marginPct: 53.8 },
    'apr-2026': { ca: 70875, charges: 32339, contribution: 38536, marginPct: 54.4 },
  },
  digit: {
    'jan-2026': { ca: 114649, charges: 74451, contribution: 40198, marginPct: 35.1 },
    'feb-2026': { ca: 122330, charges: 79081, contribution: 43249, marginPct: 35.4 },
    'mar-2026': { ca: 120458, charges: 63000, contribution: 57458, marginPct: 47.7 },
    'apr-2026': { ca: 113001, charges: 70654, contribution: 42347, marginPct: 37.5 },
  },
  spy: {
    'jan-2026': { ca: 16750, charges: 13488, contribution: 3262, marginPct: 19.5 },
    'feb-2026': { ca: 27300, charges: 23741, contribution: 3559, marginPct: 13.0 },
    'mar-2026': { ca: 37350, charges: 33880, contribution: 3470, marginPct: 9.3 },
    'apr-2026': { ca: 38450, charges: 35352, contribution: 3098, marginPct: 8.1 },
  },
  comment: {
    'jan-2026': { ca: 2813, charges: 281, contribution: 2531, marginPct: 90.0 },
    'feb-2026': { ca: 333, charges: 193, contribution: 140, marginPct: 42.0 },
    'mar-2026': { ca: 861, charges: 158, contribution: 703, marginPct: 81.6 },
    'apr-2026': { ca: 438, charges: 174, contribution: 264, marginPct: 60.3 },
  },
};

export const FIXTURE_TOLERANCE_USD = 1;
export const FIXTURE_TOLERANCE_PCT = 0.1;

export const FIXTURE_MONTHS: PCGSourceMonthId[] = [
  'jan-2026',
  'feb-2026',
  'mar-2026',
  'apr-2026',
];
export const FIXTURE_ENTITIES: EntityKey[] = [
  'agency',
  'structuring',
  'digit',
  'spy',
  'comment',
];
