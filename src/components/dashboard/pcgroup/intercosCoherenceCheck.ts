// Vérification de cohérence automatique pour l'onglet "Flux Intercos".
//
// Contrôle qu'à l'affichage :
//   • chaque ligne du tableau respecte remaining = max(0, ytd − received)
//   • la ligne TOTAL ATTENDU = somme des lignes (ytd / received / remaining)
//   • les 3 KPI hero (Somme à Remonter / Somme Remontée / Solde) sont alignés
//     avec le total du tableau
//
// Toute incohérence signale soit une régression dans le calculateur
// (`pcGroupIntercosCompute.ts`) soit un écart de formatage. Le résultat est
// affiché en bandeau dans `PCGroupIntercosTab` pour que l'utilisateur soit
// alerté sans qu'il ait à recouper les chiffres à la main.

export type CoherenceSeverity = 'error' | 'warning';

export interface CoherenceIssue {
  severity: CoherenceSeverity;
  /** Identifiant court pour les tests et exports. */
  code:
    | 'row_remaining_mismatch'
    | 'total_ytd_mismatch'
    | 'total_received_mismatch'
    | 'total_remaining_mismatch'
    | 'kpi_expected_mismatch'
    | 'kpi_received_mismatch'
    | 'kpi_solde_mismatch';
  /** Libellé court (utilisé dans le bandeau UI). */
  label: string;
  /** Explication lisible avec écart chiffré. */
  message: string;
  /** Écart absolu en USD (positif). */
  delta: number;
}

const TOL = 2; // tolérance d'arrondi USD (chaque cellule est arrondie à l'unité)

const parseUSD = (v: unknown): number => {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return 0;
  const n = Number(v.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const fmtUSD = (n: number) =>
  `$${Math.round(n).toLocaleString('en-US')}`;

export interface IntercosLike {
  kpis: Array<{ label: string; value: string | number }>;
  table: {
    rows: Array<Record<string, unknown>>;
    total: Record<string, unknown>;
  };
}

/**
 * Compare attendu / remonté / reste sur l'ensemble du tableau Intercos.
 * Retourne la liste des écarts (vide quand tout est cohérent).
 */
export function checkIntercosCoherence(intercos: IntercosLike): CoherenceIssue[] {
  const issues: CoherenceIssue[] = [];
  if (!intercos?.table?.rows || !intercos?.table?.total) return issues;

  const rows = intercos.table.rows;
  const total = intercos.table.total;

  // ---- 1) Cohérence intra-ligne : remaining = max(0, ytd − received) ----
  let sumYtd = 0;
  let sumReceived = 0;
  let sumRemaining = 0;
  for (const row of rows) {
    const ytd = parseUSD(row.ytd);
    const received = parseUSD(row.received);
    const remaining = parseUSD(row.remaining);
    const expectedRemaining = Math.max(0, ytd - received);
    const delta = Math.abs(remaining - expectedRemaining);
    if (delta > TOL) {
      issues.push({
        severity: 'error',
        code: 'row_remaining_mismatch',
        label: `Ligne « ${String(row.entity ?? '?')} » : reste incohérent`,
        message: `Reste affiché ${fmtUSD(remaining)} ≠ max(0, ${fmtUSD(ytd)} − ${fmtUSD(received)}) = ${fmtUSD(expectedRemaining)} (écart ${fmtUSD(delta)}).`,
        delta,
      });
    }
    sumYtd += ytd;
    sumReceived += received;
    sumRemaining += remaining;
  }

  // ---- 2) Total = somme des lignes (ytd / received / remaining) ----
  const totalYtd = parseUSD(total.ytd);
  const totalReceived = parseUSD(total.received);
  const totalRemaining = parseUSD(total.remaining);

  const dYtd = Math.abs(totalYtd - sumYtd);
  if (dYtd > TOL * Math.max(1, rows.length)) {
    issues.push({
      severity: 'error',
      code: 'total_ytd_mismatch',
      label: 'Total à remonter ≠ somme des lignes',
      message: `Ligne TOTAL ${fmtUSD(totalYtd)} vs Σ lignes ${fmtUSD(sumYtd)} (écart ${fmtUSD(dYtd)}).`,
      delta: dYtd,
    });
  }
  const dRecv = Math.abs(totalReceived - sumReceived);
  if (dRecv > TOL * Math.max(1, rows.length)) {
    issues.push({
      severity: 'error',
      code: 'total_received_mismatch',
      label: 'Total déjà remonté ≠ somme des lignes',
      message: `Ligne TOTAL ${fmtUSD(totalReceived)} vs Σ lignes ${fmtUSD(sumReceived)} (écart ${fmtUSD(dRecv)}).`,
      delta: dRecv,
    });
  }
  const dRem = Math.abs(totalRemaining - sumRemaining);
  if (dRem > TOL * Math.max(1, rows.length)) {
    issues.push({
      severity: 'warning',
      code: 'total_remaining_mismatch',
      label: 'Total solde restant ≠ somme des lignes',
      message: `Ligne TOTAL ${fmtUSD(totalRemaining)} vs Σ lignes ${fmtUSD(sumRemaining)} (écart ${fmtUSD(dRem)}). Possible si une ligne a un reste clampé à 0.`,
      delta: dRem,
    });
  }

  // ---- 3) KPI hero alignés sur la ligne TOTAL ----
  const kpiByLabel = (re: RegExp) =>
    intercos.kpis.find((k) => re.test(String(k.label ?? '')));

  const kpiExpected = kpiByLabel(/à\s*remonter/i);
  const kpiReceived = kpiByLabel(/remont[ée]e/i);
  const kpiSolde = kpiByLabel(/solde/i);

  if (kpiExpected) {
    const v = parseUSD(kpiExpected.value);
    const d = Math.abs(v - totalYtd);
    if (d > TOL * Math.max(1, rows.length)) {
      issues.push({
        severity: 'error',
        code: 'kpi_expected_mismatch',
        label: 'KPI « Somme à Remonter » ≠ Total tableau',
        message: `KPI ${fmtUSD(v)} vs Total ${fmtUSD(totalYtd)} (écart ${fmtUSD(d)}).`,
        delta: d,
      });
    }
  }
  if (kpiReceived) {
    const v = parseUSD(kpiReceived.value);
    const d = Math.abs(v - totalReceived);
    if (d > TOL * Math.max(1, rows.length)) {
      issues.push({
        severity: 'error',
        code: 'kpi_received_mismatch',
        label: 'KPI « Somme Remontée » ≠ Total tableau',
        message: `KPI ${fmtUSD(v)} vs Total ${fmtUSD(totalReceived)} (écart ${fmtUSD(d)}).`,
        delta: d,
      });
    }
  }
  if (kpiSolde) {
    const v = parseUSD(kpiSolde.value);
    const expectedSolde = Math.max(0, totalYtd - totalReceived);
    const d = Math.abs(v - expectedSolde);
    if (d > TOL * Math.max(1, rows.length)) {
      issues.push({
        severity: 'error',
        code: 'kpi_solde_mismatch',
        label: 'KPI « Solde » ≠ max(0, attendu − remonté)',
        message: `KPI ${fmtUSD(v)} vs ${fmtUSD(expectedSolde)} attendu (écart ${fmtUSD(d)}).`,
        delta: d,
      });
    }
  }

  return issues;
}
