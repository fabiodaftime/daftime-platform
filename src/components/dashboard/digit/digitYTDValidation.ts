// Continuous validation for Digit YTD figures.
// Verifies for each available month that:
//   - Additive YTD indicators (CA, Marge, Deals, breakdowns by product) equal the
//     sum of monthly values from Jan up to the current month.
//   - Average YTD indicators are computed using the correct formula:
//       Taux de Marge Moyen YTD = Marge Totale YTD / CA Total YTD
//       Ticket Moyen YTD        = CA Total YTD / Total Deals YTD

import { DIGIT_AVAILABLE_MONTHS, getDigitMonthData, type DigitMonthId, type DigitMonthData } from "./DigitData";

export interface YTDValidationIssue {
  month: DigitMonthId;
  indicator: string;
  expected: number;
  actual: number;
  delta: number;
  kind: "additive" | "average";
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

/** Extract per-month base figures used as the source of truth for sums. */
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

const extractMonthlyBase = (data: DigitMonthData): MonthlyBase => {
  const caKPI = findKPI(data.overviewKPIs, /CA Total/i);
  const margeKPI = findKPI(data.overviewKPIs, /Marge Totale/i);
  const dealsKPI = findKPI(data.overviewKPIs, /^Deals\b/i);

  const digit = findProduct(data.overviewProducts, /Digit Solution/i);
  const spy = findProduct(data.overviewProducts, /^SPY/i);
  const ct = findProduct(data.overviewProducts, /Comment\/Trust/i);

  // Marge sub format: "Marge $40,198 (35.1%)" or "Marge $2,531"
  const extractMargeFromSub = (sub: string | null | undefined): number => {
    if (!sub) return 0;
    const m = sub.match(/Marge\s+\$?([\d,.\-]+)/i);
    return m ? parseMoney(m[1]) : 0;
  };

  return {
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
};

const sumThrough = (untilMonth: DigitMonthId): MonthlyBase => {
  const idx = DIGIT_AVAILABLE_MONTHS.findIndex((m) => m.id === untilMonth);
  const months = DIGIT_AVAILABLE_MONTHS.slice(0, idx + 1);
  return months
    .map((m) => extractMonthlyBase(getDigitMonthData(m.id)))
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

const checkAdditive = (
  month: DigitMonthId,
  indicator: string,
  expected: number,
  actual: number,
  tolerance = TOLERANCE_ABS,
): YTDValidationIssue | null => {
  const delta = actual - expected;
  if (Math.abs(delta) <= tolerance) return null;
  return { month, indicator, expected, actual, delta, kind: "additive" };
};

const checkAverage = (
  month: DigitMonthId,
  indicator: string,
  expected: number,
  actual: number,
  tolerance: number,
): YTDValidationIssue | null => {
  const delta = actual - expected;
  if (Math.abs(delta) <= tolerance) return null;
  return { month, indicator, expected, actual, delta, kind: "average" };
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

  // Deals from sub of Ticket Moyen YTD: "Sur 1,039 deals"
  const ticketSub = findKPI(main, /Ticket Moyen YTD/i)?.sub ?? "";
  const dealsYTDDeclared = parseInteger(ticketSub.match(/Sur\s+([\d,]+)/i)?.[1] ?? "");

  // === Additive checks ===
  const additive = [
    checkAdditive(month, "CA Total YTD", sum.ca, caYTD),
    checkAdditive(month, "Marge Totale YTD", sum.marge, margeYTD),
    checkAdditive(month, "Total Deals YTD (sub Ticket Moyen)", sum.deals, dealsYTDDeclared),
  ];

  const digitProd = findProduct(productKPIs, /Digit Solution/i);
  const spyProd = findProduct(productKPIs, /^SPY/i);
  const ctProd = findProduct(productKPIs, /Comment\/Trust/i);

  const extractProdMarge = (sub: string | null | undefined): number => {
    if (!sub) return 0;
    const m = sub.match(/Marge\s+\$?([\d,.\-]+)/i);
    return m ? parseMoney(m[1]) : 0;
  };

  additive.push(
    checkAdditive(month, "YTD Digit Solution CA", sum.digitCA, parseMoney(digitProd?.value)),
    checkAdditive(month, "YTD Digit Solution Marge", sum.digitMarge, extractProdMarge(digitProd?.sub)),
    checkAdditive(month, "YTD SPY CA", sum.spyCA, parseMoney(spyProd?.value)),
    checkAdditive(month, "YTD SPY Marge", sum.spyMarge, extractProdMarge(spyProd?.sub)),
    checkAdditive(month, "YTD Comment/Trust CA", sum.ctCA, parseMoney(ctProd?.value)),
    checkAdditive(month, "YTD Comment/Trust Marge", sum.ctMarge, extractProdMarge(ctProd?.sub)),
  );

  for (const i of additive) if (i) issues.push(i);

  // === Average checks ===
  // Taux de Marge Moyen YTD = Marge YTD / CA YTD * 100 (weighted by definition).
  if (caYTD > 0) {
    const expectedTaux = (margeYTD / caYTD) * 100;
    const issue = checkAverage(month, "Taux de Marge Moyen YTD", expectedTaux, tauxYTD, TOLERANCE_RATE);
    if (issue) issues.push(issue);
  }

  // Ticket Moyen YTD = CA YTD / Total Deals YTD
  if (sum.deals > 0) {
    const expectedTicket = caYTD / sum.deals;
    const issue = checkAverage(month, "Ticket Moyen YTD", expectedTicket, ticketYTD, TOLERANCE_TICKET);
    if (issue) issues.push(issue);
  }

  return issues;
}

/** Validate every available month. Returns the merged list of issues. */
export function validateAllDigitYTD(): YTDValidationIssue[] {
  return DIGIT_AVAILABLE_MONTHS.flatMap((m) => validateDigitYTDForMonth(m.id));
}

export function formatIssue(issue: YTDValidationIssue): string {
  return `[${issue.month}] ${issue.indicator} (${issue.kind}) — attendu ${issue.expected.toFixed(2)}, obtenu ${issue.actual.toFixed(2)}, écart ${issue.delta.toFixed(2)}`;
}
