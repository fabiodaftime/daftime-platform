// ============================================================================
// DIGIT GROUP — CONSOLIDATOR PUR
// ----------------------------------------------------------------------------
// Agrège les entités définies dans DIGIT_GROUP_MAPPING en une vue "group".
// Fonction PURE : aucune saisie, aucun side-effect, juste de la somme.
// La cohérence est garantie par construction : si la somme des entités
// diverge d'une valeur attendue, c'est un bug d'entité, pas de conso.
// ============================================================================

import {
  getDigitEntityPnL,
  DIGIT_GROUP_MAPPING,
  type DigitEntity,
  type DigitEntityPnL,
} from './digitEntityContract';
import type { DigitMonthId } from '../DigitData';

export interface DigitGroupConsolidation {
  monthId: DigitMonthId;
  ca: number;
  marge: number;
  margePct: number;
  charges: number;
  deals: number;
  /** Détail par entité, dans l'ordre de DIGIT_GROUP_MAPPING */
  breakdown: DigitEntityPnL[];
}

export function consolidateDigitGroup(monthId: DigitMonthId): DigitGroupConsolidation {
  const breakdown = DIGIT_GROUP_MAPPING.map((e: DigitEntity) => getDigitEntityPnL(e, monthId));
  const ca = breakdown.reduce((s, p) => s + p.ca, 0);
  const marge = breakdown.reduce((s, p) => s + p.marge, 0);
  const deals = breakdown.reduce((s, p) => s + (p.deals ?? 0), 0);
  return {
    monthId,
    ca,
    marge,
    margePct: ca > 0 ? (marge / ca) * 100 : 0,
    charges: ca - marge,
    deals,
    breakdown,
  };
}
