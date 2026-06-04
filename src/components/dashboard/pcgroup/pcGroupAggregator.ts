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
import { getPCAMonthData, type PCAMonthId } from '../primecircle-agency/PrimeCircleAgencyData';
import { getPCMonthData, type PCMonthId } from '../primecircle/PrimeCircleData';
import { getDigitMonthData, type DigitMonthId } from '../digit/DigitData';

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
  // Use the normalized layer: one homogeneous list, one loop, no branching.
  const blocks = collectEntityMonths(month);
  const byKey = (k: EntityKey) => blocks.find((b) => b.key === k)?.data ?? null;
  const a = byKey('agency');
  const s = byKey('structuring');
  const d = byKey('digit');
  const spy = byKey('spy');
  const cmt = byKey('comment');
  const m: ManualMonthExtras | undefined = MANUAL_ENTITIES[month];
  if (!a || !s || !d || !spy || !cmt || !m) return null;

  // IMPORTANT: l'adapter `digitFacts` (via collectEntityMonths -> block 'digit')
  // retourne le CA / la marge de Digit **Core uniquement**. SPY et Comment sont
  // des produits internes à Digit Solution exposés séparément. Pour la "Vue
  // Groupe" et le comparatif, la ligne "Digit Solution" doit représenter le
  // TOTAL consolidé (Core + SPY + Comment). On agrège donc ici, et toutes les
  // formules en aval (margeBruteGroupe, caGroupe, "↳ dont …") reposent sur ce
  // total — aucun double comptage car a/s/digitTotal sont les 3 piliers.
  const digitTotalCA = d.ca + spy.ca + cmt.ca;
  const digitTotalMarge = d.contribution + spy.contribution + cmt.contribution;

  const margeBrute = a.contribution + s.contribution + digitTotalMarge;
  const reserves = margeBrute * 0.10;
  const remontee = margeBrute - reserves;
  const fraisHolding = m.holding.fraisTotal;
  const resultatNet = remontee - fraisHolding;

  return {
    monthId: month,
    agencyPartPCA: a.contribution,
    structuringMargeNette: s.contribution,
    digitMargeNette: digitTotalMarge,
    spyMargeNette: spy.contribution,
    commentMargeNette: cmt.contribution,
    agencyCA: a.ca,
    structuringCA: s.ca,
    digitCA: digitTotalCA,
    spyCA: spy.ca,
    commentCA: cmt.ca,
    caGroupe: a.ca + s.ca + digitTotalCA,
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
  'may-2026': 'Mai 2026',
};

const MONTH_ORDER: PCGSourceMonthId[] = ['jan-2026', 'feb-2026', 'mar-2026', 'apr-2026', 'may-2026'];

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

// ============================================================================
// buildPCGroupMonthData(month, base, monthLabel)
// ----------------------------------------------------------------------------
// Auto-overlays a base PCGroupMonthData with everything that is *derivable*
// from the three source dashboards (Agency / Structuring / Digit) plus the
// manual SPY / Comment / Holding block: KPIs, entity cards, pies, comparisons,
// YTD tables, reserves and intercos. Bespoke per-entity tab strings provided
// by the base remain untouched.
// ============================================================================

import { fmtUSDk } from './pcGroupFormatters';
import { computeIntercos } from './pcGroupIntercosCompute';
import type { PCGroupMonthData, PCGComparisonRow, PCGOverviewComparisonRow, MonthId } from './PCGroupData';

const BUILD_MONTH_KEYS: MonthId[] = ['jan-2026', 'feb-2026', 'mar-2026', 'apr-2026'];
const BUILD_MONTH_SHORT: Record<MonthId, string> = {
  'jan-2026': 'Janvier',
  'feb-2026': 'Février',
  'mar-2026': 'Mars',
  'apr-2026': 'Avril',
};
const BUILD_MONTH_KEY: Record<MonthId, 'jan' | 'feb' | 'mar' | 'avr'> = {
  'jan-2026': 'jan',
  'feb-2026': 'feb',
  'mar-2026': 'mar',
  'apr-2026': 'avr',
};

const BUILD_ENTITY_META = [
  { id: 'agency', name: 'Agency', badge: 'Media',
    gradient: 'linear-gradient(135deg, #4F5BD5 0%, #6366F1 100%)', cssClass: 'agency',
    pieColor: '#F59E0B' },
  { id: 'structuring', name: 'Structuring', badge: 'Banking',
    gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)', cssClass: 'structuring',
    pieColor: '#1E3A5F' },
  { id: 'digit', name: 'Digit Solution', badge: 'Ad Accounts',
    gradient: 'linear-gradient(135deg, #D946A8 0%, #EC4899 100%)', cssClass: 'digit',
    pieColor: '#4F5BD5' },
  { id: 'spy', name: 'SPY', badge: 'Tools',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', cssClass: 'spy',
    pieColor: '#10B981' },
  { id: 'comment', name: 'Comment', badge: 'Trust',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', cssClass: 'comment',
    pieColor: '#D946A8' },
] as const;

type BuildEntityKey = 'agency' | 'structuring' | 'digit' | 'spy' | 'comment';

function entityCA(f: ConsolidatedFacts, k: BuildEntityKey): number {
  switch (k) {
    case 'agency': return f.agencyCA;
    case 'structuring': return f.structuringCA;
    case 'digit': return f.digitCA;
    case 'spy': return f.spyCA;
    case 'comment': return f.commentCA;
  }
}
function entityMarge(f: ConsolidatedFacts, k: BuildEntityKey): number {
  switch (k) {
    case 'agency': return f.agencyPartPCA;
    case 'structuring': return f.structuringMargeNette;
    case 'digit': return f.digitMargeNette;
    case 'spy': return f.spyMargeNette;
    case 'comment': return f.commentMargeNette;
  }
}

// "Digit Solution" entité totale = valeur déjà consolidée par digitFacts
// (qui inclut nativement SPY + Comment/Trustpilot, ce sont des produits Digit).
// On expose SPY et Comment uniquement en "↳ dont" pour la transparence,
// SANS les ajouter aux totaux pour éviter le double comptage.
function digitConsolidatedCA(f: ConsolidatedFacts): number {
  return f.digitCA;
}
function digitConsolidatedMarge(f: ConsolidatedFacts): number {
  return f.digitMargeNette;
}
// Digit "Core" hors SPY/Comment, pour l'affichage de la décomposition.
function digitCoreMarge(f: ConsolidatedFacts): number {
  return f.digitMargeNette - f.spyMargeNette - f.commentMargeNette;
}

// Pour la Vue Groupe : 3 entités consolidées (SPY + Comment fusionnés dans Digit).
const OVERVIEW_ENTITY_META = BUILD_ENTITY_META.filter(
  (e) => e.id === 'agency' || e.id === 'structuring' || e.id === 'digit',
);

const usdR = (n: number) => fmtUSD(Math.round(n));
const marginLevel = (m: number): 'high' | 'medium' | 'low' =>
  m >= 50 ? 'high' : m >= 25 ? 'medium' : 'low';

export function buildPCGroupMonthData(
  month: MonthId,
  base: PCGroupMonthData,
  monthLabel: string,
): PCGroupMonthData {
  const facts = computeConsolidatedFacts(month);
  if (!facts) return base;
  const ytd = computeYTD(month);
  const idx = BUILD_MONTH_KEYS.indexOf(month);
  const prevId = idx > 0 ? BUILD_MONTH_KEYS[idx - 1] : null;
  const prevFacts = prevId ? computeConsolidatedFacts(prevId) : null;
  const prevLabel = prevId ? BUILD_MONTH_SHORT[prevId] : '';
  const monthsForCols = ytd.months;

  const entityCards = OVERVIEW_ENTITY_META.map((meta) => {
    const k = meta.id as BuildEntityKey;
    const isDigit = k === 'digit';
    const ca = isDigit ? digitConsolidatedCA(facts) : entityCA(facts, k);
    const marge = isDigit ? digitConsolidatedMarge(facts) : entityMarge(facts, k);
    const margin = ca > 0 ? (marge / ca) * 100 : 0;
    const baseMetrics = [
      { label: k === 'agency' ? 'CA Brut' : 'CA', value: usdR(ca) },
      { label: k === 'agency' ? 'Part PCA' : 'Marge Nette', value: usdR(marge), colorClass: 'success' },
    ];
    const digitSub = isDigit
      ? [
          { label: '↳ dont Digit Core', value: usdR(digitCoreMarge(facts)), colorClass: 'muted' },
          { label: '↳ dont SPY', value: usdR(facts.spyMargeNette), colorClass: 'muted' },
          { label: '↳ dont Comment/Trust', value: usdR(facts.commentMargeNette), colorClass: 'muted' },
        ]
      : [];
    return {
      id: meta.id,
      name: meta.name,
      badge: meta.badge,
      gradient: meta.gradient,
      cssClass: meta.cssClass,
      metrics: [...baseMetrics, ...digitSub],
      margin: Math.round(margin * 10) / 10,
      marginLevel: marginLevel(margin),
    };
  });

  const pieData = OVERVIEW_ENTITY_META.map((meta) => {
    const k = meta.id as BuildEntityKey;
    const m = k === 'digit' ? digitConsolidatedMarge(facts) : entityMarge(facts, k);
    return { name: `${meta.name} (${fmtUSDk(m)})`, value: Math.round(m), color: meta.pieColor };
  });

  const holdingPieData = [
    { name: `Maxence (${fmtUSDk(facts.maxenceAmount)})`, value: Math.round(facts.maxenceAmount), color: '#1E3A5F' },
    { name: `Thibault (${fmtUSDk(facts.thibaultAmount)})`, value: Math.round(facts.thibaultAmount), color: '#2D4A6F' },
    { name: `Florian (${fmtUSDk(facts.florianAmount)})`, value: Math.round(facts.florianAmount), color: '#4F5BD5' },
    { name: `Réserves Fil. (${fmtUSDk(facts.reservesFiliales)})`, value: Math.round(facts.reservesFiliales), color: '#C9A227' },
  ];

  const manual = MANUAL_ENTITIES[month]!;
  const dist = manual.holding.distribution;
  const prevPart = (sel: (f: ConsolidatedFacts) => number, cur: number) =>
    prevFacts ? `${fmtPctSigned(pctChange(cur, sel(prevFacts)))} vs ${prevLabel}` : '';
  const directors = [
    { name: 'Maxence', pct: `${dist.maxencePct}%`, amount: usdR(facts.maxenceAmount),
      gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)',
      subtitle: prevPart((f) => f.maxenceAmount, facts.maxenceAmount) },
    { name: 'Thibault', pct: `${dist.thibaultPct}%`, amount: usdR(facts.thibaultAmount),
      gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)',
      subtitle: dist.willInThibault ? `dont $${dist.willInThibault.toLocaleString('en-US')} Will` : '' },
    { name: 'Florian', pct: `${dist.florianPct}%`, amount: usdR(facts.florianAmount),
      gradient: 'linear-gradient(135deg, #4F5BD5 0%, #6366F1 100%)',
      subtitle: prevPart((f) => f.florianAmount, facts.florianAmount) },
  ];

  const fraisDelta = prevFacts ? pctChange(facts.fraisHolding, prevFacts.fraisHolding) : null;
  const holdingKPIs = [
    { label: 'Remontée Holding (90%)', value: usdR(facts.remonteeHolding), detail: 'Bénéfices filiales', color: 'navy' },
    { label: 'Résultat Net Holding', value: usdR(facts.resultatNetHolding),
      detail: prevFacts ? `${fmtPctSigned(pctChange(facts.resultatNetHolding, prevFacts.resultatNetHolding))} vs ${prevLabel}` : '100% distribué',
      color: 'gold' },
    { label: 'Réserves Filiales (10%)', value: usdR(facts.reservesFiliales), detail: 'Trésorerie entités', color: 'green' },
    { label: 'Frais Holding', value: usdR(facts.fraisHolding),
      detail: fraisDelta != null ? `${fmtPctSigned(fraisDelta)} vs ${prevLabel}` : 'Frais récurrents',
      color: 'pink' },
  ];

  const buildComparisonRow = (
    indicator: string,
    sel: (f: ConsolidatedFacts) => number,
    inverse = false,
  ): PCGComparisonRow => {
    const row: PCGComparisonRow = { indicator };
    monthsForCols.forEach((m) => { row[BUILD_MONTH_KEY[m.id as MonthId]] = usdR(sel(m.facts)); });
    const ytdSum = monthsForCols.reduce((acc, m) => acc + sel(m.facts), 0);
    row.ytd = usdR(ytdSum);
    if (prevFacts) {
      const variation = pctChange(sel(facts), sel(prevFacts));
      row.variation = fmtPctSigned(variation);
      row.varType = variation === 0 ? 'neutral' : (inverse ? variation < 0 : variation > 0) ? 'positive' : 'negative';
    }
    return row;
  };
  const holdingComparison: PCGComparisonRow[] = [
    buildComparisonRow('Marge Brute Groupe', (f) => f.margeBruteGroupe),
    buildComparisonRow('Réserves Filiales (10%)', (f) => f.reservesFiliales),
    buildComparisonRow('Remontée Holding (90%)', (f) => f.remonteeHolding),
    buildComparisonRow('Frais Holding', (f) => f.fraisHolding, true),
    buildComparisonRow('Résultat Net Holding', (f) => f.resultatNetHolding),
  ];

  const buildEntityRow = (
    entity: string,
    selector: (f: ConsolidatedFacts) => number,
  ): PCGOverviewComparisonRow => {
    const row: PCGOverviewComparisonRow = { entity };
    monthsForCols.forEach((m) => { row[BUILD_MONTH_KEY[m.id as MonthId]] = usdR(selector(m.facts)); });
    const ytdSum = monthsForCols.reduce((acc, m) => acc + selector(m.facts), 0);
    row.ytd = usdR(ytdSum);
    if (prevFacts) {
      const variation = pctChange(selector(facts), selector(prevFacts));
      row.variation = fmtPctSigned(variation);
      row.varType = variation === 0 ? 'neutral' : variation > 0 ? 'positive' : 'negative';
    }
    return row;
  };
  const overviewComparison: PCGOverviewComparisonRow[] = [
    buildEntityRow('Agency (Part PCA 50%)', (f) => f.agencyPartPCA),
    buildEntityRow('Structuring', (f) => f.structuringMargeNette),
    buildEntityRow('Digit Solution (total)', digitConsolidatedMarge),
    buildEntityRow('   ↳ dont Digit Core', digitCoreMarge),
    buildEntityRow('   ↳ dont SPY', (f) => f.spyMargeNette),
    buildEntityRow('   ↳ dont Comment/Trustpilot', (f) => f.commentMargeNette),
  ];
  const overviewComparisonTotal: PCGOverviewComparisonRow = (() => {
    const row: PCGOverviewComparisonRow = { entity: 'MARGE BRUTE GROUPE' };
    monthsForCols.forEach((m) => { row[BUILD_MONTH_KEY[m.id as MonthId]] = usdR(m.facts.margeBruteGroupe); });
    row.ytd = usdR(ytd.margeBruteYTD);
    if (prevFacts) {
      const variation = pctChange(facts.margeBruteGroupe, prevFacts.margeBruteGroupe);
      row.variation = fmtPctSigned(variation);
      row.varType = variation === 0 ? 'neutral' : variation > 0 ? 'positive' : 'negative';
    }
    return row;
  })();

  const ytdMonthlyTable = monthsForCols.map((m) => {
    const taux = m.facts.caGroupe > 0 ? (m.facts.margeBruteGroupe / m.facts.caGroupe) * 100 : 0;
    return {
      month: m.label,
      ca: usdR(m.facts.caGroupe),
      margin: usdR(m.facts.margeBruteGroupe),
      taux: fmtPct(taux),
      reserves: usdR(m.facts.reservesFiliales),
      remontee: usdR(m.facts.remonteeHolding),
      frais: usdR(m.facts.fraisHolding),
      net: usdR(m.facts.resultatNetHolding),
    };
  });
  const ytdTaux = ytd.caYTD > 0 ? (ytd.margeBruteYTD / ytd.caYTD) * 100 : 0;
  const ytdReservesSum = monthsForCols.reduce((a, m) => a + m.facts.reservesFiliales, 0);
  const ytdRemonteeSum = monthsForCols.reduce((a, m) => a + m.facts.remonteeHolding, 0);
  const ytdFraisSum = monthsForCols.reduce((a, m) => a + m.facts.fraisHolding, 0);
  const ytdMonthlyTotal = {
    month: monthsForCols.length === 4 ? 'YTD TOTAL' : `YTD TOTAL ${monthsForCols.length === 3 ? 'Q1' : ''}`.trim(),
    ca: usdR(ytd.caYTD),
    margin: usdR(ytd.margeBruteYTD),
    taux: fmtPct(ytdTaux),
    reserves: usdR(ytdReservesSum),
    remontee: usdR(ytdRemonteeSum),
    frais: usdR(ytdFraisSum),
    net: usdR(ytd.resultatNetYTD),
  };

  const buildYtdEntity = (entity: string, sel: (f: ConsolidatedFacts) => number) => {
    const row: any = { entity };
    monthsForCols.forEach((m) => { row[BUILD_MONTH_KEY[m.id as MonthId]] = usdR(sel(m.facts)); });
    const total = monthsForCols.reduce((a, m) => a + sel(m.facts), 0);
    row.ytd = usdR(total);
    row.pct = ytd.margeBruteYTD > 0 ? fmtPct((total / ytd.margeBruteYTD) * 100) : '0.0%';
    return row;
  };
  const ytdEntityTable = [
    buildYtdEntity('Agency (Part PCA)', (f) => f.agencyPartPCA),
    buildYtdEntity('Structuring', (f) => f.structuringMargeNette),
    buildYtdEntity('Digit Solution (total)', digitConsolidatedMarge),
    buildYtdEntity('   ↳ dont Digit Core', digitCoreMarge),
    buildYtdEntity('   ↳ dont SPY', (f) => f.spyMargeNette),
    buildYtdEntity('   ↳ dont Comment/Trustpilot', (f) => f.commentMargeNette),
  ];
  const ytdEntityTotal: any = { entity: 'TOTAL GROUPE' };
  monthsForCols.forEach((m) => { ytdEntityTotal[BUILD_MONTH_KEY[m.id as MonthId]] = usdR(m.facts.margeBruteGroupe); });
  ytdEntityTotal.ytd = usdR(ytd.margeBruteYTD);
  ytdEntityTotal.pct = '100%';

  const ytdTrendData = monthsForCols.map((m) => ({
    month: BUILD_MONTH_SHORT[m.id as MonthId],
    ca: Math.round(m.facts.caGroupe),
    margin: Math.round(m.facts.margeBruteGroupe),
    net: Math.round(m.facts.resultatNetHolding),
  }));

  const buildReservesRow = (entity: string, sel: (f: ConsolidatedFacts) => number) => {
    const row: any = { entity };
    monthsForCols.forEach((m) => { row[BUILD_MONTH_KEY[m.id as MonthId]] = usdR(sel(m.facts) * 0.10); });
    const total = monthsForCols.reduce((a, m) => a + sel(m.facts) * 0.10, 0);
    row.ytd = usdR(total);
    return row;
  };
  const reservesEntityTable = [
    buildReservesRow('Agency (Part PCA)', (f) => f.agencyPartPCA),
    buildReservesRow('Structuring', (f) => f.structuringMargeNette),
    buildReservesRow('Digit Solution (total)', digitConsolidatedMarge),
    buildReservesRow('   ↳ dont Digit Core', digitCoreMarge),
    buildReservesRow('   ↳ dont SPY', (f) => f.spyMargeNette),
    buildReservesRow('   ↳ dont Comment/Trustpilot', (f) => f.commentMargeNette),
  ];
  const reservesEntityTotal: any = { entity: 'TOTAL RÉSERVES' };
  monthsForCols.forEach((m) => { reservesEntityTotal[BUILD_MONTH_KEY[m.id as MonthId]] = usdR(m.facts.reservesFiliales); });
  reservesEntityTotal.ytd = usdR(ytd.reservesYTD);

  // Digit YTD est déjà consolidé (perEntityYTD.digit inclut SPY + Comment)
  const digitConsolidatedYTD = ytd.perEntityYTD.digit;
  const reservesEntries: { name: string; total: number }[] = [
    { name: 'Agency (Part PCA)', total: ytd.perEntityYTD.agency * 0.10 },
    { name: 'Structuring', total: ytd.perEntityYTD.structuring * 0.10 },
    { name: 'Digit Solution', total: digitConsolidatedYTD * 0.10 },
  ].sort((a, b) => b.total - a.total);
  const top3 = reservesEntries.slice(0, 3);
  const tail = reservesEntries.slice(3);
  const reservesCards = [
    ...top3.map((e) => ({
      name: e.name,
      amount: usdR(e.total),
      pct: ytd.reservesYTD > 0 ? fmtPct((e.total / ytd.reservesYTD) * 100) : '0.0%',
    })),
    ...(tail.length > 0
      ? [{
          name: tail.map((t) => t.name.split(' ')[0]).join(' + '),
          amount: usdR(tail.reduce((a, t) => a + t.total, 0)),
          pct: ytd.reservesYTD > 0 ? fmtPct((tail.reduce((a, t) => a + t.total, 0) / ytd.reservesYTD) * 100) : '0.0%',
        }]
      : []),
  ];

  const reservesHero = [
    ...monthsForCols.map((m, i) => ({
      label: `Réserves ${BUILD_MONTH_SHORT[m.id as MonthId]}`,
      value: usdR(m.facts.reservesFiliales),
      detail: `10% marge brute ${BUILD_MONTH_SHORT[m.id as MonthId]}`,
      color: (['navy', 'success', 'primary', 'gold'] as const)[i % 4],
    })),
    {
      label: `Réserves YTD${monthsForCols.length === 3 ? ' Q1' : ''}`,
      value: usdR(ytd.reservesYTD),
      detail: 'Cumul 2026',
      color: 'gold' as const,
    },
  ].slice(0, 4);

  const entitiesCount = OVERVIEW_ENTITY_META.length;
  const entitiesDetail = `${entitiesCount} entités consolidées`;
  const overviewHero = [
    { label: 'CA Groupe', value: usdR(facts.caGroupe), detail: entitiesDetail, color: 'navy',
      variance: prevFacts ? `${fmtPctSigned(pctChange(facts.caGroupe, prevFacts.caGroupe))} vs ${prevLabel}` : null,
      varType: prevFacts ? (facts.caGroupe >= prevFacts.caGroupe ? 'positive' : 'negative') : null },
    { label: 'Marge Brute Groupe', value: usdR(facts.margeBruteGroupe),
      detail: `${fmtPct(facts.caGroupe > 0 ? (facts.margeBruteGroupe / facts.caGroupe) * 100 : 0)} du CA`,
      color: 'success',
      variance: prevFacts ? `${fmtPctSigned(pctChange(facts.margeBruteGroupe, prevFacts.margeBruteGroupe))} vs ${prevLabel}` : null,
      varType: prevFacts ? (facts.margeBruteGroupe >= prevFacts.margeBruteGroupe ? 'positive' : 'negative') : null },
    { label: 'Résultat Net Holding', value: usdR(facts.resultatNetHolding), detail: 'Après frais holding', color: 'gold',
      variance: prevFacts ? `${fmtPctSigned(pctChange(facts.resultatNetHolding, prevFacts.resultatNetHolding))} vs ${prevLabel}` : null,
      varType: prevFacts ? (facts.resultatNetHolding >= prevFacts.resultatNetHolding ? 'positive' : 'negative') : null },
    { label: 'Réserves Filiales', value: usdR(facts.reservesFiliales), detail: '10% marge brute', color: 'primary',
      variance: prevFacts ? `${fmtPctSigned(pctChange(facts.reservesFiliales, prevFacts.reservesFiliales))} vs ${prevLabel}` : null,
      varType: prevFacts ? (facts.reservesFiliales >= prevFacts.reservesFiliales ? 'positive' : 'negative') : null },
  ];

  const ytdHero = [
    { label: 'CA YTD', value: usdR(ytd.caYTD), detail: monthsForCols.map((m) => BUILD_MONTH_SHORT[m.id as MonthId]).join(' + '), color: 'navy' },
    { label: 'Marge Brute YTD', value: usdR(ytd.margeBruteYTD), detail: `${fmtPct(ytdTaux)} du CA`, color: 'success' },
    { label: 'Résultat Net YTD', value: usdR(ytd.resultatNetYTD), detail: 'Holding cumulé', color: 'gold' },
    { label: 'Réserves Cumulées', value: usdR(ytd.reservesYTD), detail: 'Toutes filiales', color: 'primary' },
  ];

  // ----- P&L Consolidé (Waterfall) — auto-généré pour rester aligné avec
  // les facts (évite tout double comptage SPY/Comment déjà inclus dans Digit).
  const neg = (n: number) => `-${usdR(Math.abs(n))}`;
  const consolidatedPL: { label: string; value: string; type: string }[] = [
    { label: 'Marge Nette Agency (après 50% Blink)', value: usdR(facts.agencyPartPCA), type: 'positive' },
    { label: 'Marge Nette Structuring', value: usdR(facts.structuringMargeNette), type: 'positive' },
    { label: 'Marge Nette Digit Solution (total)', value: usdR(facts.digitMargeNette), type: 'positive' },
    { label: '   ↳ dont Digit Core', value: usdR(digitCoreMarge(facts)), type: 'indent-muted' },
    { label: '   ↳ dont SPY', value: usdR(facts.spyMargeNette), type: 'indent-muted' },
    { label: '   ↳ dont Comment/Trustpilot', value: usdR(facts.commentMargeNette), type: 'indent-muted' },
    { label: 'MARGE BRUTE GROUPE', value: usdR(facts.margeBruteGroupe), type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Réserves Filiales (10%)', value: neg(facts.reservesFiliales), type: 'negative' },
    { label: 'REMONTÉE HOLDING (90%)', value: usdR(facts.remonteeHolding), type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    ...(manual.holding.fraisDetail.length > 0
      ? manual.holding.fraisDetail.map((f) => ({ label: f.label, value: neg(f.amount), type: 'negative' }))
      : [{ label: 'Frais Holding', value: neg(facts.fraisHolding), type: 'negative' }]),
    { label: 'RÉSULTAT NET HOLDING', value: usdR(facts.resultatNetHolding), type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: `Maxence (${dist.maxencePct}%)`, value: neg(facts.maxenceAmount), type: 'negative' },
    { label: `Thibault (${dist.thibaultPct}%)`, value: neg(facts.thibaultAmount), type: 'negative' },
    ...(dist.willInThibault
      ? [{ label: '   ↳ dont Will', value: usdR(dist.willInThibault), type: 'indent-muted' }]
      : []),
    { label: `Florian (${dist.florianPct}%)`, value: neg(facts.florianAmount), type: 'negative' },
    { label: 'SALAIRES MANAGEMENT (100%)', value: neg(facts.resultatNetHolding), type: 'total-negative' },
    { label: '', value: '', type: 'spacer' },
    { label: 'SOLDE HOLDING', value: usdR(0), type: 'highlight' },
  ];

  // ----- Synthèse Flux Holding (waterfall) — version condensée du P&L
  // côté holding uniquement, dérivée des mêmes facts pour rester cohérente.
  const holdingSynthese: { label: string; value: string; type: string; indent?: boolean }[] = [
    { label: 'MARGE BRUTE GROUPE', value: usdR(facts.margeBruteGroupe), type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Réserves Filiales (10%)', value: neg(facts.reservesFiliales), type: 'negative', indent: true },
    { label: 'REMONTÉE HOLDING (90%)', value: usdR(facts.remonteeHolding), type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    ...(manual.holding.fraisDetail.length > 0
      ? manual.holding.fraisDetail.map((f) => ({ label: f.label, value: neg(f.amount), type: 'negative', indent: true }))
      : [{ label: 'Frais Holding', value: neg(facts.fraisHolding), type: 'negative', indent: true }]),
    { label: 'RÉSULTAT NET HOLDING', value: usdR(facts.resultatNetHolding), type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Salaires management (100%)', value: neg(facts.resultatNetHolding), type: 'negative', indent: true },
    ...(dist.willInThibault
      ? [{ label: '↳ dont Will (via Thibault)', value: usdR(dist.willInThibault), type: 'indent-muted', indent: true }]
      : []),
    { label: '', value: '', type: 'spacer' },
    { label: 'SOLDE HOLDING', value: usdR(0), type: 'highlight' },
  ];
  // the source dashboard so the consolidated tab stays in sync. =====
  const agencyByMonth = monthsForCols.map((m) => {
    try {
      return { id: m.id, data: getPCAMonthData(m.id as PCAMonthId), label: BUILD_MONTH_SHORT[m.id as MonthId] };
    } catch {
      return null;
    }
  }).filter((x): x is { id: PCGSourceMonthId; data: ReturnType<typeof getPCAMonthData>; label: string } => x !== null && Boolean(x.data));
  const agencyCurrent = agencyByMonth.find((x) => x.id === month) ?? null;
  const agencyPrev = prevId ? agencyByMonth.find((x) => x.id === prevId) ?? null : null;

  let agencyKPIsOverlay: any = base.agencyKPIs;
  let agencyComparisonOverlay: any = base.agencyComparison;
  let agencyWaterfallOverlay: any = base.agencyWaterfall;

  if (agencyCurrent) {
    const a = agencyCurrent.data;
    const caPct = a.gross > 0 ? (a.net / a.gross) * 100 : 0;
    const chargesPct = a.gross > 0 ? (a.expenses / a.gross) * 100 : 0;
    const caDelta = agencyPrev ? pctChange(a.gross, agencyPrev.data.gross) : null;
    const chargesDelta = agencyPrev ? pctChange(a.expenses, agencyPrev.data.expenses) : null;
    agencyKPIsOverlay = [
      { label: 'CA Brut', value: usdR(a.gross),
        detail: caDelta != null ? `${fmtPctSigned(caDelta)} vs ${agencyPrev!.label} (${usdR(agencyPrev!.data.gross)})` : 'Premier mois',
        color: 'navy' },
      { label: 'Marge Nette', value: usdR(a.net), detail: `${fmtPct(caPct)} du CA`, color: 'green' },
      { label: 'Part PCA (50%)', value: usdR(a.pcaShare), detail: 'Après split Blink', color: 'gold' },
      { label: 'Total Charges', value: usdR(a.expenses),
        detail: chargesDelta != null ? `${fmtPctSigned(chargesDelta)} vs ${agencyPrev!.label}` : `${fmtPct(chargesPct)} du CA`,
        color: 'pink' },
    ];

    const buildAgencyRow = (
      indicator: string,
      sel: (d: ReturnType<typeof getPCAMonthData>) => number,
      inverse = false,
    ) => {
      const row: any = { indicator };
      agencyByMonth.forEach((x) => { row[BUILD_MONTH_KEY[x.id as MonthId]] = usdR(sel(x.data)); });
      const ytdSum = agencyByMonth.reduce((acc, x) => acc + sel(x.data), 0);
      row.ytd = usdR(ytdSum);
      if (agencyPrev) {
        const variation = pctChange(sel(a), sel(agencyPrev.data));
        row.variation = fmtPctSigned(variation);
        row.varType = variation === 0 ? 'neutral' : (inverse ? variation < 0 : variation > 0) ? 'positive' : 'negative';
      }
      return row;
    };
    agencyComparisonOverlay = [
      buildAgencyRow('CA Brut', (d) => d.gross),
      buildAgencyRow('Charges', (d) => d.expenses, true),
      buildAgencyRow('Marge Nette', (d) => d.net),
      buildAgencyRow('Part PCA (50%)', (d) => d.pcaShare),
    ];

    // Waterfall depuis waterfallRows source
    const fmtSigned = (n: number) => (n < 0 ? `-$${Math.abs(Math.round(n)).toLocaleString('en-US')}` : `$${Math.round(n).toLocaleString('en-US')}`);
    const mapWaterfallType = (l: string, v: number, isBold: boolean): string => {
      const up = l.toUpperCase();
      if (up.includes('NET REVENUE')) return 'highlight';
      if (up.includes('PCA SHARE')) return 'total-positive';
      if (up.includes('PC RETAINED')) return 'indent-muted';
      if (up.includes('TOTAL EXPENSES')) return 'total-negative';
      if (up.includes('GROSS')) return 'positive';
      if (isBold) return v >= 0 ? 'total-positive' : 'total-negative';
      return v >= 0 ? 'positive' : 'negative';
    };
    const wf: { label: string; value: string; type: string }[] = [];
    a.waterfallRows.forEach((r, i) => {
      // Insert visual spacers around totals to mimic the legacy layout.
      const prev = a.waterfallRows[i - 1];
      if (r.b && prev && !prev.b) wf.push({ label: '', value: '', type: 'spacer' });
      wf.push({ label: r.l, value: fmtSigned(r.v), type: mapWaterfallType(r.l, r.v, r.b) });
      if (r.b && i < a.waterfallRows.length - 1 && a.waterfallRows[i + 1].b === false) {
        wf.push({ label: '', value: '', type: 'spacer' });
      }
    });
    agencyWaterfallOverlay = wf;
  }

  // ===== STRUCTURING / DIGIT / SPY / COMMENT overlays =====
  // Auto-derived from the same normalized adapters that feed the group view,
  // so per-entity tabs stay coherent with the consolidated KPIs / pies / YTD.
  const parseUSD = (s: string): number => {
    const n = Number(String(s).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };
  const negStr = (n: number) => `-${usdR(Math.abs(n))}`;

  const buildEntityKPIs = (key: EntityKey) => {
    const cur = getEntityMonth(key, month);
    if (!cur) return null;
    const prev = prevId ? getEntityMonth(key, prevId) : null;
    const caDelta = prev ? pctChange(cur.ca, prev.ca) : null;
    const margeDelta = prev ? pctChange(cur.contribution, prev.contribution) : null;
    const chargesDelta = prev ? pctChange(cur.charges, prev.charges) : null;
    const dealsLabel = (() => {
      if (key === 'structuring' && cur.meta?.clients != null) {
        const ticket = cur.meta.ticketMoyen ? ` · Moy. ${usdR(cur.meta.ticketMoyen)}/client` : '';
        return { label: 'Clients', value: String(cur.meta.clients), detail: `Handled by Nathan${ticket}`, color: 'gold' };
      }
      if (cur.meta?.deals != null) {
        return { label: 'Deals', value: String(cur.meta.deals), detail: 'Transactions du mois', color: 'gold' };
      }
      return null;
    })();
    const margeLabel = key === 'agency' ? 'Part PCA' : 'Marge Nette';
    return [
      { label: 'CA', value: usdR(cur.ca),
        detail: caDelta != null ? `${fmtPctSigned(caDelta)} vs ${prevLabel}` : 'Premier mois',
        color: 'navy' },
      { label: margeLabel, value: usdR(cur.contribution),
        detail: margeDelta != null ? `${fmtPctSigned(margeDelta)} vs ${prevLabel} (${fmtPct(cur.marginPct)})` : `${fmtPct(cur.marginPct)} du CA`,
        color: 'green' },
      ...(dealsLabel ? [dealsLabel] : []),
      { label: 'Total Charges', value: usdR(cur.charges),
        detail: chargesDelta != null ? `${fmtPctSigned(chargesDelta)} vs ${prevLabel}` : `${fmtPct(cur.ca > 0 ? (cur.charges / cur.ca) * 100 : 0)} du CA`,
        color: 'pink' },
    ];
  };

  const buildEntityComparison = (key: EntityKey): PCGComparisonRow[] | null => {
    const cur = getEntityMonth(key, month);
    if (!cur) return null;
    const prev = prevId ? getEntityMonth(key, prevId) : null;
    const margeLabel = key === 'agency' ? 'Part PCA (50%)' : 'Marge Nette';
    const mkRow = (
      indicator: string,
      sel: (b: ReturnType<typeof getEntityMonth>) => number,
      inverse = false,
    ): PCGComparisonRow => {
      const row: PCGComparisonRow = { indicator };
      monthsForCols.forEach((m) => {
        const b = getEntityMonth(key, m.id);
        row[BUILD_MONTH_KEY[m.id as MonthId]] = b ? usdR(sel(b)) : '—';
      });
      const ytdSum = monthsForCols.reduce((acc, m) => {
        const b = getEntityMonth(key, m.id);
        return acc + (b ? sel(b) : 0);
      }, 0);
      row.ytd = usdR(ytdSum);
      if (prev) {
        const variation = pctChange(sel(cur), sel(prev));
        row.variation = fmtPctSigned(variation);
        row.varType = variation === 0 ? 'neutral' : (inverse ? variation < 0 : variation > 0) ? 'positive' : 'negative';
      }
      return row;
    };
    return [
      mkRow('CA', (b) => b!.ca),
      mkRow('Charges', (b) => b!.charges, true),
      mkRow(margeLabel, (b) => b!.contribution),
    ];
  };

  // ----- Structuring overlay
  let structuringKPIsOverlay: any = base.structuringKPIs;
  let structuringComparisonOverlay: any = base.structuringComparison;
  let structuringWaterfallOverlay: any = base.structuringWaterfall;
  try {
    const sData = getPCMonthData(month as PCMonthId);
    const sFacts = getEntityMonth('structuring', month);
    if (sData && sFacts) {
      structuringKPIsOverlay = buildEntityKPIs('structuring') ?? structuringKPIsOverlay;
      structuringComparisonOverlay = buildEntityComparison('structuring') ?? structuringComparisonOverlay;
      const c = sData.costs;
      const wfRows: { label: string; value: string; type: string }[] = [
        { label: 'CA', value: usdR(sFacts.ca), type: 'positive' },
        { label: '', value: '', type: 'spacer' },
      ];
      const pushCost = (label: string, v?: number) => {
        if (v && v > 0) wfRows.push({ label, value: negStr(v), type: 'negative' });
      };
      pushCost('AWD Event', c.awdEvent);
      pushCost('Coûts Fournisseurs', c.productProviderCosts ?? c.serviceCosts);
      pushCost('Publicité (ADS)', c.advertising);
      pushCost('Marketing', c.marketing);
      pushCost('Achats Alibaba', c.alibabaPurchases);
      pushCost('Com. Sales', c.salesCommission);
      pushCost('Com. Referral', c.referralCommission);
      pushCost('Events', c.events);
      pushCost('Frais bancaires', c.bankFees);
      wfRows.push({ label: 'TOTAL CHARGES', value: negStr(sFacts.charges), type: 'total-negative' });
      wfRows.push({ label: '', value: '', type: 'spacer' });
      wfRows.push({ label: 'MARGE NETTE', value: usdR(sFacts.contribution), type: 'highlight' });
      structuringWaterfallOverlay = wfRows;
    }
  } catch { /* keep base */ }

  // ----- Digit overlay
  let digitKPIsOverlay: any = base.digitKPIs;
  let digitComparisonOverlay: any = base.digitComparison;
  let digitWaterfallOverlay: any = base.digitWaterfall;
  try {
    const dData = getDigitMonthData(month as DigitMonthId);
    const dFacts = getEntityMonth('digit', month);
    if (dData && dFacts) {
      digitKPIsOverlay = buildEntityKPIs('digit') ?? digitKPIsOverlay;
      digitComparisonOverlay = buildEntityComparison('digit') ?? digitComparisonOverlay;
      const wfRows: { label: string; value: string; type: string }[] = [
        { label: 'CA', value: usdR(dFacts.ca), type: 'positive' },
        { label: '', value: '', type: 'spacer' },
      ];
      (dData.costsDetail ?? []).forEach((row: { label: string; value: string }) => {
        const n = parseUSD(row.value);
        if (n > 0) wfRows.push({ label: row.label, value: negStr(n), type: 'negative' });
      });
      wfRows.push({ label: 'TOTAL CHARGES', value: negStr(dFacts.charges), type: 'total-negative' });
      wfRows.push({ label: '', value: '', type: 'spacer' });
      wfRows.push({ label: 'MARGE NETTE', value: usdR(dFacts.contribution), type: 'highlight' });
      digitWaterfallOverlay = wfRows;
    }
  } catch { /* keep base */ }

  // ----- SPY / Comment overlays (KPIs + comparison + waterfall)
  // Manual blocks ne fournissent pas de détail des charges, mais on garantit
  // au minimum CA / Total Charges / Marge Nette cohérents avec le mois courant
  // (sinon le waterfall reste figé sur les données hardcodées de Mars).
  const spyKPIsOverlay = buildEntityKPIs('spy') ?? base.spyKPIs;
  const commentKPIsOverlay = buildEntityKPIs('comment') ?? (base as any).commentKPIs;
  const spyComparisonOverlay = buildEntityComparison('spy') ?? (base as any).spyComparison;
  const commentComparisonOverlay = buildEntityComparison('comment') ?? (base as any).commentComparison;

  const buildManualWaterfall = (key: 'spy' | 'comment', fallback: any) => {
    const cur = getEntityMonth(key, month);
    if (!cur) return fallback;
    return [
      { label: 'CA', value: usdR(cur.ca), type: 'positive' },
      { label: '', value: '', type: 'spacer' },
      { label: 'TOTAL CHARGES', value: negStr(cur.charges), type: 'total-negative' },
      { label: '', value: '', type: 'spacer' },
      { label: 'MARGE NETTE', value: usdR(cur.contribution), type: 'highlight' },
    ];
  };
  const spyWaterfallOverlay = buildManualWaterfall('spy', base.spyWaterfall);
  const commentWaterfallOverlay = buildManualWaterfall('comment', (base as any).commentWaterfall);

  const out: any = {
    ...base,
    monthLabel,
    footerLabel: monthLabel,
    entitiesCount,
    overviewHero: overviewHero as any,
    overviewComparison: overviewComparison as any,
    overviewComparisonTotal: overviewComparisonTotal as any,
    entityCards: entityCards as any,
    pieData: pieData as any,
    consolidatedPL: consolidatedPL as any,
    holdingKPIs: holdingKPIs as any,
    holdingComparison: holdingComparison as any,
    holdingSynthese: holdingSynthese as any,
    holdingPieData: holdingPieData as any,
    holdingNetResult: usdR(facts.resultatNetHolding),
    directors: directors as any,
    ytdHero: ytdHero as any,
    ytdMonthlyTable: ytdMonthlyTable as any,
    ytdMonthlyTotal: ytdMonthlyTotal as any,
    ytdEntityTable: ytdEntityTable as any,
    ytdEntityTotal: ytdEntityTotal as any,
    ytdTrendData: ytdTrendData as any,
    reservesHero: reservesHero as any,
    reservesEntityTable: reservesEntityTable as any,
    reservesEntityTotal: reservesEntityTotal as any,
    reservesCards: reservesCards as any,
    intercos: computeIntercos(month) as any,
    agencyKPIs: agencyKPIsOverlay as any,
    agencyComparison: agencyComparisonOverlay as any,
    agencyWaterfall: agencyWaterfallOverlay as any,
    structuringKPIs: structuringKPIsOverlay as any,
    structuringComparison: structuringComparisonOverlay as any,
    structuringWaterfall: structuringWaterfallOverlay as any,
    digitKPIs: digitKPIsOverlay as any,
    digitComparison: digitComparisonOverlay as any,
    digitWaterfall: digitWaterfallOverlay as any,
    spyKPIs: spyKPIsOverlay as any,
    spyComparison: spyComparisonOverlay as any,
    spyWaterfall: spyWaterfallOverlay as any,
    commentKPIs: commentKPIsOverlay as any,
    commentComparison: commentComparisonOverlay as any,
    commentWaterfall: commentWaterfallOverlay as any,
  };
  return out as PCGroupMonthData;
}
