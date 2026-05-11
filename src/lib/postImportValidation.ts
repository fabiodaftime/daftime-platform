// Post-Import Validation
// ----------------------
// Déclenché automatiquement après chaque import CSV/Excel admin.
// Combine :
//   • validatePCAIntegrity()  → contrôle d'alignement (gross/net/expenses + waterfall)
//   • recomputePCA()          → recalcul YTD (gross/expenses/net/pcaShare) + champs dérivés
//
// Persiste la dernière exécution dans sessionStorage pour que la bannière
// admin survive aux navigations et soit accessible depuis n'importe quelle
// page d'admin.

import { validatePCAIntegrity, type PCAIntegrityReport } from '@/components/dashboard/primecircle-agency/pcaIntegrityValidator';
import { recomputePCA, type PCARecomputeReport } from '@/components/dashboard/primecircle-agency/pcaRecompute';

export type PostImportStatus = 'ok' | 'warning' | 'error';

export interface PostImportValidationResult {
  timestamp: string;            // ISO
  source: string;               // ex. "PCGroup manual facts", "Monthly financials"
  inserted: number;
  status: PostImportStatus;
  alignment: {
    monthsTotal: number;
    monthsOk: number;
    monthsWarning: number;
    issuesCount: number;
  };
  ytd: {
    correctionsCount: number;   // nb de champs YTD/dérivés à corriger
    monthsAffected: number;
  };
  // Résultats bruts pour drilldown éventuel
  integrityReport: PCAIntegrityReport;
  recomputeReport: PCARecomputeReport;
}

const STORAGE_KEY = 'lovable.postImportValidation.last';

export function runPostImportValidation(opts: { source: string; inserted: number }): PostImportValidationResult {
  const integrityReport = validatePCAIntegrity();
  const recomputeReport = recomputePCA();

  const monthsAffected = recomputeReport.months.filter((m) => m.corrections.length > 0).length;
  const issuesCount = integrityReport.months.reduce(
    (s, m) => s + m.alignment.length + m.ytd.length,
    0,
  );
  const status: PostImportStatus =
    integrityReport.summary.warnings === 0 && recomputeReport.totalCorrections === 0
      ? 'ok'
      : 'warning';

  const result: PostImportValidationResult = {
    timestamp: new Date().toISOString(),
    source: opts.source,
    inserted: opts.inserted,
    status,
    alignment: {
      monthsTotal: integrityReport.summary.total,
      monthsOk: integrityReport.summary.ok,
      monthsWarning: integrityReport.summary.warnings,
      issuesCount,
    },
    ytd: {
      correctionsCount: recomputeReport.totalCorrections,
      monthsAffected,
    },
    integrityReport,
    recomputeReport,
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      timestamp: result.timestamp,
      source: result.source,
      inserted: result.inserted,
      status: result.status,
      alignment: result.alignment,
      ytd: result.ytd,
    }));
    window.dispatchEvent(new CustomEvent('post-import-validation', { detail: result }));
  } catch {
    // ignore storage errors (Safari private mode etc.)
  }

  return result;
}

export interface PersistedPostImportValidation {
  timestamp: string;
  source: string;
  inserted: number;
  status: PostImportStatus;
  alignment: PostImportValidationResult['alignment'];
  ytd: PostImportValidationResult['ytd'];
}

export function getLastPostImportValidation(): PersistedPostImportValidation | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedPostImportValidation;
  } catch {
    return null;
  }
}
