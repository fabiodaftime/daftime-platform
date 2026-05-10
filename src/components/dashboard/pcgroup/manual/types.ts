// Shared types for per-month manual data files (Holding, SPY, Comment, Intercos).
// Each `manual/YYYY-MM.ts` file is the source of truth for that month.

export interface ManualEntityFacts {
  ca: number;
  margeNette: number;
  charges: number;
  marginPct: number;
  deals?: number;
}

export interface ManualHoldingBlock {
  /** Total frais holding for the month (Compta + Salaires + Tools + Bank Fees + …). */
  fraisTotal: number;
  /** Detailed breakdown rendered in consolidatedPL & holdingSynthese. */
  fraisDetail: { label: string; amount: number }[];
  /** Director distribution (must sum to 100). */
  distribution: {
    maxencePct: number;
    thibaultPct: number;
    florianPct: number;
    /** Info-only line "↳ dont Will via Thibault". */
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
  /** Encaissements reçus par entité pour la marge générée durant ce mois. */
  received: Partial<Record<'agency' | 'structuring' | 'digit' | 'spy' | 'comment', number>>;
  /** Apport exceptionnel d'un dirigeant pour combler un retard de remontée. */
  apportMaxence?: number;
}

/** Single-month manual payload — one of these per `manual/YYYY-MM.ts`. */
export interface ManualMonthFile {
  monthId: string; // 'jan-2026', etc.
  extras: ManualMonthExtras;
  intercosCash: IntercoCashBlock;
}
