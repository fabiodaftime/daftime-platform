// Consolidated PCGroup aggregator
// ---------------------------------
// Computes the *derivable* parts of PCGroupMonthData from the source dashboards
// (Agency, Structuring, Digit) plus manual data for entities without a
// standalone dashboard (SPY, Comment, Holding).
//
// Strategy: the legacy PCGroupData.ts still owns the bespoke per-month display
// strings (waterfall labels, intercos, holding fees breakdown). This aggregator
// OVERRIDES the totals & cross-entity sums so they stay in sync automatically
// whenever a source dashboard's monthly figures change.
//
// Workflow when a new month is added to a source dashboard:
//   1. Fill DIGIT_NUMERIC_FACTS[month] (Digit only — Agency/Structuring expose
//      numeric facts directly via their data files).
//   2. Provide a manual block for SPY / Comment / Holding for that month
//      (see manualEntities.ts).
//   3. The aggregator picks it up and the consolidated totals appear.

import {
  agencyFacts,
  structuringFacts,
  digitFacts,
  type PCGSourceMonthId,
} from './sources/entityAdapters';
import {
  collectEntityMonths,
  getEntityMonth,
  type EntityKey,
} from './sources/normalizedAdapters';
import { fmtUSD, fmtPct, pctChange, fmtPctSigned } from './pcGroupFormatters';
import { MANUAL_ENTITIES, type ManualMonthExtras } from './manualEntities';

export interface ConsolidatedFacts {
  monthId: PCGSourceMonthId;
  // Per-entity marges (used as the canonical "MARGE BRUTE GROUPE" inputs)
  agencyPartPCA: number;       // 50% share already applied
  structuringMargeNette: number;
  digitMargeNette: number;
  spyMargeNette: number;       // from manual
  commentMargeNette: number;   // from manual
  // Per-entity CAs
  agencyCA: number;
  structuringCA: number;
  digitCA: number;
  spyCA: number;
  commentCA: number;
  // Group-level
  caGroupe: number;
  margeBruteGroupe: number;
  reservesFiliales: number;    // 10% of margeBrute
  remonteeHolding: number;     // 90% of margeBrute
  fraisHolding: number;        // from manual
  resultatNetHolding: number;  // remontee - fraisHolding
  // Director split (from manual percentages)
  maxenceAmount: number;
  thibaultAmount: number;
  florianAmount: number;
}

export function computeConsolidatedFacts(month: PCGSourceMonthId): ConsolidatedFacts | null {
  const a = agencyFacts(month);
  const s = structuringFacts(month);
  const d = digitFacts(month);
  const m: ManualMonthExtras | undefined = MANUAL_ENTITIES[month];
  if (!a || !s || !d || !m) return null;

  const agencyPartPCA = a.partPCA ?? a.margeNette / 2;
  const margeBrute =
    agencyPartPCA + s.margeNette + d.margeNette + m.spy.margeNette + m.comment.margeNette;
  const reserves = margeBrute * 0.10;
  const remontee = margeBrute - reserves;
  const fraisHolding = m.holding.fraisTotal;
  const resultatNet = remontee - fraisHolding;

  return {
    monthId: month,
    agencyPartPCA,
    structuringMargeNette: s.margeNette,
    digitMargeNette: d.margeNette,
    spyMargeNette: m.spy.margeNette,
    commentMargeNette: m.comment.margeNette,
    agencyCA: a.ca,
    structuringCA: s.ca,
    digitCA: d.ca,
    spyCA: m.spy.ca,
    commentCA: m.comment.ca,
    caGroupe: a.ca + s.ca + d.ca + m.spy.ca + m.comment.ca,
    margeBruteGroupe: margeBrute,
    reservesFiliales: reserves,
    remonteeHolding: remontee,
    fraisHolding,
    resultatNetHolding: resultatNet,
    maxenceAmount: resultatNet * (m.holding.distribution.maxencePct / 100),
    thibaultAmount: resultatNet * (m.holding.distribution.thibaultPct / 100),
    florianAmount: resultatNet * (m.holding.distribution.florianPct / 100),
  };
}

// ---------- YTD aggregation ----------
export interface YTDFacts {
  months: { id: PCGSourceMonthId; label: string; facts: ConsolidatedFacts }[];
  caYTD: number;
  margeBruteYTD: number;
  resultatNetYTD: number;
  reservesYTD: number;
  perEntityYTD: {
    agency: number;
    structuring: number;
    digit: number;
    spy: number;
    comment: number;
  };
}

const MONTH_LABELS: Record<PCGSourceMonthId, string> = {
  'jan-2026': 'Janvier 2026',
  'feb-2026': 'Février 2026',
  'mar-2026': 'Mars 2026',
  'apr-2026': 'Avril 2026',
};

const MONTH_ORDER: PCGSourceMonthId[] = ['jan-2026', 'feb-2026', 'mar-2026', 'apr-2026'];

export function computeYTD(uptoMonth: PCGSourceMonthId): YTDFacts {
  const idx = MONTH_ORDER.indexOf(uptoMonth);
  const months = MONTH_ORDER.slice(0, idx + 1)
    .map((id) => {
      const facts = computeConsolidatedFacts(id);
      if (!facts) return null;
      return { id, label: MONTH_LABELS[id], facts };
    })
    .filter((x): x is { id: PCGSourceMonthId; label: string; facts: ConsolidatedFacts } => x !== null);

  const sum = (sel: (f: ConsolidatedFacts) => number) =>
    months.reduce((acc, m) => acc + sel(m.facts), 0);

  return {
    months,
    caYTD: sum((f) => f.caGroupe),
    margeBruteYTD: sum((f) => f.margeBruteGroupe),
    resultatNetYTD: sum((f) => f.resultatNetHolding),
    reservesYTD: sum((f) => f.reservesFiliales),
    perEntityYTD: {
      agency: sum((f) => f.agencyPartPCA),
      structuring: sum((f) => f.structuringMargeNette),
      digit: sum((f) => f.digitMargeNette),
      spy: sum((f) => f.spyMargeNette),
      comment: sum((f) => f.commentMargeNette),
    },
  };
}

// ---------- Variance helpers exported for tabs / validators ----------
export function monthOverMonth(curr: ConsolidatedFacts, prev: ConsolidatedFacts | null) {
  if (!prev) return null;
  return {
    caGroupe: pctChange(curr.caGroupe, prev.caGroupe),
    margeBrute: pctChange(curr.margeBruteGroupe, prev.margeBruteGroupe),
    resultatNet: pctChange(curr.resultatNetHolding, prev.resultatNetHolding),
    reserves: pctChange(curr.reservesFiliales, prev.reservesFiliales),
  };
}

// Diagnostic helper used by the validation panel & CI gate
export interface ConsolidatedDiagnostic {
  monthId: PCGSourceMonthId;
  ok: boolean;
  issues: string[];
}

export function diagnoseMonth(month: PCGSourceMonthId): ConsolidatedDiagnostic {
  const issues: string[] = [];
  const a = agencyFacts(month);
  const s = structuringFacts(month);
  const d = digitFacts(month);
  const m = MANUAL_ENTITIES[month];
  if (!a) issues.push('Agency: facts missing for this month');
  if (!s) issues.push('Structuring: facts missing for this month');
  if (!d) issues.push('Digit: numeric facts missing (DIGIT_NUMERIC_FACTS)');
  if (!m) issues.push('Manual SPY/Comment/Holding block missing (MANUAL_ENTITIES)');
  if (m && m.holding.distribution) {
    const total =
      m.holding.distribution.maxencePct +
      m.holding.distribution.thibaultPct +
      m.holding.distribution.florianPct;
    if (Math.abs(total - 100) > 0.01) {
      issues.push(`Director % must sum to 100 (got ${total})`);
    }
  }
  return { monthId: month, ok: issues.length === 0, issues };
}

// ============================================================================
// aggregatePCGroup(monthId)
// ----------------------------------------------------------------------------
// Single high-level entry point that returns ALL consolidated KPIs and YTD
// figures for the consolidated PCGroup view, computed live from the source
// dashboards (Agency, Structuring, Digit) + manual entities (SPY, Comment,
// Holding). Both raw numbers and pre-formatted display strings are exposed.
// ============================================================================

export interface PCGroupKPI {
  label: string;
  value: string;
  raw: number;
  detail: string;
  variance: string | null;
  variancePct: number | null;
  varType: 'positive' | 'negative' | 'neutral' | null;
}

export interface PCGroupAggregate {
  monthId: PCGSourceMonthId;
  monthLabel: string;
  facts: ConsolidatedFacts;
  prevFacts: ConsolidatedFacts | null;
  kpis: {
    caGroupe: PCGroupKPI;
    margeBrute: PCGroupKPI;
    resultatNet: PCGroupKPI;
    reserves: PCGroupKPI;
  };
  entityBreakdown: {
    key: 'agency' | 'structuring' | 'digit' | 'spy' | 'comment';
    name: string;
    ca: number;
    margeNette: number;
    pctOfMargeBrute: number;
  }[];
  ytd: {
    facts: YTDFacts;
    kpis: {
      caYTD: PCGroupKPI;
      margeBruteYTD: PCGroupKPI;
      resultatNetYTD: PCGroupKPI;
      reservesYTD: PCGroupKPI;
    };
    monthlyTrend: { month: string; ca: number; margin: number; net: number }[];
    perEntityRows: {
      entity: string;
      months: { id: PCGSourceMonthId; value: number }[];
      total: number;
      pct: number;
    }[];
    perEntityTotal: { entity: string; total: number; months: { id: PCGSourceMonthId; value: number }[] };
  };
  diagnostic: ConsolidatedDiagnostic;
}

/**
 * Aggregate ALL consolidated KPIs and YTD for a given month from the source
 * dashboards. Returns null when the month cannot be aggregated (missing
 * source data or manual block).
 */
export function aggregatePCGroup(monthId: PCGSourceMonthId): PCGroupAggregate | null {
  const facts = computeConsolidatedFacts(monthId);
  if (!facts) return null;

  const idx = MONTH_ORDER.indexOf(monthId);
  const prevId = idx > 0 ? MONTH_ORDER[idx - 1] : null;
  const prevFacts = prevId ? computeConsolidatedFacts(prevId) : null;
  const mom = monthOverMonth(facts, prevFacts);

  const usd = (n: number) => fmtUSD(Math.round(n));
  const prevLabel = prevId ? MONTH_LABELS[prevId].split(' ')[0] : '';

  const buildKpi = (
    label: string,
    raw: number,
    detail: string,
    variancePct: number | null,
    inverse = false,
  ): PCGroupKPI => {
    const variance =
      variancePct == null ? null : `${fmtPctSigned(variancePct)} vs ${prevLabel}`;
    const varType: 'positive' | 'negative' | 'neutral' | null =
      variancePct == null
        ? null
        : variancePct === 0
          ? 'neutral'
          : (inverse ? variancePct < 0 : variancePct > 0)
            ? 'positive'
            : 'negative';
    return { label, value: usd(raw), raw, detail, variance, variancePct, varType };
  };

  const entitySpecs = [
    { key: 'agency' as const, name: 'Agency (Part PCA)', ca: facts.agencyCA, marge: facts.agencyPartPCA },
    { key: 'structuring' as const, name: 'Structuring', ca: facts.structuringCA, marge: facts.structuringMargeNette },
    { key: 'digit' as const, name: 'Digit Solution', ca: facts.digitCA, marge: facts.digitMargeNette },
    { key: 'spy' as const, name: 'SPY', ca: facts.spyCA, marge: facts.spyMargeNette },
    { key: 'comment' as const, name: 'Comment/Trustpilot', ca: facts.commentCA, marge: facts.commentMargeNette },
  ];

  const ytd = computeYTD(monthId);
  const monthlyTrend = ytd.months.map((m) => ({
    month: m.label.split(' ')[0],
    ca: Math.round(m.facts.caGroupe),
    margin: Math.round(m.facts.margeBruteGroupe),
    net: Math.round(m.facts.resultatNetHolding),
  }));

  const perEntitySelectors: {
    entity: string;
    sel: (f: ConsolidatedFacts) => number;
    totalKey: keyof YTDFacts['perEntityYTD'];
  }[] = [
    { entity: 'Agency (Part PCA)', sel: (f) => f.agencyPartPCA, totalKey: 'agency' },
    { entity: 'Structuring', sel: (f) => f.structuringMargeNette, totalKey: 'structuring' },
    { entity: 'Digit Solution', sel: (f) => f.digitMargeNette, totalKey: 'digit' },
    { entity: 'SPY', sel: (f) => f.spyMargeNette, totalKey: 'spy' },
    { entity: 'Comment/Trustpilot', sel: (f) => f.commentMargeNette, totalKey: 'comment' },
  ];

  const perEntityRows = perEntitySelectors.map(({ entity, sel, totalKey }) => {
    const total = ytd.perEntityYTD[totalKey];
    return {
      entity,
      months: ytd.months.map((m) => ({ id: m.id, value: Math.round(sel(m.facts)) })),
      total: Math.round(total),
      pct: ytd.margeBruteYTD > 0 ? (total / ytd.margeBruteYTD) * 100 : 0,
    };
  });

  const perEntityTotal = {
    entity: 'TOTAL GROUPE',
    total: Math.round(ytd.margeBruteYTD),
    months: ytd.months.map((m) => ({ id: m.id, value: Math.round(m.facts.margeBruteGroupe) })),
  };

  const ratio = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);

  return {
    monthId,
    monthLabel: MONTH_LABELS[monthId],
    facts,
    prevFacts,
    kpis: {
      caGroupe: buildKpi('CA Groupe', facts.caGroupe, `${entitySpecs.length} entités consolidées`, mom?.caGroupe ?? null),
      margeBrute: buildKpi('Marge Brute Groupe', facts.margeBruteGroupe, `${fmtPct(ratio(facts.margeBruteGroupe, facts.caGroupe))} du CA`, mom?.margeBrute ?? null),
      resultatNet: buildKpi('Résultat Net Holding', facts.resultatNetHolding, 'Après frais holding', mom?.resultatNet ?? null),
      reserves: buildKpi('Réserves Filiales', facts.reservesFiliales, '10% marge brute', mom?.reserves ?? null),
    },
    entityBreakdown: entitySpecs.map((e) => ({
      key: e.key,
      name: e.name,
      ca: Math.round(e.ca),
      margeNette: Math.round(e.marge),
      pctOfMargeBrute: ratio(e.marge, facts.margeBruteGroupe),
    })),
    ytd: {
      facts: ytd,
      kpis: {
        caYTD: buildKpi('CA YTD', ytd.caYTD, `${ytd.months.length} mois cumulés`, null),
        margeBruteYTD: buildKpi('Marge Brute YTD', ytd.margeBruteYTD, `${fmtPct(ratio(ytd.margeBruteYTD, ytd.caYTD))} du CA`, null),
        resultatNetYTD: buildKpi('Résultat Net YTD', ytd.resultatNetYTD, 'Holding cumulé', null),
        reservesYTD: buildKpi('Réserves Cumulées', ytd.reservesYTD, 'Toutes filiales', null),
      },
      monthlyTrend,
      perEntityRows,
      perEntityTotal,
    },
    diagnostic: diagnoseMonth(monthId),
  };
}

// Re-export for convenience
export { fmtUSD, fmtPct, fmtPctSigned };
