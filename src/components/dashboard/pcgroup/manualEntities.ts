// Backward-compat shim — la source de vérité est maintenant le store
// `config/configStore.ts` (alimenté par Supabase).
//
// MANUAL_ENTITIES et INTERCOS_CASH sont exposés via des Proxy "live" qui
// recalculent à chaque accès depuis le store. Tout consommateur existant
// (`MANUAL_ENTITIES['jan-2026']?.spy`) bénéficie automatiquement des updates
// admin sans modification.

import { getPCGroupConfig } from './config/configStore';
import type { PCGroupConfig } from './config/types';
import type { PCGSourceMonthId } from './sources/entityAdapters';

export interface ManualEntityFacts {
  ca: number;
  margeNette: number;
  charges: number;
  marginPct: number;
  deals?: number;
}

export interface ManualHoldingBlock {
  fraisTotal: number;
  fraisDetail: { label: string; amount: number }[];
  distribution: {
    maxencePct: number;
    thibaultPct: number;
    florianPct: number;
    willInThibault?: number;
  };
}

export interface ManualMonthExtras {
  spy: ManualEntityFacts;
  comment: ManualEntityFacts;
  commentWarning?: string;
  holding: ManualHoldingBlock;
}

export interface IntercoCashBlock {
  received: Partial<Record<'agency' | 'structuring' | 'digit' | 'spy' | 'comment', number>>;
  apportMaxence?: number;
}

// ---------------------------------------------------------------------------
// Builders à partir de PCGroupConfig
// ---------------------------------------------------------------------------

function buildManualExtras(cfg: PCGroupConfig, monthId: string): ManualMonthExtras | undefined {
  const facts = cfg.manualFacts.filter((f) => f.month_id === monthId);
  const spy = facts.find((f) => f.entity_code === 'spy');
  const comment = facts.find((f) => f.entity_code === 'comment');
  const holding = cfg.holdingFacts.find((h) => h.month_id === monthId);
  const rule = cfg.rules.find((r) => r.month_id === monthId);
  if (!spy || !comment || !holding) return undefined;

  return {
    spy: {
      ca: Number(spy.ca),
      margeNette: Number(spy.contribution),
      charges: Number(spy.charges),
      marginPct: Number(spy.margin_pct),
      deals: spy.deals ?? undefined,
    },
    comment: {
      ca: Number(comment.ca),
      margeNette: Number(comment.contribution),
      charges: Number(comment.charges),
      marginPct: Number(comment.margin_pct),
      deals: comment.deals ?? undefined,
    },
    commentWarning: comment.warning ?? '',
    holding: {
      fraisTotal: Number(holding.frais_total),
      fraisDetail: holding.frais_detail ?? [],
      distribution: {
        maxencePct: Number(rule?.maxence_pct ?? 37.5),
        thibaultPct: Number(rule?.thibault_pct ?? 37.5),
        florianPct: Number(rule?.florian_pct ?? 25),
        willInThibault: Number(rule?.will_in_thibault ?? 10000),
      },
    },
  };
}

function buildIntercosCash(cfg: PCGroupConfig, monthId: string): IntercoCashBlock | undefined {
  const rows = cfg.intercosCash.filter((c) => c.month_id === monthId);
  const holding = cfg.holdingFacts.find((h) => h.month_id === monthId);
  if (rows.length === 0 && (!holding || !holding.apport_maxence)) return undefined;

  const received: IntercoCashBlock['received'] = {};
  for (const r of rows) {
    (received as any)[r.entity_code] = Number(r.amount_received);
  }
  const block: IntercoCashBlock = { received };
  if (holding && Number(holding.apport_maxence) > 0) {
    block.apportMaxence = Number(holding.apport_maxence);
  }
  return block;
}

// ---------------------------------------------------------------------------
// Proxies "live" — chaque accès relit le store
// ---------------------------------------------------------------------------

export const MANUAL_ENTITIES: Partial<Record<PCGSourceMonthId, ManualMonthExtras>> = new Proxy(
  {} as Partial<Record<PCGSourceMonthId, ManualMonthExtras>>,
  {
    get(_t, key: string) {
      return buildManualExtras(getPCGroupConfig(), key);
    },
    has(_t, key: string) {
      return buildManualExtras(getPCGroupConfig(), key) !== undefined;
    },
    ownKeys() {
      const cfg = getPCGroupConfig();
      const ids = new Set(cfg.holdingFacts.map((h) => h.month_id));
      return Array.from(ids);
    },
    getOwnPropertyDescriptor(_t, key: string) {
      const v = buildManualExtras(getPCGroupConfig(), key);
      return v ? { enumerable: true, configurable: true, value: v } : undefined;
    },
  },
);

export const INTERCOS_CASH: Partial<Record<PCGSourceMonthId, IntercoCashBlock>> = new Proxy(
  {} as Partial<Record<PCGSourceMonthId, IntercoCashBlock>>,
  {
    get(_t, key: string) {
      return buildIntercosCash(getPCGroupConfig(), key);
    },
    has(_t, key: string) {
      return buildIntercosCash(getPCGroupConfig(), key) !== undefined;
    },
    ownKeys() {
      const cfg = getPCGroupConfig();
      const ids = new Set([
        ...cfg.intercosCash.map((c) => c.month_id),
        ...cfg.holdingFacts.filter((h) => Number(h.apport_maxence) > 0).map((h) => h.month_id),
      ]);
      return Array.from(ids);
    },
    getOwnPropertyDescriptor(_t, key: string) {
      const v = buildIntercosCash(getPCGroupConfig(), key);
      return v ? { enumerable: true, configurable: true, value: v } : undefined;
    },
  },
);
