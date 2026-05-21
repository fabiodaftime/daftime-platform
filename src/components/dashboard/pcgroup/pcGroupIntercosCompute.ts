// Computes the Intercos tab data structure from the source dashboards
// + INTERCO_RULES + INTERCOS_CASH actuals. Replaces the static
// INTERCOS_DATA block in PCGroupData.ts via applyComputedOverlay.

import type { PCGSourceMonthId } from './sources/entityAdapters';
import { digitFacts } from './sources/entityAdapters';
import { INTERCO_RULES, computeExpectedTransfer } from './intercosRules';
import { INTERCOS_CASH, MANUAL_ENTITIES } from './manualEntities';
import { fmtUSD, fmtPct } from './pcGroupFormatters';

// Périodes métier : avant Mars 2026 = structure MaxScale (tout mélangé),
// à partir de Mars 2026 = DG Solutions (DG + Comment), SPY isolé.
const MAXSCALE_MONTHS: PCGSourceMonthId[] = ['jan-2026', 'feb-2026'];
const DG_PHASE_FROM = 'mar-2026' as PCGSourceMonthId;
const TRANSFER_RATE = 0.9;

const MONTH_ORDER: PCGSourceMonthId[] = ['jan-2026', 'feb-2026', 'mar-2026', 'apr-2026'];
const MONTH_SHORT: Record<PCGSourceMonthId, string> = {
  'jan-2026': 'Jan',
  'feb-2026': 'Fév',
  'mar-2026': 'Mars',
  'apr-2026': 'Avril',
};
const MONTH_LONG: Record<PCGSourceMonthId, string> = {
  'jan-2026': 'Janvier 2026',
  'feb-2026': 'Février 2026',
  'mar-2026': 'Mars 2026',
  'apr-2026': 'Avril 2026',
};

const usd = (n: number) => fmtUSD(Math.round(n));
const usdSigned = (n: number) => `${n < 0 ? '-' : ''}${fmtUSD(Math.abs(Math.round(n)))}`;

/**
 * Build a computed INTERCOS_DATA payload, valid up to (and including) `viewMonth`.
 * - Expected transfers per (sourceMonth, entity) come from INTERCO_RULES.
 * - "Exigible" = sum of expected transfers whose due-date ≤ viewMonth.
 * - "Reçu" = INTERCOS_CASH actuals over the same period.
 * - "Solde" = exigible - reçu (with apport scenario).
 */
export function computeIntercos(viewMonth: PCGSourceMonthId) {
  const viewIdx = MONTH_ORDER.indexOf(viewMonth);
  const sourceMonths = MONTH_ORDER.slice(0, viewIdx + 1);

  // For each entity, expected transfer per source month.
  const perEntity = INTERCO_RULES.map((rule) => {
    const monthly = sourceMonths.map((sm) => ({
      sourceMonth: sm,
      dueIdx: MONTH_ORDER.indexOf(sm) + rule.settlementLagMonths,
      amount: computeExpectedTransfer(rule, sm),
    }));
    const exigible = monthly
      .filter((x) => x.dueIdx <= viewIdx) // due-date already passed
      .reduce((acc, x) => acc + x.amount, 0);
    const notYetDue = monthly
      .filter((x) => x.dueIdx > viewIdx)
      .reduce((acc, x) => acc + x.amount, 0);
    const ytd = monthly.reduce((acc, x) => acc + x.amount, 0);
    return { rule, monthly, exigible, notYetDue, ytd };
  });

  // Aggregate ALL received cash across the period (matches the per-entity table
  // total "Déjà Remonté"). Previously this filtered by a default settlement lag,
  // which excluded the latest month's cash from the KPI even though it appeared
  // in the table — causing a visible mismatch (e.g. 38k vs 128k).
  const receivedTotal = sourceMonths.reduce((acc, sm) => {
    const block = INTERCOS_CASH[sm];
    if (!block) return acc;
    return (
      acc +
      Object.values(block.received).reduce<number>((s, v) => s + (v ?? 0), 0)
    );
  }, 0);

  const apportMaxence = sourceMonths.reduce(
    (acc, sm) => acc + (INTERCOS_CASH[sm]?.apportMaxence ?? 0),
    0,
  );

  const totals = {
    exigible: perEntity.reduce((a, e) => a + e.exigible, 0),
    notYetDue: perEntity.reduce((a, e) => a + e.notYetDue, 0),
    ytd: perEntity.reduce((a, e) => a + e.ytd, 0),
  };
  const solde = totals.exigible - receivedTotal;
  const soldeAvecApport = solde - apportMaxence;
  const recoveryRate = totals.exigible > 0 ? (receivedTotal / totals.exigible) * 100 : 0;
  const recoveryRateApport =
    totals.exigible > 0 ? ((receivedTotal + apportMaxence) / totals.exigible) * 100 : 0;

  // -------- KPI hero (3 cards) — vue simplifiée : à remonter / remontée / solde --------
  const soldeYtd = totals.ytd - receivedTotal;
  const periodLabel = `${MONTH_SHORT[sourceMonths[0]]} → ${MONTH_SHORT[sourceMonths[sourceMonths.length - 1]]}`;
  const kpis = [
    {
      label: 'Somme à Remonter',
      value: usd(totals.ytd),
      detail: `Marges filiales · ${periodLabel}`,
      color: 'navy' as const,
    },
    {
      label: 'Somme Remontée',
      value: usd(receivedTotal),
      detail: 'Encaissée par la Holding',
      color: receivedTotal < totals.ytd * 0.7 ? ('danger' as const) : ('success' as const),
    },
    {
      label: 'Solde',
      value: usd(Math.max(0, soldeYtd)),
      detail: 'Reste à remonter',
      color: soldeYtd > 0 ? ('warning' as const) : ('success' as const),
    },
  ];

  // -------- Alert banner --------
  const alert = {
    title:
      solde > totals.exigible * 0.3
        ? 'Retard de remontée significatif'
        : 'Remontées en bonne voie',
    body: `Sur les ${usd(totals.exigible)} exigibles, ${usd(receivedTotal)} ont été remontés à la Holding, soit ${fmtPct(recoveryRate)} du montant attendu.`,
    rate: fmtPct(recoveryRate),
    balance: usd(Math.max(0, solde)),
  };

  // -------- Détail par entité --------
  // Per-entity cash actually received across the source months (excl. apport Maxence).
  const receivedPerEntity: Record<string, number> = {};
  INTERCO_RULES.forEach((r) => {
    receivedPerEntity[r.key] = sourceMonths.reduce((acc, sm) => {
      const block = INTERCOS_CASH[sm];
      return acc + (block?.received?.[r.key] ?? 0);
    }, 0);
  });

  const tableRows = perEntity.map((e) => {
    const cells: Record<string, string> = { entity: e.rule.label, _key: e.rule.key };
    e.monthly.forEach((m) => {
      cells[m.sourceMonth] = usd(m.amount);
    });
    const received = receivedPerEntity[e.rule.key] ?? 0;
    const remaining = Math.max(0, e.ytd - received);
    cells.ytd = usd(e.ytd);
    cells.received = usd(received);
    cells.remaining = usd(remaining);
    return cells;
  });

  const totalRow: Record<string, string> = { entity: 'TOTAL ATTENDU' };
  sourceMonths.forEach((sm) => {
    totalRow[sm] = usd(perEntity.reduce((a, e) => {
      const cell = e.monthly.find((x) => x.sourceMonth === sm);
      return a + (cell?.amount ?? 0);
    }, 0));
  });
  const totalReceived = Object.values(receivedPerEntity).reduce((a, b) => a + b, 0);
  const totalRemaining = Math.max(0, totals.ytd - totalReceived);
  totalRow.ytd = usd(totals.ytd);
  totalRow.received = usd(totalReceived);
  totalRow.remaining = usd(totalRemaining);

  const dynamicColumns = sourceMonths.map((sm) => ({
    key: sm,
    label: MONTH_SHORT[sm],
    isExigible: MONTH_ORDER.indexOf(sm) + 1 <= viewIdx,
  }));

  const legacyTable = {
    columns: dynamicColumns,
    rows: tableRows,
    total: totalRow,
  };

  // -------- Cards visuelles : ce que chaque entité doit encore remonter --------
  const entityCards = perEntity.map((e) => {
    const received = receivedPerEntity[e.rule.key] ?? 0;
    const expected = e.ytd;
    const remaining = Math.max(0, expected - received);
    const rate = expected > 0 ? (received / expected) * 100 : 0;
    let level: 'danger' | 'warning' | 'success' = 'danger';
    if (rate >= 80) level = 'success';
    else if (rate >= 40) level = 'warning';
    return {
      key: e.rule.key,
      entity: e.rule.label,
      expected: usd(expected),
      received: usd(received),
      remaining: usd(remaining),
      rate: fmtPct(rate),
      ratePct: rate,
      level,
    };
  });
  const exigibleMonths = sourceMonths.filter((sm) => MONTH_ORDER.indexOf(sm) + 1 <= viewIdx);

  // -------- Scénarios (kept for backward compat) --------
  const scenarios = {
    base: {
      title: 'Scénario Base',
      lines: [
        { label: `Remontées exigibles (${exigibleMonths.map((m) => MONTH_SHORT[m]).join('+') || '—'})`, value: usd(totals.exigible), type: 'neutral' as const },
        { label: 'Montants reçus à date', value: usdSigned(-receivedTotal), type: 'negative' as const },
      ],
      total: { label: 'SOLDE DÛ À LA HOLDING', value: usd(Math.max(0, solde)) },
      rateLabel: 'Taux de recouvrement',
      rate: fmtPct(recoveryRate),
    },
    apport: {
      title: 'Scénario avec Apport Max',
      lines: [
        { label: `Remontées exigibles (${exigibleMonths.map((m) => MONTH_SHORT[m]).join('+') || '—'})`, value: usd(totals.exigible), type: 'neutral' as const },
        { label: 'Montants reçus à date', value: usdSigned(-receivedTotal), type: 'negative' as const },
        { label: '+ Apport Maxence', value: usdSigned(-apportMaxence), type: 'positive' as const },
      ],
      total: { label: 'SOLDE DÛ RÉVISÉ', value: usd(Math.max(0, soldeAvecApport)) },
      rateLabel: 'Taux de recouvrement ajusté',
      rate: fmtPct(recoveryRateApport),
    },
  };

  const calendar = sourceMonths.map((sm) => ({
    month: MONTH_LONG[sm],
    amount: usd(perEntity.reduce((a, e) => {
      const cell = e.monthly.find((x) => x.sourceMonth === sm);
      return a + (cell?.amount ?? 0);
    }, 0)),
    status: 'Marge à remonter',
    tag: '90% marge nette',
    level: 'navy' as 'danger' | 'warning' | 'navy',
  }));

  // -------- Récap (kept minimal for backward compat — UI uses entityCards) --------
  const recoveryRateYtd = totals.ytd > 0 ? (receivedTotal / totals.ytd) * 100 : 0;
  const recap = [
    { label: 'Somme à remonter', s1: usd(totals.ytd), s2: usd(totals.ytd) },
    { label: 'Encaissements reçus', s1: usd(receivedTotal), s2: usd(receivedTotal) },
    {
      label: 'Solde',
      s1: usd(Math.max(0, soldeYtd)),
      s2: usd(Math.max(0, soldeYtd)),
      s1Color: 'danger' as const,
      s2Color: 'warning' as const,
      bold: true,
      highlight: true,
    },
    {
      label: 'Taux de recouvrement',
      s1: fmtPct(recoveryRateYtd),
      s2: fmtPct(recoveryRateYtd),
      s1Color: 'danger' as const,
      s2Color: 'success' as const,
    },
  ];

  // ====================================================================
  // PHASES MÉTIER — restructuration demandée par le client
  // --------------------------------------------------------------------
  // A) Phase MaxScale (Jan/Fév) : DG + Comment + SPY mélangés sur l'ancienne
  //    structure. On compare juste théorique vs réel, sans split entité.
  // B) Phase DG Solutions (Mars+) : DG + Comment uniquement. SPY exclu.
  // C) Bloc SPY (Mars+) : isolé, info uniquement, aucun impact sur DG.
  // ====================================================================
  const periodMaxscale = sourceMonths.filter((m) => MAXSCALE_MONTHS.includes(m));
  const periodDgPhase = sourceMonths.filter(
    (m) => MONTH_ORDER.indexOf(m) >= MONTH_ORDER.indexOf(DG_PHASE_FROM),
  );

  // ---- A) MaxScale ----
  const sumMaxscaleMargin = periodMaxscale.reduce((acc, sm) => {
    const dg = digitFacts(sm)?.margeNette ?? 0;
    const comment = MANUAL_ENTITIES[sm]?.comment.margeNette ?? 0;
    const spy = MANUAL_ENTITIES[sm]?.spy.margeNette ?? 0;
    return acc + dg + comment + spy;
  }, 0);
  const maxscaleTheorique = sumMaxscaleMargin * TRANSFER_RATE;
  const maxscaleRecu = periodMaxscale.reduce((acc, sm) => {
    const r = INTERCOS_CASH[sm]?.received ?? {};
    return acc + (r.digit ?? 0) + (r.comment ?? 0) + (r.spy ?? 0);
  }, 0);
  const maxscaleEcart = maxscaleTheorique - maxscaleRecu;

  const maxScalePhase = periodMaxscale.length > 0 ? {
    periodLabel: periodMaxscale.map((m) => MONTH_SHORT[m]).join(' + '),
    months: periodMaxscale.map((m) => MONTH_LONG[m]),
    totalResultat: usd(sumMaxscaleMargin),
    theorique: usd(maxscaleTheorique),
    recu: usd(maxscaleRecu),
    ecart: usd(Math.max(0, maxscaleEcart)),
    ecartSigned: usdSigned(maxscaleEcart),
    rate: fmtPct(TRANSFER_RATE * 100),
    note: 'Pot historique MaxScale : DG activity + CommentTrust + SPY agrégés. Régularisation globale, pas de split entité.',
  } : null;

  // ---- B) DG Solutions ----
  const dgMargin = periodDgPhase.reduce((acc, sm) => acc + (digitFacts(sm)?.margeNette ?? 0), 0);
  const commentMargin = periodDgPhase.reduce((acc, sm) => acc + (MANUAL_ENTITIES[sm]?.comment.margeNette ?? 0), 0);
  const dgBase = dgMargin + commentMargin;
  const dgRemontable = dgBase * TRANSFER_RATE;
  const dgRecu = periodDgPhase.reduce((acc, sm) => {
    const r = INTERCOS_CASH[sm]?.received ?? {};
    return acc + (r.digit ?? 0) + (r.comment ?? 0);
  }, 0);
  const dgSolde = dgRemontable - dgRecu;

  const dgSolutionsPhase = periodDgPhase.length > 0 ? {
    periodLabel: periodDgPhase.map((m) => MONTH_SHORT[m]).join(' → '),
    rate: fmtPct(TRANSFER_RATE * 100),
    dgActivity: usd(dgMargin),
    commentTrust: usd(commentMargin),
    base: usd(dgBase),
    remontable: usd(dgRemontable),
    recu: usd(dgRecu),
    solde: usd(Math.max(0, dgSolde)),
    soldeSigned: usdSigned(dgSolde),
    note: 'DG Solutions = DG activity + CommentTrust. SPY exclu (géré séparément).',
  } : null;

  // ---- C) SPY isolé (Mars+) ----
  const spyMonths = periodDgPhase; // SPY isolé uniquement à partir de Mars
  const spyRevenue = spyMonths.reduce((acc, sm) => acc + (MANUAL_ENTITIES[sm]?.spy.ca ?? 0), 0);
  const spyCosts = spyMonths.reduce((acc, sm) => acc + (MANUAL_ENTITIES[sm]?.spy.charges ?? 0), 0);
  const spyProfit = spyMonths.reduce((acc, sm) => acc + (MANUAL_ENTITIES[sm]?.spy.margeNette ?? 0), 0);
  const spyCashRecu = spyMonths.reduce((acc, sm) => acc + (INTERCOS_CASH[sm]?.received?.spy ?? 0), 0);
  const spyMargin = spyRevenue > 0 ? (spyProfit / spyRevenue) * 100 : 0;

  const spyIsolated = spyMonths.length > 0 ? {
    periodLabel: spyMonths.map((m) => MONTH_SHORT[m]).join(' → '),
    revenue: usd(spyRevenue),
    costs: usd(spyCosts),
    profit: usd(spyProfit),
    marginPct: fmtPct(spyMargin),
    cashRecu: usd(spyCashRecu),
    note: 'Entité isolée — hors périmètre du calcul automatique DG Solutions. PSP & coûts spécifiques.',
  } : null;

  return {
    kpis,
    alert,
    table: legacyTable,
    entityCards,
    scenarios,
    calendar,
    recap,
    marsNote: '',
    // Nouveaux blocs structurés par phase métier
    maxScalePhase,
    dgSolutionsPhase,
    spyIsolated,
    rulesApplied: INTERCO_RULES.map((r) => ({
      entity: r.label,
      rate: `${(r.transferRate * 100).toFixed(0)}%`,
      lag: `M+${r.settlementLagMonths}`,
    })),
  };
}

