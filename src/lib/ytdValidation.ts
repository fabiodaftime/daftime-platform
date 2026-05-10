// Generic YTD validation utilities.
// Validates that additive YTD = jan + feb + mar (within tolerance),
// and that average-type YTD (%, ratios, ticket moyen) are NOT a naive sum.

export interface ComparisonLikeRow {
  indicator?: string;
  entity?: string;
  jan?: string;
  feb?: string;
  mar?: string;
  ytd?: string;
}

export type YTDIssueKind =
  | 'additive-mismatch'
  | 'average-as-sum'
  | 'unparsable'
  | 'missing-period';

export interface YTDIssue {
  label: string;
  kind: YTDIssueKind;
  expected?: number;
  actual?: number;
  diff?: number;
  message: string;
}

const PLACEHOLDER = new Set(['', '—', '-', 'n/a', 'N/A', '–']);

/** Parse a display string like "$1,276", "50.4%", "+25.2pts", "768" into a number. */
export function parseAmount(raw?: string): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (PLACEHOLDER.has(s)) return null;
  // strip currency symbols, spaces, commas, trailing units
  const cleaned = s
    .replace(/[\s,]/g, '')
    .replace(/[$€£¥]/g, '')
    .replace(/pts?$/i, '')
    .replace(/%$/, '')
    .replace(/🚀|⚠️|✅/g, '');
  // Handle K / M / B suffixes (case-insensitive)
  const m = cleaned.match(/^(-?\+?\d+(?:\.\d+)?)([kKmMbB])?$/);
  if (!m) {
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  let n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  const suffix = m[2]?.toLowerCase();
  if (suffix === 'k') n *= 1_000;
  else if (suffix === 'm') n *= 1_000_000;
  else if (suffix === 'b') n *= 1_000_000_000;
  return n;
}

/** Heuristic: is this indicator an average / rate / ticket (NOT additive)? */
export function isAverageIndicator(label?: string, ytd?: string): boolean {
  const l = (label || '').toLowerCase();
  if (
    l.includes('taux') ||
    l.includes('ratio') ||
    l.includes('%') ||
    l.includes('moyen') ||
    l.includes('ticket') ||
    l.includes('adr') ||
    l.includes('revpar') ||
    l.includes('marge brute %') ||
    l.includes('marge nette %')
  ) {
    return true;
  }
  // Value ends with % or pts → rate
  const v = (ytd || '').trim();
  return v.endsWith('%') || /pts?$/i.test(v);
}

export interface ValidateOptions {
  /** Absolute tolerance for additive checks (currency units). Default $2. */
  additiveTolerance?: number;
  /** Skip rows whose label matches this regex. */
  skip?: RegExp;
}

/** Validate an array of comparison-like rows. Returns the list of issues. */
export function validateComparisonRows(
  rows: ComparisonLikeRow[] | null | undefined,
  context: string,
  options: ValidateOptions = {},
): YTDIssue[] {
  if (!rows || rows.length === 0) return [];
  const tol = options.additiveTolerance ?? 2;
  const issues: YTDIssue[] = [];

  for (const row of rows) {
    const label = row.indicator || row.entity || '?';
    if (options.skip?.test(label)) continue;
    if (row.ytd == null) continue;

    const ytdNum = parseAmount(row.ytd);
    const jan = parseAmount(row.jan);
    const feb = parseAmount(row.feb);
    const mar = parseAmount(row.mar);

    // Skip rows without enough monthly data to evaluate.
    const monthly = [jan, feb, mar].filter((x): x is number => x != null);
    if (monthly.length === 0) continue;

    if (ytdNum == null) {
      issues.push({
        label: `[${context}] ${label}`,
        kind: 'unparsable',
        message: `YTD value "${row.ytd}" could not be parsed`,
      });
      continue;
    }

    if (isAverageIndicator(label, row.ytd)) {
      // For averages, a naive sum would clearly overshoot. Flag if ytd ≈ sum.
      const sum = monthly.reduce((a, b) => a + b, 0);
      if (Math.abs(ytdNum - sum) < 0.5 && monthly.length > 1) {
        issues.push({
          label: `[${context}] ${label}`,
          kind: 'average-as-sum',
          expected: undefined,
          actual: ytdNum,
          message: `Average-type indicator: YTD (${row.ytd}) equals the simple sum of months — should be a weighted average.`,
        });
      }
      continue;
    }

    // Additive check — only meaningful when ALL provided months are present.
    if (jan == null || feb == null || mar == null) {
      // Partial: still compare what we have for transparency, but only error if YTD < monthly sum.
      const partialSum = monthly.reduce((a, b) => a + b, 0);
      if (ytdNum + tol < partialSum) {
        issues.push({
          label: `[${context}] ${label}`,
          kind: 'missing-period',
          expected: partialSum,
          actual: ytdNum,
          diff: ytdNum - partialSum,
          message: `YTD (${row.ytd}) is lower than the partial sum of available months (${partialSum}).`,
        });
      }
      continue;
    }

    const expected = jan + feb + mar;
    const diff = ytdNum - expected;
    if (Math.abs(diff) > tol) {
      issues.push({
        label: `[${context}] ${label}`,
        kind: 'additive-mismatch',
        expected,
        actual: ytdNum,
        diff,
        message: `Additive YTD mismatch: expected ${expected.toLocaleString()}, got ${ytdNum.toLocaleString()} (Δ ${diff >= 0 ? '+' : ''}${diff.toLocaleString()}).`,
      });
    }
  }

  return issues;
}

/** Dev-time runner: logs issues to console.warn. No-op in production. */
export function reportYTDIssues(issues: YTDIssue[]): void {
  if (typeof window === 'undefined') return;
  // Only noisy in dev
  if (!(import.meta as any).env?.DEV) return;
  if (issues.length === 0) return;
  // eslint-disable-next-line no-console
  console.warn(
    `[YTD validation] ${issues.length} issue(s) detected:\n` +
      issues.map((i) => ` • ${i.label} — ${i.message}`).join('\n'),
  );
}
