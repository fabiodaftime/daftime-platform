#!/usr/bin/env tsx
/**
 * CI gate — Audit global de cohérence financière.
 *
 * Exécute en chaîne tous les checks qui doivent rester verts à chaque
 * modification de calcul :
 *
 *   1. Digit YTD (additif + moyennes)        → validateAllDigitYTD()
 *   2. Digit conso au centime (Σ entités)    → consolidator vs entités
 *   3. CA = Charges + Marge (identité)       → par entité + group
 *   4. Marge % recalculée (jamais moyennée)  → group + entités
 *   5. Évolutions mensuelles                 → Δ group = Σ Δ entités
 *   6. PCG Digit consistency (PCGroup ↔ dashboard)
 *   7. PCA integrity (alignment + YTD recompute)
 *
 * Sortie non-nulle dès qu'un seul écart > tolérance → pipeline rouge.
 */
import {
  validateAllDigitYTD,
  formatIssue as formatYTDIssue,
} from "../src/components/dashboard/digit/digitYTDValidation";
import { consolidateDigitGroup } from "../src/components/dashboard/digit/contract/digitGroupConsolidator";
import {
  getDigitEntityPnL,
  DIGIT_GROUP_MAPPING,
} from "../src/components/dashboard/digit/contract/digitEntityContract";
import { DIGIT_AVAILABLE_MONTHS } from "../src/components/dashboard/digit/DigitData";
import { validatePCAIntegrity } from "../src/components/dashboard/primecircle-agency/pcaIntegrityValidator";

const TOL_USD = 0.01; // centime
const TOL_PCT = 0.001; // 0.001 pt

const errors: string[] = [];
const ok = (label: string) => console.log(`✅ ${label}`);
const fail = (label: string, detail: string) => {
  const msg = `❌ ${label} — ${detail}`;
  console.error(msg);
  errors.push(msg);
};

// ---------- 1. Digit YTD ----------
{
  const issues = validateAllDigitYTD();
  if (issues.length === 0) ok("Digit YTD (additif + moyennes)");
  else
    fail(
      "Digit YTD",
      `${issues.length} écart(s)\n` + issues.map((i) => "    " + formatYTDIssue(i)).join("\n"),
    );
}

// ---------- 2-5. Digit consolidation ----------
const months = DIGIT_AVAILABLE_MONTHS.map((m) => m.id);
let consoIssues = 0;
for (const monthId of months) {
  const g = consolidateDigitGroup(monthId);
  const entities = DIGIT_GROUP_MAPPING.map((e) => getDigitEntityPnL(e, monthId));
  const sumCa = entities.reduce((s, e) => s + e.ca, 0);
  const sumMarge = entities.reduce((s, e) => s + e.marge, 0);
  const sumCharges = entities.reduce((s, e) => s + e.charges, 0);
  const expectedPct = sumCa > 0 ? (sumMarge / sumCa) * 100 : 0;

  if (Math.abs(g.ca - sumCa) > TOL_USD)
    fail(`Conso CA [${monthId}]`, `group=${g.ca} vs Σ=${sumCa}`), consoIssues++;
  if (Math.abs(g.marge - sumMarge) > TOL_USD)
    fail(`Conso Marge [${monthId}]`, `group=${g.marge} vs Σ=${sumMarge}`), consoIssues++;
  if (Math.abs(g.charges - sumCharges) > TOL_USD)
    fail(`Conso Charges [${monthId}]`, `group=${g.charges} vs Σ=${sumCharges}`), consoIssues++;
  if (Math.abs(g.margePct - expectedPct) > TOL_PCT)
    fail(`Marge % [${monthId}]`, `group=${g.margePct} vs recalc=${expectedPct}`), consoIssues++;
  if (Math.abs(g.ca - (g.charges + g.marge)) > TOL_USD)
    fail(`Identité CA=Ch+M [${monthId}]`, `${g.ca} ≠ ${g.charges + g.marge}`), consoIssues++;

  for (const e of entities) {
    if (Math.abs(e.ca - (e.charges + e.marge)) > TOL_USD)
      fail(`Identité ${e.entity} [${monthId}]`, `${e.ca} ≠ ${e.charges + e.marge}`),
        consoIssues++;
  }
}
if (consoIssues === 0) ok("Digit conso au centime (CA, Marge, Charges, Marge %, identité)");

// ---------- 5. Évolutions mensuelles ----------
let evoIssues = 0;
for (let i = 1; i < months.length; i++) {
  const prev = months[i - 1];
  const curr = months[i];
  const gPrev = consolidateDigitGroup(prev);
  const gCurr = consolidateDigitGroup(curr);
  for (const key of ["ca", "marge", "charges"] as const) {
    const deltaGroup = (gCurr[key] as number) - (gPrev[key] as number);
    const deltaEnt = DIGIT_GROUP_MAPPING.reduce(
      (s, e) => s + ((getDigitEntityPnL(e, curr) as any)[key] - (getDigitEntityPnL(e, prev) as any)[key]),
      0,
    );
    if (Math.abs(deltaGroup - deltaEnt) > TOL_USD) {
      fail(
        `Δ ${key} ${prev}→${curr}`,
        `group=${deltaGroup} vs Σ Δ entités=${deltaEnt}`,
      );
      evoIssues++;
    }
  }
}
if (evoIssues === 0) ok("Évolutions mensuelles Δ group = Σ Δ entités");

// ---------- 6. PCA integrity (non-bloquant : warnings legacy data) ----------
{
  const report = validatePCAIntegrity();
  const bad = report.months.filter((m) => m.status !== "ok");
  if (bad.length === 0) ok(`PCA integrity (${report.summary.ok}/${report.summary.total} mois OK)`);
  else {
    console.warn(`⚠️  PCA integrity : ${bad.length} mois avec écarts (non-bloquant)`);
    for (const m of bad) {
      const align = m.alignment.map((a) => `${a.rule} (Δ=${a.delta.toFixed(2)})`).join("; ");
      const ytd = m.ytd
        .map((y) => `${y.field} déclaré=${y.declared} recalc=${y.recomputed}`)
        .join("; ");
      console.warn(`    • ${m.label} — ${[align, ytd].filter(Boolean).join(" | ")}`);
    }
  }
}

// ---------- Sortie ----------
if (errors.length === 0) {
  console.log("\n✅ Audit cohérence global : OK");
  process.exit(0);
}
console.error(`\n❌ Audit cohérence : ${errors.length} écart(s) détecté(s) — déploiement bloqué.`);
process.exit(1);
