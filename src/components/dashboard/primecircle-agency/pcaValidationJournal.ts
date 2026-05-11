// PCA Validation Journal
// ----------------------
// Journal append-only des opérations d'import / correction / audit qui ont
// touché les figures PCA. Chaque entrée trace :
//   • timestamp ISO de l'opération
//   • opération (import | correction | audit)
//   • mois concerné
//   • opérateur (libre)
//   • motif
//   • écarts détectés à ce moment-là (champ, valeur saisie, valeur
//     recomputée, delta, unité)
//
// Convention : on N'ÉDITE JAMAIS une entrée existante, on en ajoute une
// nouvelle. Le journal est la source d'audit ; le validateur d'intégrité
// (pcaIntegrityValidator) reste la source de vérité « live ».

import type { PCAMonthId } from './PrimeCircleAgencyData';

export type JournalOperation = 'import' | 'correction' | 'audit';

export interface JournalDiscrepancy {
  field: string;
  declared: number;
  recomputed: number;
  delta: number;
  unit: 'usd' | 'pct';
}

export interface JournalEntry {
  id: string;             // unique (timestamp + monthId + op suffit)
  timestamp: string;      // ISO 8601
  operation: JournalOperation;
  monthId: PCAMonthId;
  monthLabel: string;
  operator: string;       // ex. "CFO Advisory", "Auto-validator"
  reason: string;
  discrepancies: JournalDiscrepancy[];
}

// Append-only : ajouter en haut, jamais éditer une entrée existante.
export const PCA_VALIDATION_JOURNAL: JournalEntry[] = [
  // ---------------------------------------------------------------------
  // Mars 2026 — correction Total Expenses
  {
    id: '2026-04-12T10:30:00Z__mar-2026__correction',
    timestamp: '2026-04-12T10:30:00Z',
    operation: 'correction',
    monthId: 'mar-2026',
    monthLabel: 'Mars 2026',
    operator: 'CFO Advisory',
    reason: 'Restatement Total Expenses Mars 2026 ($16,555 → $16,510).',
    discrepancies: [
      { field: 'expenses', declared: 16555, recomputed: 16510, delta: -45, unit: 'usd' },
    ],
  },
  // ---------------------------------------------------------------------
  // Février 2026 — correction Total Expenses
  {
    id: '2026-04-12T10:25:00Z__feb-2026__correction',
    timestamp: '2026-04-12T10:25:00Z',
    operation: 'correction',
    monthId: 'feb-2026',
    monthLabel: 'Février 2026',
    operator: 'CFO Advisory',
    reason: 'Restatement Total Expenses Février 2026 ($10,606 → $9,406).',
    discrepancies: [
      { field: 'expenses', declared: 10606, recomputed: 9406, delta: -1200, unit: 'usd' },
    ],
  },
  // ---------------------------------------------------------------------
  // Janvier 2026 — correction Gross Revenue
  {
    id: '2026-04-12T10:20:00Z__jan-2026__correction',
    timestamp: '2026-04-12T10:20:00Z',
    operation: 'correction',
    monthId: 'jan-2026',
    monthLabel: 'Janvier 2026',
    operator: 'CFO Advisory',
    reason: 'Restatement Gross Revenue Janvier 2026 ($10,726 → $14,885).',
    discrepancies: [
      { field: 'gross', declared: 10726, recomputed: 14885, delta: 4159, unit: 'usd' },
    ],
  },
  // ---------------------------------------------------------------------
  // Février 2026 — correction Gross Revenue
  {
    id: '2026-04-12T10:15:00Z__feb-2026__correction',
    timestamp: '2026-04-12T10:15:00Z',
    operation: 'correction',
    monthId: 'feb-2026',
    monthLabel: 'Février 2026',
    operator: 'CFO Advisory',
    reason: 'Restatement Gross Revenue Février 2026 ($35,080 → $36,184).',
    discrepancies: [
      { field: 'gross', declared: 35080, recomputed: 36184, delta: 1104, unit: 'usd' },
    ],
  },
  // ---------------------------------------------------------------------
  // Avril 2026 — import initial sans écart
  {
    id: '2026-05-02T09:00:00Z__apr-2026__import',
    timestamp: '2026-05-02T09:00:00Z',
    operation: 'import',
    monthId: 'apr-2026',
    monthLabel: 'Avril 2026',
    operator: 'CFO Advisory',
    reason: 'Import mensuel Avril 2026 — alignement OK, aucun écart détecté.',
    discrepancies: [],
  },
];

export function getJournal(): JournalEntry[] {
  // tri décroissant (plus récent en premier)
  return [...PCA_VALIDATION_JOURNAL].sort((a, b) =>
    a.timestamp < b.timestamp ? 1 : -1,
  );
}

export function getJournalByMonth(monthId: PCAMonthId): JournalEntry[] {
  return getJournal().filter((e) => e.monthId === monthId);
}

export function formatJournalDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatJournalDelta(n: number, unit: 'usd' | 'pct'): string {
  const sign = n >= 0 ? '+' : '−';
  if (unit === 'pct') return `${sign}${Math.abs(n).toFixed(2)} pt`;
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
}

export function formatJournalValue(n: number, unit: 'usd' | 'pct'): string {
  if (unit === 'pct') return `${n.toFixed(2)}%`;
  return `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
}
