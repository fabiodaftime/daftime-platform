// Digit Dashboard Data - Multi-Month Support

export type DigitMonthId = 'jan-2026' | 'feb-2026' | 'mar-2026';

export const DIGIT_AVAILABLE_MONTHS = [
  { id: 'jan-2026' as DigitMonthId, label: 'Janvier 2026' },
  { id: 'feb-2026' as DigitMonthId, label: 'Février 2026' },
  { id: 'mar-2026' as DigitMonthId, label: 'Mars 2026' },
];

export const D = {
  bg: "#F4F7FA", surface: "#FFFFFF", surfaceAlt: "#F4F7FA",
  border: "#CFD9DE", borderLight: "#B8C5CC",
  primary: "#1E56A0", primarySoft: "#E8F0FA",
  accent: "#1E56A0", accentSoft: "#E8F0FA",
  green: "#17B169", greenSoft: "#ECFDF5", greenText: "#16A34A",
  red: "#DC2626", redSoft: "#FEF2F2", redText: "#DC2626",
  orange: "#F59E0B", orangeSoft: "#FFFBEB", orangeText: "#D97706",
  purple: "#7C3AED", purpleSoft: "#F3F0FF",
  indigo: "#4A90D9",
  text: "#0F1419", textSecondary: "#536471", textMuted: "#8899A6",
  gold: "#C9A227",
  lavender: "#F4F7FA",
};

export const fmt = (n: number) => {
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
  return "$" + n;
};
export const fmtF = (n: number) => "$" + n.toLocaleString();

export const PIE_COLORS = [D.green, D.red, D.orange, D.purple, D.indigo, D.textMuted, "#9ca3af"];
export const REVENUE_PIE_COLORS = [D.primary, D.green, D.purple, D.orange, D.textMuted];
export const YTD_PRODUCT_COLORS = [D.primary, D.green, D.orange];

// ============ JANUARY 2026 ============
const DIGIT_JAN = {
  monthLabel: 'Janvier 2026',
  overviewKPIs: [
    { label: "CA Total", value: "$134,212", sub: "225 deals • Ticket moyen $596", type: "primary" },
    { label: "Marge Totale", value: "$45,992", sub: "34.3% du CA", type: "success" },
    { label: "Deals Janvier", value: "225", sub: "165 Setup • 41 Ad Account", type: "warning" },
    { label: "Taux de Marge", value: "34.3%", sub: "Performance globale", type: "accent" },
  ],
  overviewProducts: [
    { label: "Digit Solution (Core)", value: "$114,649", sub: "Marge $40,198 (35.1%)", type: "primary", chg: null as string | null },
    { label: "SPY", value: "$16,750", sub: "Marge $3,262", type: "success", chg: null as string | null },
    { label: "Comment/Trust", value: "$2,813", sub: "Marge $2,531", type: "warning", chg: null as string | null },
  ],
  overviewChartData: null as { labels: string[]; ca: number[]; marge: number[] } | null,
  comparisonM1: null as any[] | null,
  // Costs tab
  costsKPIs: [
    { label: "Provider Cost", value: "$29,708", sub: "22.1% du CA Global", type: "primary" },
    { label: "Cost Salary", value: "$25,366", sub: "18.9% du CA Global", type: "accent" },
    { label: "Business Expenses", value: "$0", sub: "0% du CA Global", type: "warning" },
    { label: "Total Cost", value: "$88,220", sub: "65.7% du CA Global", type: "success" },
  ],
  costsDetail: [
    { label: "Provider Cost", value: "$29,708" },
    { label: "To Blink", value: "$14,735" },
    { label: "Cost Salary", value: "$25,366" },
    { label: "Tools", value: "$422" },
    { label: "Referral", value: "$0" },
    { label: "Business Expenses", value: "$0" },
    { label: "Fees Bank/Crypto", value: "$1,177" },
    { label: "Refunds (Setup + Ad)", value: "$1,591" },
    { label: "Sales Salary (commissions)", value: "$3,896" },
  ],
  costsTotal: "$88,220",
  costsChartData: [29708, 14735, 25366, 0, 422, 1177, 4909],
  spyCostsKPIs: null as any[] | null,
  spyCostsBreakdown: null as any[] | null,
  spyCostsTotal: null as string | null,
  ctCostsKPIs: null as any[] | null,
  ctCostsBreakdown: null as any[] | null,
  ctCostsTotal: null as string | null,
  // Revenue tab
  revenueKPIs: [
    { label: "CA Setup", value: "$77,409", sub: "233 deals • $332/deal", type: "primary" },
    { label: "CA Ad Account", value: "$27,305", sub: "34 deals • $803/deal", type: "success" },
    { label: "CA SPY", value: "$16,750", sub: "Produit SPY", type: "accent" },
    { label: "CA Comment/Trust", value: "$2,813", sub: "Services annexes", type: "warning" },
  ],
  revenueComparison: null as { setup: string; ad: string; spy: string; ct: string } | null,
  revenueDistribution: [
    { name: "Setup", value: 77409 },
    { name: "Ad Account", value: 27305 },
    { name: "SPY", value: 16750 },
    { name: "Comment/Trust", value: 2813 },
  ],
  // Products tab
  digitCoreKPIs: [
    { label: "CA Global", value: "$114,649", sub: "267 deals (Setup + Ad Account)", type: "primary" },
    { label: "Company Margin", value: "$40,198", sub: "35.1% du CA", type: "success" },
    { label: "Setup", value: "$77,409", sub: "233 deals • $332/deal", type: "accent" },
    { label: "Ad Account", value: "$27,305", sub: "34 deals • $803/deal", type: "warning" },
  ],
  spyKPIs: [
    { label: "CA SPY", value: "$16,750", sub: "", type: "success", chg: null as string | null },
    { label: "Marge SPY", value: "$3,262", sub: "19.5% du CA SPY", type: "primary" },
  ],
  spyDetail: { jan: "$16,750", janMarge: "$3,263", feb: null as string | null, febMarge: null as string | null },
  ctKPIs: [
    { label: "CA Comment/Trust", value: "$2,813", sub: "", type: "warning", chg: null as string | null },
    { label: "Marge", value: "$2,531", sub: "90.0% du CA CT", type: "warning" },
  ],
  ctAlert: null as string | null,
  // YTD tab
  ytdMainKPIs: [
    { label: "CA Total YTD", value: "$134,212", sub: "1 mois • 225 deals" },
    { label: "Marge Totale YTD", value: "$45,992", sub: "34.3% du CA" },
    { label: "Taux de Marge Moyen", value: "34.3%", sub: "Performance globale YTD" },
    { label: "Ticket Moyen YTD", value: "$596", sub: "Sur 225 deals" },
  ],
  ytdMonthlyKPIs: [
    { label: "Janvier 2026", value: "$134,212", sub: "CA • 225 deals • Marge $45,992", type: "primary" },
  ],
  ytdProductKPIs: [
    { label: "Digit Solution", value: "$114,649", sub: "Marge $40,198 (35.1%)", type: "primary" },
    { label: "SPY", value: "$16,750", sub: "Marge $3,262", type: "success" },
    { label: "Comment/Trust", value: "$2,813", sub: "Marge $2,531", type: "warning" },
  ],
  ytdEvolutionData: [{ name: "Janvier", ca: 134212, marge: 45992 }],
  ytdProductDistribution: [
    { name: "Digit Solution", value: 114649 },
    { name: "SPY", value: 16750 },
    { name: "Comment/Trust", value: 2813 },
  ],
  // Evolution MoM tab
  evolutionKPIs: null as any[] | null,
  evolutionProductKPIs: null as any[] | null,
  evolutionChartData: null as number[] | null,
  evolutionInsights: null as { positives: string[]; warnings: string[]; conclusion: string } | null,
};

// ============ FEBRUARY 2026 ============
const DIGIT_FEB = {
  monthLabel: 'Février 2026',
  overviewKPIs: [
    { label: "CA Total", value: "$149,963", sub: "213 deals • Ticket moyen $704", type: "primary" },
    { label: "Marge Totale", value: "$46,948", sub: "31.3% du CA", type: "success" },
    { label: "Deals Février", value: "213", sub: "170 Setup • 43 Ad Account", type: "warning" },
    { label: "Taux de Marge", value: "31.3%", sub: "Performance globale", type: "accent" },
  ],
  overviewProducts: [
    { label: "Digit Solution (Core)", value: "$122,330", sub: "Marge $43,249 (35.4%)", type: "primary", chg: "+6.7%" },
    { label: "SPY", value: "$27,300", sub: "Marge $3,559", type: "success", chg: "+63.0%" },
    { label: "Comment/Trust", value: "$333", sub: "Marge $140", type: "warning", chg: "-88.2%" },
  ],
  overviewChartData: { labels: ['Janvier', 'Février'], ca: [134212, 149963], marge: [45992, 46948] },
  comparisonM1: [
    { label: "CA Janvier", value: "$134,212", sub: "225 deals", type: "primary" },
    { label: "Marge Janvier", value: "$45,992", sub: "34.3% du CA", type: "success" },
    { label: "Évolution CA", value: "+11.7%", sub: "+$15,751", type: "success" },
    { label: "Évolution Marge", value: "+2.1%", sub: "+$955", type: "success" },
  ] as any[] | null,
  // Costs tab
  costsKPIs: [
    { label: "Provider Cost", value: "$33,906", sub: "27.7% du CA Global", type: "primary" },
    { label: "Cost Salary", value: "$21,971", sub: "18.0% du CA Global", type: "accent" },
    { label: "Business Expenses", value: "$6,668", sub: "5.5% du CA Global", type: "warning" },
    { label: "Total Cost", value: "$76,425", sub: "62.5% du CA Global", type: "success" },
  ],
  costsDetail: [
    { label: "Provider Cost", value: "$33,906" },
    { label: "To Blink", value: "$12,912" },
    { label: "Cost Salary", value: "$21,971" },
    { label: "Tools", value: "$332" },
    { label: "Referral", value: "$75" },
    { label: "Business Expenses", value: "$6,668" },
    { label: "Fees Bank/Crypto", value: "$503" },
    { label: "Refunds (Setup + Ad)", value: "$59" },
    { label: "Sales Salary (commissions)", value: "$2,656" },
  ],
  costsTotal: "$76,425",
  costsChartData: [33906, 12912, 21971, 6668, 332, 503, 134],
  // SPY costs
  spyCostsKPIs: [
    { label: "CA SPY", value: "$27,300", sub: "Produit SPY", type: "primary" },
    { label: "Cost Product SPY", value: "$16,930", sub: "62.0% du CA SPY", type: "warning" },
    { label: "COM Blink SPY", value: "$5,527", sub: "20.2% du CA SPY", type: "accent" },
    { label: "Marge SPY", value: "$3,559", sub: "13.0% du CA SPY", type: "success" },
  ],
  spyCostsBreakdown: [
    { label: "CA SPY", value: "$27,300", negative: false },
    { label: "Cost Product", value: "-$16,930", negative: true },
    { label: "COM Blink", value: "-$5,527", negative: true },
    { label: "COM Sales", value: "-$1,285", negative: true },
  ],
  spyCostsTotal: "$3,559",
  // CT costs
  ctCostsKPIs: [
    { label: "CA Comment/Trust", value: "$333", sub: "Services annexes", type: "primary" },
    { label: "Cost Product CT", value: "$160", sub: "48.0% du CA CT", type: "warning" },
    { label: "COM Sales CT", value: "$33", sub: "10.0% du CA CT", type: "accent" },
    { label: "Marge CT", value: "$140", sub: "42.0% du CA CT", type: "success" },
  ],
  ctCostsBreakdown: [
    { label: "CA Comment/Trust", value: "$333", negative: false },
    { label: "Cost Product", value: "-$160", negative: true },
    { label: "COM Blink", value: "$0", negative: false },
    { label: "COM Sales", value: "-$33", negative: true },
  ],
  ctCostsTotal: "$140",
  // Revenue tab
  revenueKPIs: [
    { label: "CA Setup", value: "$79,141", sub: "170 deals • $465/deal", type: "primary" },
    { label: "CA Ad Account", value: "$25,309", sub: "43 deals • $588/deal", type: "success" },
    { label: "CA SPY", value: "$27,300", sub: "Produit SPY", type: "accent" },
    { label: "CA Comment/Trust", value: "$333", sub: "Services annexes", type: "warning" },
  ],
  revenueComparison: {
    setup: "$77,409 (Jan) → $79,141 (Fev) = +2.2%",
    ad: "$27,305 (Jan) → $25,309 (Fev) = -7.3%",
    spy: "$16,750 (Jan) → $27,300 (Fev) = +63.0% 🚀",
    ct: "$2,813 (Jan) → $333 (Fev) = -88.2% ⚠️",
  },
  revenueDistribution: [
    { name: "Setup", value: 79141 },
    { name: "Ad Account", value: 25309 },
    { name: "SPY", value: 27300 },
    { name: "Comment/Trust", value: 333 },
  ],
  // Products tab
  digitCoreKPIs: [
    { label: "CA Global", value: "$122,330", sub: "213 deals (Setup + Ad Account)", type: "primary" },
    { label: "Company Margin", value: "$43,249", sub: "35.4% du CA", type: "success" },
    { label: "Setup", value: "$79,141", sub: "170 deals • $465/deal", type: "accent" },
    { label: "Ad Account", value: "$25,309", sub: "43 deals • $588/deal", type: "warning" },
  ],
  spyKPIs: [
    { label: "CA SPY", value: "$27,300", sub: "", type: "success", chg: "+63.0%" },
    { label: "Marge SPY", value: "$3,559", sub: "13.0% du CA SPY", type: "primary" },
  ],
  spyDetail: { jan: "$16,750", janMarge: "$3,263", feb: "$27,300", febMarge: "$3,559" },
  ctKPIs: [
    { label: "CA Comment/Trust", value: "$333", sub: "", type: "warning", chg: "-88.2%" },
    { label: "Marge", value: "$140", sub: "42.0% du CA CT", type: "warning" },
  ],
  ctAlert: "Forte baisse du CA Comment/Trust en février (-88.2% vs janvier). Le CA est passé de $2,813 en janvier à seulement $333 en février. À surveiller de près.",
  // YTD tab
  ytdMainKPIs: [
    { label: "CA Total YTD", value: "$284,175", sub: "2 mois • 438 deals" },
    { label: "Marge Totale YTD", value: "$92,940", sub: "32.7% du CA" },
    { label: "Taux de Marge Moyen", value: "32.7%", sub: "Performance globale YTD" },
    { label: "Ticket Moyen YTD", value: "$649", sub: "Sur 438 deals" },
  ],
  ytdMonthlyKPIs: [
    { label: "Janvier 2026", value: "$134,212", sub: "CA • 225 deals • Marge $45,992", type: "primary" },
    { label: "Février 2026", value: "$149,963", sub: "CA • 213 deals • Marge $46,948", type: "success" },
    { label: "Croissance CA", value: "+11.7%", sub: "Février vs Janvier", type: "accent" },
    { label: "Croissance Marge", value: "+2.1%", sub: "Février vs Janvier", type: "warning" },
  ],
  ytdProductKPIs: [
    { label: "Digit Solution", value: "$244,660", sub: "Marge $83,447 (35.2%)", type: "primary" },
    { label: "SPY", value: "$44,050", sub: "Marge $6,822", type: "success" },
    { label: "Comment/Trust", value: "$3,146", sub: "Marge $2,671", type: "warning" },
  ],
  ytdEvolutionData: [
    { name: "Janvier", ca: 134212, marge: 45992 },
    { name: "Février", ca: 149963, marge: 46948 },
  ],
  ytdProductDistribution: [
    { name: "Digit Solution", value: 244660 },
    { name: "SPY", value: 44050 },
    { name: "Comment/Trust", value: 3146 },
  ],
  // Evolution MoM tab
  evolutionKPIs: [
    { label: "CA Total Growth", value: "+11.7%", sub: "+$15,751", detail: "Jan: $134,212 → Feb: $149,963", type: "primary" },
    { label: "Margin Growth", value: "+2.1%", sub: "+$955", detail: "Jan: $45,992 → Feb: $46,948", type: "success" },
    { label: "Deals Evolution", value: "-5.3%", sub: "-12 deals", detail: "Jan: 225 → Feb: 213", type: "warning" },
    { label: "Ticket Moyen Growth", value: "+18.1%", sub: "+$108", detail: "Jan: $596 → Feb: $704", type: "accent" },
  ],
  evolutionProductKPIs: [
    { label: "Digit Solution", value: "+6.7%", sub: "+$7,681", detail: "Jan: $114,649 → Feb: $122,330", type: "primary" },
    { label: "SPY Growth", value: "+63.0%", sub: "+$10,550 🚀", detail: "Jan: $16,750 → Feb: $27,300", type: "success" },
    { label: "Comment/Trust", value: "-88.2%", sub: "-$2,480 ⚠️", detail: "Jan: $2,813 → Feb: $333", type: "warning" },
  ],
  evolutionChartData: [11.7, 2.1, -5.3, 6.7, 63.0, -88.2],
  evolutionInsights: {
    positives: [
      "CA en hausse de 11.7% (+$15,751)",
      "SPY en forte croissance (+63%, +$10,550)",
      "Digit Solution en progression (+6.7%, +$7,681)",
      "Ticket moyen en augmentation (+18.1%, +$108)",
      "Marge totale en progression (+2.1%)",
    ],
    warnings: [
      "Nombre de deals en baisse (-5.3%, -12 deals)",
      "Comment/Trust en forte chute (-88.2%)",
    ],
    conclusion: "Performance globale positive portée par SPY et l'augmentation du ticket moyen, mais vigilance nécessaire sur le nombre de deals et la performance de Comment/Trust.",
  },
};

export type DigitMonthData = typeof DIGIT_FEB;

export function getDigitMonthData(month: DigitMonthId): DigitMonthData {
  return month === 'jan-2026' ? DIGIT_JAN as DigitMonthData : DIGIT_FEB;
}
