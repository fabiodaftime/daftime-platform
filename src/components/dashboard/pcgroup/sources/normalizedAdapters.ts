// Normalized entity adapters
// --------------------------
// Goal: every source dashboard (Agency, Structuring, Digit) and every manual
// block (SPY, Comment) is read through a UNIFORM shape — `NormalizedEntityMonth`
// — so the PCGroup aggregator can iterate over a single homogeneous list
// instead of branching per entity.
//
// Add a new entity → add one adapter that returns NormalizedEntityMonth and
// register it in `ENTITY_ADAPTERS`. Nothing else to touch.

import {
  agencyFacts,
  structuringFacts,
  digitFacts,
  type PCGSourceMonthId,
} from './entityAdapters';
import { MANUAL_ENTITIES } from '../manualEntities';

export type EntityKey = 'agency' | 'structuring' | 'digit' | 'spy' | 'comment';

export interface NormalizedEntityMonth {
  /** Stable identifier for the entity. */
  entityKey: EntityKey;
  /** Display name. */
  entityName: string;
  /** Source: where the figures originate (live dashboard or manual block). */
  source: 'dashboard' | 'manual';
  /** Period. */
  monthId: PCGSourceMonthId;
  /** Topline. */
  ca: number;
  /** OPEX / cost of sales. */
  charges: number;
  /**
   * Net margin contributed to the GROUP P&L. For Agency this is the 50% PCA
   * share (NOT the 100% margin), for the others it's the entity's own net
   * margin. This is the canonical figure the consolidated view sums.
   */
  contribution: number;
  /** Entity's own margin % (computed from its own CA, not the group CA). */
  marginPct: number;
  /** Optional context. */
  meta?: {
    deals?: number;
    clients?: number;
    ticketMoyen?: number;
    /** Agency-only: full margin before 50% split, exposed for transparency. */
    fullMargin?: number;
  };
}

type Adapter = (m: PCGSourceMonthId) => NormalizedEntityMonth | null;

// ---------- Adapters ----------
const agencyAdapter: Adapter = (m) => {
  const f = agencyFacts(m);
  if (!f) return null;
  return {
    entityKey: 'agency',
    entityName: 'Agency (Part PCA 50%)',
    source: 'dashboard',
    monthId: m,
    ca: f.ca,
    charges: f.charges,
    contribution: f.partPCA ?? f.margeNette / 2,
    marginPct: f.marginPct,
    meta: { deals: f.deals, fullMargin: f.margeNette },
  };
};

const structuringAdapter: Adapter = (m) => {
  const f = structuringFacts(m);
  if (!f) return null;
  return {
    entityKey: 'structuring',
    entityName: 'Structuring',
    source: 'dashboard',
    monthId: m,
    ca: f.ca,
    charges: f.charges,
    contribution: f.margeNette,
    marginPct: f.marginPct,
    meta: { clients: f.clients, ticketMoyen: f.ticketMoyen },
  };
};

const digitAdapter: Adapter = (m) => {
  const f = digitFacts(m);
  if (!f) return null;
  return {
    entityKey: 'digit',
    entityName: 'Digit Solution',
    source: 'dashboard',
    monthId: m,
    ca: f.ca,
    charges: f.charges,
    contribution: f.margeNette,
    marginPct: f.marginPct,
  };
};

const spyAdapter: Adapter = (m) => {
  const block = MANUAL_ENTITIES[m]?.spy;
  if (!block) return null;
  return {
    entityKey: 'spy',
    entityName: 'SPY',
    source: 'manual',
    monthId: m,
    ca: block.ca,
    charges: block.charges,
    contribution: block.margeNette,
    marginPct: block.marginPct,
    meta: { deals: block.deals },
  };
};

const commentAdapter: Adapter = (m) => {
  const block = MANUAL_ENTITIES[m]?.comment;
  if (!block) return null;
  return {
    entityKey: 'comment',
    entityName: 'Comment/Trustpilot',
    source: 'manual',
    monthId: m,
    ca: block.ca,
    charges: block.charges,
    contribution: block.margeNette,
    marginPct: block.marginPct,
    meta: { deals: block.deals },
  };
};

/** Ordered registry. Adding a new entity = appending one line here. */
export const ENTITY_ADAPTERS: { key: EntityKey; adapter: Adapter }[] = [
  { key: 'agency', adapter: agencyAdapter },
  { key: 'structuring', adapter: structuringAdapter },
  { key: 'digit', adapter: digitAdapter },
  { key: 'spy', adapter: spyAdapter },
  { key: 'comment', adapter: commentAdapter },
];

// ---------- Collectors ----------
/** Returns one normalized block per entity, or null when missing. */
export function collectEntityMonths(
  month: PCGSourceMonthId,
): { key: EntityKey; data: NormalizedEntityMonth | null }[] {
  return ENTITY_ADAPTERS.map(({ key, adapter }) => ({ key, data: adapter(month) }));
}

/** Returns only entities that have data for `month`. */
export function collectAvailableEntityMonths(
  month: PCGSourceMonthId,
): NormalizedEntityMonth[] {
  return collectEntityMonths(month)
    .map((x) => x.data)
    .filter((d): d is NormalizedEntityMonth => d !== null);
}

/** Single-entity lookup by key. */
export function getEntityMonth(
  key: EntityKey,
  month: PCGSourceMonthId,
): NormalizedEntityMonth | null {
  return ENTITY_ADAPTERS.find((a) => a.key === key)?.adapter(month) ?? null;
}
