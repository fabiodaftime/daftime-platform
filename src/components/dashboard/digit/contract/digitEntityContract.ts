// ============================================================================
// DIGIT GROUP — CONTRAT HYBRIDE D'ENTITÉ (Option C)
// ----------------------------------------------------------------------------
// Sens de l'automatisation : BOTTOM-UP par entité.
//
//   [Digit Core]   [SPY]   [Comment/Trust]
//          \        |        /
//           \       v       /
//            +--> consolidateDigitGroup() --> Vue "Digit Solution" (group)
//
// Règles :
//   1. Chaque entité (core | spy | comment) expose UNE seule fonction
//      `getDigitEntityPnL(entity, month)` qui retourne un `DigitEntityPnL`
//      typé. C'est la SEULE source de vérité numérique.
//   2. Les saisies admin (`entity_inputs.digit`) s'appliquent UNIQUEMENT au
//      niveau entité, jamais au niveau group. Le group recalcule.
//   3. Le mapping `DIGIT_GROUP_MAPPING` déclare quelles entités composent le
//      group → on peut ajouter/retirer une entité sans changer le code conso.
//   4. Les vues filiales isolées (DashboardSpy, DashboardComment, et la vue
//      Core embarquée dans DashboardDigit) consomment ce contrat. La vue
//      Group consolidée le consomme aussi via le consolidator.
// ============================================================================

import { getDigitMonthData, type DigitMonthId } from '../DigitData';
import { getEntityInput } from '@/lib/entityInputs/store';

export type DigitEntity = 'core' | 'spy' | 'comment';

export interface DigitEntityPnL {
  entity: DigitEntity;
  monthId: DigitMonthId;
  /** Chiffre d'affaires en USD */
  ca: number;
  /** Marge nette en USD */
  marge: number;
  /** Marge / CA en % */
  margePct: number;
  /** Charges totales (CA - Marge), utilitaire dérivé */
  charges: number;
  /** Nombre de deals si disponible (Core uniquement à ce jour) */
  deals?: number;
  /** Origine de la data, utile pour debug et bandeaux de cohérence */
  source: 'inputs' | 'static';
}

const parseUSD = (v: unknown): number => {
  if (typeof v !== 'string') return 0;
  const cleaned = v.replace(/[^0-9.\-]/g, '');
  return cleaned ? parseFloat(cleaned) : 0;
};

/**
 * Source de vérité unique pour une entité Digit sur un mois donné.
 *
 * Ordre de priorité :
 *   1. Saisies admin (`entity_inputs.digit`) si présentes pour le champ entité.
 *   2. Données statiques de `DigitData.ts` (per-product fields existants).
 */
export function getDigitEntityPnL(entity: DigitEntity, monthId: DigitMonthId): DigitEntityPnL {
  const monthData = getDigitMonthData(monthId);
  const inputs = getEntityInput('digit', monthId);

  // ----- 1. Saisies (priorité) -----
  if (inputs) {
    const fromInputs = readInputs(entity, inputs);
    if (fromInputs) {
      return finalize(entity, monthId, fromInputs.ca, fromInputs.marge, fromInputs.deals, 'inputs');
    }
  }

  // ----- 2. Fallback statique (DigitData.ts) -----
  const fromStatic = readStatic(entity, monthData);
  return finalize(entity, monthId, fromStatic.ca, fromStatic.marge, fromStatic.deals, 'static');
}

function readInputs(entity: DigitEntity, inputs: any): { ca: number; marge: number; deals?: number } | null {
  if (entity === 'core') {
    if (typeof inputs.ca_core === 'number' && inputs.ca_core > 0) {
      return { ca: inputs.ca_core, marge: inputs.marge_core ?? 0, deals: inputs.deals_total };
    }
    return null;
  }
  if (entity === 'spy') {
    if (typeof inputs.ca_spy === 'number' && inputs.ca_spy > 0) {
      return { ca: inputs.ca_spy, marge: inputs.marge_spy ?? 0 };
    }
    return null;
  }
  if (entity === 'comment') {
    if (typeof inputs.ca_comment === 'number' && inputs.ca_comment > 0) {
      return { ca: inputs.ca_comment, marge: inputs.marge_comment ?? 0 };
    }
    return null;
  }
  return null;
}

function readStatic(entity: DigitEntity, m: any): { ca: number; marge: number; deals?: number } {
  if (entity === 'core') {
    // Core = CA total - SPY - Comment (les KPIs Vue d'ensemble portent le total).
    const totalCa = parseUSD(m.overviewKPIs?.[0]?.value);
    const totalMarge = parseUSD(m.overviewKPIs?.[1]?.value);
    const spyCa = parseUSD(m.spyKPIs?.[0]?.value);
    const spyMarge = parseUSD(m.spyKPIs?.[1]?.value);
    const ctCa = parseUSD(m.ctKPIs?.[0]?.value);
    const ctMarge = parseUSD(m.ctKPIs?.[1]?.value);
    return {
      ca: Math.max(0, totalCa - spyCa - ctCa),
      marge: totalMarge - spyMarge - ctMarge,
    };
  }
  if (entity === 'spy') {
    return {
      ca: parseUSD(m.spyKPIs?.[0]?.value),
      marge: parseUSD(m.spyKPIs?.[1]?.value),
    };
  }
  return {
    ca: parseUSD(m.ctKPIs?.[0]?.value),
    marge: parseUSD(m.ctKPIs?.[1]?.value),
  };
}

function finalize(
  entity: DigitEntity,
  monthId: DigitMonthId,
  ca: number,
  marge: number,
  deals: number | undefined,
  source: 'inputs' | 'static',
): DigitEntityPnL {
  return {
    entity,
    monthId,
    ca,
    marge,
    margePct: ca > 0 ? (marge / ca) * 100 : 0,
    charges: ca - marge,
    deals,
    source,
  };
}

// ============================================================================
// MAPPING DÉCLARATIF — quelles entités composent le group "Digit Solution"
// ============================================================================
export const DIGIT_GROUP_MAPPING: ReadonlyArray<DigitEntity> = ['core', 'spy', 'comment'] as const;

export const DIGIT_ENTITY_META: Record<DigitEntity, { label: string; short: string; accent: string }> = {
  core: { label: 'Digit Solution (Core)', short: 'Core', accent: '#0066FF' },
  spy: { label: 'SPY', short: 'SPY', accent: '#7C3AED' },
  comment: { label: 'Comment / Trust', short: 'Comment', accent: '#17B169' },
};
