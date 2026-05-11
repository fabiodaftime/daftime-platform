// Continuous validation for Digit YTD figures.
// Verifies for each available month that:
//   - Additive YTD indicators (CA, Marge, Deals, breakdowns by product) equal the
//     sum of monthly values from Jan up to the current month.
//   - Average YTD indicators are computed using the correct formula:
//       Taux de Marge Moyen YTD = Marge Totale YTD / CA Total YTD
//       Ticket Moyen YTD        = CA Total YTD / Total Deals YTD

import { DIGIT_AVAILABLE_MONTHS, getDigitMonthData, type DigitMonthId, type DigitMonthData } from "./DigitData";

export type BaseField =
  | "ca"
  | "marge"
  | "deals"
  | "digitCA"
  | "digitMarge"
  | "spyCA"
  | "spyMarge"
  | "ctCA"
  | "ctMarge";

export interface BreakdownRow {
  month: DigitMonthId;
  monthLabel: string;
  value: number;
  /** Path inside DigitMonthData where this value comes from (mapping reference). */
  sourcePath: string;
  /** Raw textual value as authored in DigitData (for traceability). */
  rawValue: string;
}

export interface YTDValidationIssue {
  month: DigitMonthId;
  indicator: string;
  expected: number;
  actual: number;
  delta: number;
  kind: "additive" | "average";
  /** Mapping of the *displayed* YTD value (where the dashboard reads it). */
  ytdSourcePath: string;
  /** Source rows that should sum to `expected` (one per month from Jan→current). */
  breakdown: BreakdownRow[];
  /** Human-readable formula for average issues, e.g. "Marge YTD / CA YTD * 100". */
  formula?: string;
}

const TOLERANCE_ABS = 1; // $1 rounding tolerance for additive sums
const TOLERANCE_RATE = 0.1; // 0.1pt tolerance for percentages
const TOLERANCE_TICKET = 1; // $1 tolerance for ticket moyen

const parseMoney = (s: string | number | null | undefined): number => {
  if (typeof s === "number") return s;
  if (!s) return 0;
  const cleaned = s.replace(/[^0-9.\-]/g, "");
  return cleaned ? parseFloat(cleaned) : 0;
};

const parsePercent = (s: string | null | undefined): number => {
  if (!s) return 0;
  const m = s.match(/(-?\d+(?:\.\d+)?)\s*%/);
  return m ? parseFloat(m[1]) : 0;
};

const parseInteger = (s: string | null | undefined): number => {
  if (!s) return 0;
  const cleaned = s.replace(/[^0-9\-]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
};

const findKPI = (kpis: any[] | null | undefined, labelPattern: RegExp): any | undefined =>
  kpis?.find((k) => labelPattern.test(k.label));

const findProduct = (products: any[] | null | undefined, labelPattern: RegExp): any | undefined =>
  products?.find((p) => labelPattern.test(p.label));

interface MonthlyBase {
  ca: number;
  marge: number;
  deals: number;
  digitCA: number;
  digitMarge: number;
  spyCA: number;
  spyMarge: number;
  ctCA: number;
  ctMarge: number;
}

interface MonthlyBaseWithSource {
  base: MonthlyBase;
  raw: Record<BaseField, string>;
  paths: Record<BaseField, string>;
}

const extractMargeFromSub = (sub: string | null | undefined): number => {
  if (!sub) return 0;
  const m = sub.match(/Marge\s+\$?([\d,.\-]+)/i);
  return m ? parseMoney(m[1]) : 0;
};

const extractMonthlyBaseWithSource = (data: DigitMonthData): MonthlyBaseWithSource => {
  const caKPI = findKPI(data.overviewKPIs, /CA Total/i);
  const margeKPI = findKPI(data.overviewKPIs, /Marge Totale/i);
  const dealsKPI = findKPI(data.overviewKPIs, /^Deals\b/i);

  const digit = findProduct(data.overviewProducts, /Digit Solution/i);
  const spy = findProduct(data.overviewProducts, /^SPY/i);
  const ct = findProduct(data.overviewProducts, /Comment\/Trust/i);

  const base: MonthlyBase = {
    ca: parseMoney(caKPI?.value),
    marge: parseMoney(margeKPI?.value),
    deals: parseInteger(dealsKPI?.value),
    digitCA: parseMoney(digit?.value),
    digitMarge: extractMargeFromSub(digit?.sub),
    spyCA: parseMoney(spy?.value),
    spyMarge: extractMargeFromSub(spy?.sub),
    ctCA: parseMoney(ct?.value),
    ctMarge: extractMargeFromSub(ct?.sub),
  };

  const raw: Record<BaseField, string> = {
    ca: caKPI?.value ?? "—",
    marge: margeKPI?.value ?? "—",
    deals: dealsKPI?.value ?? "—",
    digitCA: digit?.value ?? "—",
    digitMarge: digit?.sub ?? "—",
    spyCA: spy?.value ?? "—",
    spyMarge: spy?.sub ?? "—",
    ctCA: ct?.value ?? "—",
    ctMarge: ct?.sub ?? "—",
  };

  const paths: Record<BaseField, string> = {
    ca: 'overviewKPIs[label="CA Total"].value',
    marge: 'overviewKPIs[label="Marge Totale"].value',
    deals: 'overviewKPIs[label="Deals"].value',
    digitCA: 'overviewProducts[label="Digit Solution"].value',
    digitMarge: 'overviewProducts[label="Digit Solution"].sub (Marge $X)',
    spyCA: 'overviewProducts[label="SPY"].value',
    spyMarge: 'overviewProducts[label="SPY"].sub (Marge $X)',
    ctCA: 'overviewProducts[label="Comment/Trust"].value',
    ctMarge: 'overviewProducts[label="Comment/Trust"].sub (Marge $X)',
  };

  return { base, raw, paths };
};

const sumThrough = (untilMonth: DigitMonthId): MonthlyBase => {
  const idx = DIGIT_AVAILABLE_MONTHS.findIndex((m) => m.id === untilMonth);
  return DIGIT_AVAILABLE_MONTHS.slice(0, idx + 1)
    .map((m) => extractMonthlyBaseWithSource(getDigitMonthData(m.id)).base)
    .reduce<MonthlyBase>(
      (acc, x) => ({
        ca: acc.ca + x.ca,
        marge: acc.marge + x.marge,
        deals: acc.deals + x.deals,
        digitCA: acc.digitCA + x.digitCA,
        digitMarge: acc.digitMarge + x.digitMarge,
        spyCA: acc.spyCA + x.spyCA,
        spyMarge: acc.spyMarge + x.spyMarge,
        ctCA: acc.ctCA + x.ctCA,
        ctMarge: acc.ctMarge + x.ctMarge,
      }),
      { ca: 0, marge: 0, deals: 0, digitCA: 0, digitMarge: 0, spyCA: 0, spyMarge: 0, ctCA: 0, ctMarge: 0 },
    );
};

/** Build the source breakdown rows used for an additive YTD indicator. */
export function buildBreakdown(untilMonth: DigitMonthId, field: BaseField): BreakdownRow[] {
  const idx = DIGIT_AVAILABLE_MONTHS.findIndex((m) => m.id === untilMonth);
  return DIGIT_AVAILABLE_MONTHS.slice(0, idx + 1).map((m) => {
    const src = extractMonthlyBaseWithSource(getDigitMonthData(m.id));
    return {
      month: m.id,
      monthLabel: m.label,
      value: src.base[field],
      sourcePath: src.paths[field],
      rawValue: src.raw[field],
    };
  });
}

const additiveCheck = (
  month: DigitMonthId,
  indicator: string,
  expected: number,
  actual: number,
  ytdSourcePath: string,
  field: BaseField,
  tolerance?: number,
): YTDValidationIssue | null => {
  const delta = actual - expected;
  // Relative tolerance: ignore drifts under max($500, 0.5% of expected) — rounding noise on
  // 6-figure YTD bases (e.g. $200 on a $183k figure) is not a real consistency issue.
  const effective = tolerance ?? Math.max(500, Math.abs(expected) * 0.005);
  if (Math.abs(delta) <= effective) return null;
  return {
    month,
    indicator,
    expected,
    actual,
    delta,
    kind: "additive",
    ytdSourcePath,
    breakdown: buildBreakdown(month, field),
  };
};

const averageCheck = (
  month: DigitMonthId,
  indicator: string,
  expected: number,
  actual: number,
  tolerance: number,
  ytdSourcePath: string,
  formula: string,
  contributingFields: BaseField[],
): YTDValidationIssue | null => {
  const delta = actual - expected;
  if (Math.abs(delta) <= tolerance) return null;
  const breakdown = contributingFields.flatMap((f) => buildBreakdown(month, f));
  return {
    month,
    indicator,
    expected,
    actual,
    delta,
    kind: "average",
    ytdSourcePath,
    breakdown,
    formula,
  };
};

/** Validate a single month's YTD block. Returns the list of issues (empty = OK). */
export function validateDigitYTDForMonth(month: DigitMonthId): YTDValidationIssue[] {
  const data = getDigitMonthData(month);
  const sum = sumThrough(month);
  const issues: YTDValidationIssue[] = [];

  const main = data.ytdMainKPIs;
  const productKPIs = data.ytdProductKPIs;

  const caYTD = parseMoney(findKPI(main, /CA Total YTD/i)?.value);
  const margeYTD = parseMoney(findKPI(main, /Marge Totale YTD/i)?.value);
  const tauxYTD = parsePercent(findKPI(main, /Taux de Marge/i)?.value);
  const ticketYTD = parseMoney(findKPI(main, /Ticket Moyen YTD/i)?.value);

  const ticketSub = findKPI(main, /Ticket Moyen YTD/i)?.sub ?? "";
  const dealsYTDDeclared = parseInteger(ticketSub.match(/Sur\s+([\d,]+)/i)?.[1] ?? "");

  const additive = [
    additiveCheck(month, "CA Total YTD", sum.ca, caYTD, 'ytdMainKPIs[label="CA Total YTD"].value', "ca"),
    additiveCheck(month, "Marge Totale YTD", sum.marge, margeYTD, 'ytdMainKPIs[label="Marge Totale YTD"].value', "marge"),
    additiveCheck(month, "Total Deals YTD", sum.deals, dealsYTDDeclared, 'ytdMainKPIs[label="Ticket Moyen YTD"].sub ("Sur N deals")', "deals"),
  ];

  const digitProd = findProduct(productKPIs, /Digit Solution/i);
  const spyProd = findProduct(productKPIs, /^SPY/i);
  const ctProd = findProduct(productKPIs, /Comment\/Trust/i);

  additive.push(
    additiveCheck(month, "YTD Digit Solution CA", sum.digitCA, parseMoney(digitProd?.value), 'ytdProductKPIs[label="Digit Solution"].value', "digitCA"),
    additiveCheck(month, "YTD Digit Solution Marge", sum.digitMarge, extractMargeFromSub(digitProd?.sub), 'ytdProductKPIs[label="Digit Solution"].sub (Marge $X)', "digitMarge"),
    additiveCheck(month, "YTD SPY CA", sum.spyCA, parseMoney(spyProd?.value), 'ytdProductKPIs[label="SPY"].value', "spyCA"),
    additiveCheck(month, "YTD SPY Marge", sum.spyMarge, extractMargeFromSub(spyProd?.sub), 'ytdProductKPIs[label="SPY"].sub (Marge $X)', "spyMarge"),
    additiveCheck(month, "YTD Comment/Trust CA", sum.ctCA, parseMoney(ctProd?.value), 'ytdProductKPIs[label="Comment/Trust"].value', "ctCA"),
    additiveCheck(month, "YTD Comment/Trust Marge", sum.ctMarge, extractMargeFromSub(ctProd?.sub), 'ytdProductKPIs[label="Comment/Trust"].sub (Marge $X)', "ctMarge"),
  );

  for (const i of additive) if (i) issues.push(i);

  if (caYTD > 0) {
    const expectedTaux = (margeYTD / caYTD) * 100;
    const issue = averageCheck(
      month,
      "Taux de Marge Moyen YTD",
      expectedTaux,
      tauxYTD,
      TOLERANCE_RATE,
      'ytdMainKPIs[label="Taux de Marge Moyen YTD"].value',
      "Marge Totale YTD / CA Total YTD × 100",
      ["ca", "marge"],
    );
    if (issue) issues.push(issue);
  }

  if (sum.deals > 0) {
    const expectedTicket = caYTD / sum.deals;
    const issue = averageCheck(
      month,
      "Ticket Moyen YTD",
      expectedTicket,
      ticketYTD,
      TOLERANCE_TICKET,
      'ytdMainKPIs[label="Ticket Moyen YTD"].value',
      "CA Total YTD / Total Deals YTD",
      ["ca", "deals"],
    );
    if (issue) issues.push(issue);
  }

  return issues;
}

export function validateAllDigitYTD(): YTDValidationIssue[] {
  return DIGIT_AVAILABLE_MONTHS.flatMap((m) => validateDigitYTDForMonth(m.id));
}

export function formatIssue(issue: YTDValidationIssue): string {
  return `[${issue.month}] ${issue.indicator} (${issue.kind}) — attendu ${issue.expected.toFixed(2)}, obtenu ${issue.actual.toFixed(2)}, écart ${issue.delta.toFixed(2)}`;
}
