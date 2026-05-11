// Computes the Intercos tab data structure from the source dashboards
// + INTERCO_RULES + INTERCOS_CASH actuals. Replaces the static
// INTERCOS_DATA block in PCGroupData.ts via applyComputedOverlay.

import type { PCGSourceMonthId } from './sources/entityAdapters';
import { INTERCO_RULES, computeExpectedTransfer } from './intercosRules';
import { INTERCOS_CASH } from './manualEntities';
import { fmtUSD, fmtPct } from './pcGroupFormatters';

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

  // Aggregate received cash for source months whose due-date already passed.
  const receivedTotal = sourceMonths.reduce((acc, sm) => {
    const dueIdx = MONTH_ORDER.indexOf(sm) + 1; // default lag
    if (dueIdx > viewIdx) return acc;
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
  // Columns = each source month + Total Exigible + Non-exigible(s) + YTD
  const exigibleMonths = sourceMonths.filter((sm) => MONTH_ORDER.indexOf(sm) + 1 <= viewIdx);
  const notDueMonths = sourceMonths.filter((sm) => MONTH_ORDER.indexOf(sm) + 1 > viewIdx);

  const tableRows = perEntity.map((e) => {
    const cells: Record<string, string> = { entity: e.rule.label };
    e.monthly.forEach((m) => {
      cells[m.sourceMonth] = usd(m.amount);
    });
    cells.exigible = usd(e.exigible);
    cells.notYetDue = usd(e.notYetDue);
    cells.ytd = usd(e.ytd);
    return cells;
  });

  const totalRow: Record<string, string> = { entity: 'TOTAL ATTENDU' };
  sourceMonths.forEach((sm) => {
    totalRow[sm] = usd(perEntity.reduce((a, e) => {
      const cell = e.monthly.find((x) => x.sourceMonth === sm);
      return a + (cell?.amount ?? 0);
    }, 0));
  });
  totalRow.exigible = usd(totals.exigible);
  totalRow.notYetDue = usd(totals.notYetDue);
  totalRow.ytd = usd(totals.ytd);

  // Dynamic table: N source-month columns + Total Exigible + Non Exigible + YTD.
  // Garde une compat backward (jan/feb/mars) pour les anciens consommateurs.
  const dynamicColumns = sourceMonths.map((sm) => ({
    key: sm,
    label: MONTH_SHORT[sm],
    isExigible: MONTH_ORDER.indexOf(sm) + 1 <= viewIdx,
  }));
  const dynamicRows = perEntity.map((e) => {
    const cells: Record<string, string> = { entity: e.rule.label };
    e.monthly.forEach((m) => { cells[m.sourceMonth] = usd(m.amount); });
    cells.exigible = usd(e.exigible);
    cells.notYetDue = usd(e.notYetDue);
    cells.ytd = usd(e.ytd);
    return cells;
  });
  const dynamicTotal: Record<string, string> = { entity: 'TOTAL ATTENDU' };
  sourceMonths.forEach((sm) => {
    dynamicTotal[sm] = usd(perEntity.reduce((a, e) => {
      const cell = e.monthly.find((x) => x.sourceMonth === sm);
      return a + (cell?.amount ?? 0);
    }, 0));
  });
  dynamicTotal.exigible = usd(totals.exigible);
  dynamicTotal.notYetDue = usd(totals.notYetDue);
  dynamicTotal.ytd = usd(totals.ytd);

  const legacyTable = {
    columns: dynamicColumns,
    rows: dynamicRows,
    total: dynamicTotal,
    // legacy shape conservée pour compat — non utilisée par le rendu dynamique
    legacyRows: tableRows.map((r) => ({
      entity: r.entity,
      jan: r['jan-2026'] ?? '—',
      feb: r['feb-2026'] ?? '—',
      exigible: r.exigible,
      mars: r['mar-2026'] ?? r.notYetDue,
      ytd: r.ytd,
    })),
  };

  // -------- Scénarios --------
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

  // -------- Calendrier (vue simplifiée : montant à remonter par mois) --------
  const calendar = sourceMonths.map((sm) => {
    const amount = perEntity.reduce((a, e) => {
      const cell = e.monthly.find((x) => x.sourceMonth === sm);
      return a + (cell?.amount ?? 0);
    }, 0);
    return {
      month: MONTH_LONG[sm],
      amount: usd(amount),
      status: 'Marge à remonter',
      tag: '90% marge nette',
      level: 'navy' as 'danger' | 'warning' | 'navy',
    };
  });
  calendar.push({
    month: 'Total YTD',
    amount: usd(totals.ytd),
    status: 'Somme à remonter',
    tag: periodLabel,
    level: 'navy' as any,
  });

  // -------- Récap comparatif scénarios (basé sur YTD à remonter) --------
  const recoveryRateYtd = totals.ytd > 0 ? (receivedTotal / totals.ytd) * 100 : 0;
  const recoveryRateYtdApport =
    totals.ytd > 0 ? ((receivedTotal + apportMaxence) / totals.ytd) * 100 : 0;
  const soldeYtdApport = soldeYtd - apportMaxence;
  const recap = [
    { label: 'Somme à remonter', s1: usd(totals.ytd), s2: usd(totals.ytd) },
    { label: 'Encaissements reçus', s1: usd(receivedTotal), s2: usd(receivedTotal) },
    { label: 'Apport Maxence', s1: '—', s2: usdSigned(apportMaxence ? -apportMaxence : 0).replace('-', '+'), s2Color: 'success' as const },
    { label: 'Total fonds disponibles', s1: usd(receivedTotal), s2: usd(receivedTotal + apportMaxence) },
    {
      label: 'Solde',
      s1: usd(Math.max(0, soldeYtd)),
      s2: usd(Math.max(0, soldeYtdApport)),
      s1Color: 'danger' as const,
      s2Color: 'warning' as const,
      bold: true,
      highlight: true,
    },
    {
      label: 'Taux de recouvrement',
      s1: fmtPct(recoveryRateYtd),
      s2: fmtPct(recoveryRateYtdApport),
      s1Color: 'danger' as const,
      s2Color: 'success' as const,
    },
  ];

  const marsNote = '';

  return {
    kpis,
    alert,
    table: legacyTable,
    scenarios,
    calendar,
    recap,
    marsNote,
    // Bonus: structured rule explanations for a future "rules" sub-block.
    rulesApplied: INTERCO_RULES.map((r) => ({
      entity: r.label,
      rate: `${(r.transferRate * 100).toFixed(0)}%`,
      lag: `M+${r.settlementLagMonths}`,
    })),
  };
}
