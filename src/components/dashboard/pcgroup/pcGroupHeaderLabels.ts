// Pure helpers for the PCGroup consolidated dashboard header/footer.
// Extracted so the labels are unit-testable without rendering the full page.

import type { PCGEntityRow } from './config/types';

export interface HeaderCounts {
  filiales: number;
  holding: number;
  total: number;
}

/** Counts active filiales vs holding entities (based on `base_role`). */
export function countActiveEntities(entities: PCGEntityRow[]): HeaderCounts {
  const active = entities.filter((e) => e.is_active);
  const holding = active.filter((e) => e.base_role === 'holding').length;
  return {
    holding,
    filiales: active.length - holding,
    total: active.length,
  };
}

/** Header subtitle: "X Filiales + N Holding • Y mois disponibles". */
export function buildHeaderSubtitle(entities: PCGEntityRow[], availableMonths: number): string {
  const c = countActiveEntities(entities);
  const left =
    c.holding > 0
      ? `${c.filiales} Filiale${c.filiales > 1 ? 's' : ''} + ${c.holding} Holding`
      : `${c.total} ${c.total > 1 ? 'Entités' : 'Entité'}`;
  return `${left} • ${availableMonths} mois disponible${availableMonths > 1 ? 's' : ''}`;
}
