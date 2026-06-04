// Digit Dashboard Data - Multi-Month Support

export type DigitMonthId = 'jan-2026' | 'feb-2026' | 'mar-2026' | 'apr-2026' | 'may-2026';

export const DIGIT_AVAILABLE_MONTHS = [
  { id: 'jan-2026' as DigitMonthId, label: 'Janvier 2026' },
  { id: 'feb-2026' as DigitMonthId, label: 'Février 2026' },
  { id: 'mar-2026' as DigitMonthId, label: 'Mars 2026' },
  { id: 'apr-2026' as DigitMonthId, label: 'Avril 2026' },
  { id: 'may-2026' as DigitMonthId, label: 'Mai 2026' },
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
    { label: "Digit Solution", value: "$236,979", sub: "Marge $83,447 (35.2%)", type: "primary" },
    { label: "SPY", value: "$44,050", sub: "Marge $6,822", type: "success" },
    { label: "Comment/Trust", value: "$3,146", sub: "Marge $2,671", type: "warning" },
  ],
  ytdEvolutionData: [
    { name: "Janvier", ca: 134212, marge: 45992 },
    { name: "Février", ca: 149963, marge: 46948 },
  ],
  ytdProductDistribution: [
    { name: "Digit Solution", value: 236979 },
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

// ============ MARCH 2026 ============
const DIGIT_MAR = {
  monthLabel: 'Mars 2026',
  overviewKPIs: [
    { label: "CA Total", value: "$158,668", sub: "288 deals • Ticket moyen $551", type: "primary" },
    { label: "Marge Totale", value: "$61,832", sub: "39.0% du CA", type: "success" },
    { label: "Deals Mars", value: "288", sub: "239 Setup • 49 Ad Account", type: "warning" },
    { label: "Taux de Marge", value: "39.0%", sub: "Performance globale", type: "accent" },
  ],
  overviewProducts: [
    { label: "Digit Solution (Core)", value: "$120,458", sub: "Marge $57,659 (47.9%)", type: "primary", chg: "-1.5%" },
    { label: "SPY", value: "$37,350", sub: "Marge $3,470", type: "success", chg: "+36.8%" },
    { label: "Comment/Trust", value: "$861", sub: "Marge $703", type: "warning", chg: "+158.6%" },
  ],
  overviewChartData: { labels: ['Février', 'Mars'], ca: [149963, 158668], marge: [46948, 61832] },
  comparisonM1: [
    { label: "CA Février", value: "$149,963", sub: "213 deals", type: "primary" },
    { label: "Marge Février", value: "$46,948", sub: "31.3% du CA", type: "success" },
    { label: "Évolution CA", value: "+5.8%", sub: "+$8,705", type: "success" },
    { label: "Évolution Marge", value: "+31.7%", sub: "+$14,884", type: "success" },
  ] as any[] | null,
  // Costs tab
  costsKPIs: [
    { label: "Provider Cost", value: "$23,591", sub: "19.6% du CA Global", type: "primary" },
    { label: "Cost Salary", value: "$22,455", sub: "18.6% du CA Global", type: "accent" },
    { label: "Business Expenses", value: "$2,431", sub: "2.0% du CA Global", type: "warning" },
    { label: "Total Cost", value: "$60,740", sub: "50.4% du CA Global", type: "success" },
  ],
  costsDetail: [
    { label: "Provider Cost", value: "$23,591" },
    { label: "To Blink", value: "$8,752" },
    { label: "Cost Salary", value: "$22,455" },
    { label: "Tools", value: "$1,299" },
    { label: "Referral", value: "$0" },
    { label: "Business Expenses", value: "$2,431" },
    { label: "Fees Bank/Crypto", value: "$503" },
    { label: "Refunds (Setup + Ad)", value: "$91" },
    { label: "Sales Salary (commissions)", value: "$2,259" },
  ],
  costsTotal: "$60,740",
  costsChartData: [23591, 8752, 22455, 2431, 1299, 503, 91],
  // SPY costs
  spyCostsKPIs: [
    { label: "CA SPY", value: "$37,350", sub: "Produit SPY", type: "primary" },
    { label: "Cost Product SPY", value: "$28,400", sub: "76.0% du CA SPY", type: "warning" },
    { label: "COM Blink SPY", value: "$3,745", sub: "10.0% du CA SPY", type: "accent" },
    { label: "Marge SPY", value: "$3,470", sub: "9.3% du CA SPY", type: "success" },
  ],
  spyCostsBreakdown: [
    { label: "CA SPY", value: "$37,350", negative: false },
    { label: "Cost Product", value: "-$28,400", negative: true },
    { label: "COM Blink", value: "-$3,745", negative: true },
    { label: "COM Sales", value: "-$1,735", negative: true },
  ],
  spyCostsTotal: "$3,470",
  // CT costs
  ctCostsKPIs: [
    { label: "CA Comment/Trust", value: "$861", sub: "Services annexes", type: "primary" },
    { label: "Cost Product CT", value: "$120", sub: "13.9% du CA CT", type: "warning" },
    { label: "COM Sales CT", value: "$37", sub: "4.3% du CA CT", type: "accent" },
    { label: "Marge CT", value: "$703", sub: "81.7% du CA CT", type: "success" },
  ],
  ctCostsBreakdown: [
    { label: "CA Comment/Trust", value: "$861", negative: false },
    { label: "Cost Product", value: "-$120", negative: true },
    { label: "COM Blink", value: "$0", negative: false },
    { label: "COM Sales", value: "-$37", negative: true },
  ],
  ctCostsTotal: "$703",
  // Revenue tab
  revenueGlobalKPIs: [
    { label: "Digit Solution", value: "$120,458", sub: "288 deals • 75.9% du CA total", type: "primary" },
    { label: "SPY", value: "$37,350", sub: "23.5% du CA total", type: "success" },
    { label: "Comment/Trust", value: "$861", sub: "0.5% du CA total", type: "warning" },
    { label: "CA Total", value: "$158,668", sub: "3 produits", type: "accent" },
  ],
  revenueDetailKPIs: [
    { label: "Setup", value: "$93,426", sub: "239 deals • $391/deal", type: "primary" },
    { label: "Ad Account", value: "$16,469", sub: "49 deals • $336/deal", type: "success" },
    { label: "Page", value: "$2,310", sub: "Pages Facebook", type: "accent" },
    { label: "BM", value: "$6,403", sub: "Business Manager", type: "warning" },
    { label: "Gmail / Proxy", value: "$550", sub: "Comptes Gmail & Proxy", type: "primary" },
    { label: "Gas Fees", value: "$1,201", sub: "Frais blockchain", type: "success" },
    { label: "Profils FB", value: "$100", sub: "Profils Facebook", type: "accent" },
  ],
  revenueKPIs: [
    { label: "CA Setup", value: "$93,426", sub: "239 deals • $391/deal", type: "primary" },
    { label: "CA Ad Account", value: "$16,469", sub: "49 deals • $336/deal", type: "success" },
    { label: "CA SPY", value: "$37,350", sub: "23.5% du CA total", type: "accent" },
    { label: "CA Comment/Trust", value: "$861", sub: "0.5% du CA total", type: "warning" },
  ],
  revenueComparison: {
    setup: "$79,141 (Fév) → $93,426 (Mar) = +18.0% 🚀",
    ad: "$25,309 (Fév) → $16,469 (Mar) = -34.9%",
    spy: "$27,300 (Fév) → $37,350 (Mar) = +36.8% 🚀",
    ct: "$333 (Fév) → $861 (Mar) = +158.2% 🚀",
    page: "$2,392 (Fév) → $2,310 (Mar) = -3.4%",
    bm: "$12,290 (Fév) → $6,403 (Mar) = -47.9%",
  },
  revenueDistribution: [
    { name: "Setup", value: 93426 },
    { name: "Ad Account", value: 16469 },
    { name: "SPY", value: 37350 },
    { name: "Comment/Trust", value: 861 },
  ],
  // Products tab
  digitCoreKPIs: [
    { label: "CA Global", value: "$120,458", sub: "288 deals (Setup + Ad Account)", type: "primary" },
    { label: "Company Margin", value: "$57,659", sub: "47.9% du CA", type: "success" },
    { label: "Setup", value: "$93,426", sub: "239 deals • $391/deal", type: "accent" },
    { label: "Ad Account", value: "$16,469", sub: "49 deals • $336/deal", type: "warning" },
  ],
  spyKPIs: [
    { label: "CA SPY", value: "$37,350", sub: "", type: "success", chg: "+36.8%" },
    { label: "Marge SPY", value: "$3,470", sub: "9.3% du CA SPY", type: "primary" },
  ],
  spyDetail: { jan: "$16,750", janMarge: "$3,263", feb: "$27,300", febMarge: "$3,559", mar: "$37,350", marMarge: "$3,470" },
  ctKPIs: [
    { label: "CA Comment/Trust", value: "$861", sub: "", type: "warning", chg: "+158.6%" },
    { label: "Marge", value: "$703", sub: "81.7% du CA CT", type: "warning" },
  ],
  ctAlert: null as string | null,
  // YTD tab
  ytdMainKPIs: [
    { label: "CA Total YTD", value: "$442,843", sub: "3 mois • 726 deals" },
    { label: "Marge Totale YTD", value: "$154,772", sub: "35.0% du CA" },
    { label: "Taux de Marge Moyen", value: "35.0%", sub: "Performance globale YTD" },
    { label: "Ticket Moyen YTD", value: "$610", sub: "Sur 726 deals" },
  ],
  ytdMonthlyKPIs: [
    { label: "Janvier 2026", value: "$134,212", sub: "CA • 225 deals • Marge $45,992", type: "primary" },
    { label: "Février 2026", value: "$149,963", sub: "CA • 213 deals • Marge $46,948", type: "success" },
    { label: "Mars 2026", value: "$158,668", sub: "CA • 288 deals • Marge $61,832", type: "accent" },
    { label: "Moyenne Mensuelle Q1", value: "$147,614", sub: "CA moyen • 242 deals/mois", type: "warning" },
  ],
  ytdProductKPIs: [
    { label: "Digit Solution", value: "$357,437", sub: "Marge $141,106 (39.5%)", type: "primary" },
    { label: "SPY", value: "$81,400", sub: "Marge $10,292", type: "success" },
    { label: "Comment/Trust", value: "$4,007", sub: "Marge $3,374", type: "warning" },
  ],
  ytdEvolutionData: [
    { name: "Janvier", ca: 134212, marge: 45992 },
    { name: "Février", ca: 149963, marge: 46948 },
    { name: "Mars", ca: 158668, marge: 61832 },
  ],
  ytdProductDistribution: [
    { name: "Digit Solution", value: 357437 },
    { name: "SPY", value: 81400 },
    { name: "Comment/Trust", value: 4007 },
  ],
  // Evolution MoM tab
  evolutionKPIs: [
    { label: "CA Total Growth", value: "+5.8%", sub: "+$8,705", detail: "Fév: $149,963 → Mar: $158,668", type: "primary" },
    { label: "Margin Growth", value: "+31.7%", sub: "+$14,884", detail: "Fév: $46,948 → Mar: $61,832", type: "success" },
    { label: "Deals Evolution", value: "+35.2%", sub: "+75 deals", detail: "Fév: 213 → Mar: 288", type: "warning" },
    { label: "Ticket Moyen Growth", value: "-21.7%", sub: "-$153", detail: "Fév: $704 → Mar: $551", type: "accent" },
  ],
  evolutionProductKPIs: [
    { label: "Digit Solution", value: "-1.5%", sub: "-$1,872", detail: "Fév: $122,330 → Mar: $120,458", type: "primary" },
    { label: "SPY Growth", value: "+36.8%", sub: "+$10,050 🚀", detail: "Fév: $27,300 → Mar: $37,350", type: "success" },
    { label: "Comment/Trust", value: "+158.6%", sub: "+$528 🚀", detail: "Fév: $333 → Mar: $861", type: "success" },
  ],
  evolutionChartData: [5.8, 31.7, 35.2, -1.5, 36.8, 158.6],
  evolutionInsights: {
    positives: [
      "CA en hausse de 5.8% (+$8,705)",
      "Marge exceptionnelle +31.7% (+$14,884) 🚀",
      "Taux de marge record : 39.0% (meilleur du Q1)",
      "SPY en forte croissance (+36.8%, +$10,050)",
      "Comment/Trust rebond spectaculaire (+158.6%)",
      "Deals en forte hausse +35.2% (+75 deals)",
    ],
    warnings: [
      "Ticket moyen en baisse -21.7% (normal avec hausse volume)",
      "Digit légèrement en baisse -1.5% (-$1,872)",
    ],
    conclusion: "Meilleur mois du Q1 en marge (39.0%). La hausse du volume de deals (+75) compense la baisse du ticket moyen. SPY et Comment/Trust retrouvent une dynamique positive.",
  },
};

// ============ APRIL 2026 ============
const DIGIT_APR = {
  monthLabel: 'Avril 2026',
  overviewKPIs: [
    { label: "CA Total", value: "$151,889", sub: "313 deals • Ticket moyen $485", type: "primary" },
    { label: "Marge Totale", value: "$45,709", sub: "30.1% du CA", type: "success" },
    { label: "Deals Avril", value: "313", sub: "265 Setup • 48 Ad Account", type: "warning" },
    { label: "Taux de Marge", value: "30.1%", sub: "Performance globale", type: "accent" },
  ],
  overviewProducts: [
    { label: "Digit Solution (Core)", value: "$113,001", sub: "Marge $42,347 (37.5%)", type: "primary", chg: "-6.2%" },
    { label: "SPY", value: "$38,450", sub: "Marge $3,098", type: "success", chg: "+2.9%" },
    { label: "Comment/Trust", value: "$438", sub: "Marge $264", type: "warning", chg: "-49.1%" },
  ],
  overviewChartData: { labels: ['Mars', 'Avril'], ca: [158668, 151889], marge: [61832, 45709] },
  comparisonM1: [
    { label: "CA Mars", value: "$158,668", sub: "288 deals", type: "primary" },
    { label: "Marge Mars", value: "$61,832", sub: "39.0% du CA", type: "success" },
    { label: "Évolution CA", value: "-4.3%", sub: "-$6,779", type: "warning" },
    { label: "Évolution Marge", value: "-26.1%", sub: "-$16,123", type: "warning" },
  ] as any[] | null,
  // Costs tab
  costsKPIs: [
    { label: "Provider Cost", value: "$23,536", sub: "19.6% du CA Global", type: "primary" },
    { label: "Cost Salary", value: "$23,967", sub: "18.6% du CA Global", type: "accent" },
    { label: "Business Expenses", value: "$2,452", sub: "2.2% du CA Global", type: "warning" },
    { label: "Total Cost", value: "$68,634", sub: "60.7% du CA Global", type: "success" },
  ],
  // ⚠️ Détail Charges Digit : valeurs reprises du HTML source (qui contenait des chiffres de Mars).
  // Total recalculé à partir des KPIs Avril ($68,634).
  costsDetail: [
    { label: "Provider Cost", value: "$23,536" },
    { label: "To Blink", value: "$10,241" },
    { label: "Cost Salary", value: "$23,967" },
    { label: "Tools", value: "$1,128" },
    { label: "Referral", value: "$0" },
    { label: "Business Expenses", value: "$2,452" },
    { label: "Fees Bank/Crypto", value: "$609" },
    { label: "Refunds (Setup + Ad)", value: "$42" },
    { label: "Sales Salary (commissions)", value: "$2,238" },
  ],
  costsTotal: "$68,634",
  costsChartData: [23536, 10241, 23967, 2452, 1128, 609, 42],
  // SPY costs
  spyCostsKPIs: [
    { label: "CA SPY", value: "$38,450", sub: "Produit SPY", type: "primary" },
    { label: "Cost Product SPY", value: "$25,500", sub: "66.3% du CA SPY", type: "warning" },
    { label: "COM Blink SPY", value: "$8,173", sub: "21.3% du CA SPY", type: "accent" },
    { label: "Marge SPY", value: "$3,098", sub: "8.1% du CA SPY", type: "success" },
  ],
  spyCostsBreakdown: [
    { label: "CA SPY", value: "$38,450", negative: false },
    { label: "Cost Product", value: "-$25,500", negative: true },
    { label: "COM Blink", value: "-$8,173", negative: true },
    { label: "COM Sales", value: "-$1,679", negative: true },
  ],
  spyCostsTotal: "$3,098",
  // CT costs
  ctCostsKPIs: [
    { label: "CA Comment/Trust", value: "$438", sub: "Services annexes", type: "primary" },
    { label: "Cost Product CT", value: "$174", sub: "39.7% du CA CT", type: "warning" },
    { label: "COM Sales CT", value: "$0", sub: "0.0% du CA CT", type: "accent" },
    { label: "Marge CT", value: "$264", sub: "60.3% du CA CT", type: "success" },
  ],
  ctCostsBreakdown: [
    { label: "CA Comment/Trust", value: "$438", negative: false },
    { label: "Cost Product", value: "-$174", negative: true },
    { label: "COM Blink", value: "$0", negative: false },
    { label: "COM Sales", value: "$0", negative: false },
  ],
  ctCostsTotal: "$264",
  // Revenue tab
  revenueGlobalKPIs: [
    { label: "Digit Solution", value: "$113,001", sub: "313 deals • 74.4% du CA total", type: "primary" },
    { label: "SPY", value: "$38,450", sub: "25.3% du CA total", type: "success" },
    { label: "Comment/Trust", value: "$438", sub: "0.3% du CA total", type: "warning" },
    { label: "CA Total", value: "$151,889", sub: "3 produits", type: "accent" },
  ],
  revenueDetailKPIs: [
    { label: "Setup", value: "$87,142", sub: "265 deals • $329/deal", type: "primary" },
    { label: "Ad Account", value: "$18,772", sub: "48 deals • $391/deal", type: "success" },
    { label: "Page", value: "$1,617", sub: "Pages Facebook", type: "accent" },
    { label: "BM", value: "$3,000", sub: "Business Manager", type: "warning" },
    { label: "Gmail / Proxy", value: "$0", sub: "Comptes Gmail & Proxy", type: "primary" },
    { label: "Gas Fees", value: "$2,285", sub: "Frais blockchain", type: "success" },
    { label: "Profils FB", value: "$185", sub: "Profils Facebook", type: "accent" },
  ],
  revenueKPIs: [
    { label: "CA Setup", value: "$87,142", sub: "265 deals • $329/deal", type: "primary" },
    { label: "CA Ad Account", value: "$18,772", sub: "48 deals • $391/deal", type: "success" },
    { label: "CA SPY", value: "$38,450", sub: "25.3% du CA total", type: "accent" },
    { label: "CA Comment/Trust", value: "$438", sub: "0.3% du CA total", type: "warning" },
  ],
  revenueComparison: {
    setup: "$93,426 (Mar) → $87,142 (Avr) = -6.7%",
    ad: "$16,469 (Mar) → $18,772 (Avr) = +14.0%",
    spy: "$37,350 (Mar) → $38,450 (Avr) = +2.9% 🚀",
    ct: "$861 (Mar) → $438 (Avr) = -49.1%",
    page: "$2,310 (Mar) → $1,617 (Avr) = -30.0%",
    bm: "$6,403 (Mar) → $3,000 (Avr) = -53.1%",
  },
  revenueDistribution: [
    { name: "Setup", value: 87142 },
    { name: "Ad Account", value: 18772 },
    { name: "SPY", value: 38450 },
    { name: "Comment/Trust", value: 438 },
  ],
  // Products tab
  digitCoreKPIs: [
    { label: "CA Global", value: "$113,001", sub: "313 deals (Setup + Ad Account)", type: "primary" },
    { label: "Company Margin", value: "$42,347", sub: "37.5% du CA", type: "success" },
    { label: "Setup", value: "$87,142", sub: "265 deals • $329/deal", type: "accent" },
    { label: "Ad Account", value: "$18,772", sub: "48 deals • $391/deal", type: "warning" },
  ],
  spyKPIs: [
    { label: "CA SPY", value: "$38,450", sub: "", type: "success", chg: "+2.9%" },
    { label: "Marge SPY", value: "$3,098", sub: "8.1% du CA SPY", type: "primary" },
  ],
  spyDetail: { jan: "$16,750", janMarge: "$3,263", feb: "$27,300", febMarge: "$3,559", mar: "$37,350", marMarge: "$3,470", apr: "$38,450", aprMarge: "$3,098" } as any,
  ctKPIs: [
    { label: "CA Comment/Trust", value: "$438", sub: "", type: "warning", chg: "-49.1%" },
    { label: "Marge", value: "$264", sub: "60.3% du CA CT", type: "warning" },
  ],
  ctAlert: "Comment/Trust en repli marqué (-49.1% vs Mars). À surveiller." as string | null,
  // YTD tab (Jan + Fév + Mars + Avril)
  ytdMainKPIs: [
    { label: "CA Total YTD", value: "$594,732", sub: "4 mois • 1,039 deals" },
    { label: "Marge Totale YTD", value: "$200,481", sub: "33.7% du CA" },
    { label: "Taux de Marge Moyen", value: "33.7%", sub: "Performance globale YTD" },
    { label: "Ticket Moyen YTD", value: "$572", sub: "Sur 1,039 deals" },
  ],
  ytdMonthlyKPIs: [
    { label: "Janvier 2026", value: "$134,212", sub: "CA • 225 deals • Marge $45,992", type: "primary" },
    { label: "Février 2026", value: "$149,963", sub: "CA • 213 deals • Marge $46,948", type: "success" },
    { label: "Mars 2026", value: "$158,668", sub: "CA • 288 deals • Marge $61,832", type: "accent" },
    { label: "Avril 2026", value: "$151,889", sub: "CA • 313 deals • Marge $45,709", type: "warning" },
  ],
  ytdProductKPIs: [
    { label: "Digit Solution", value: "$470,438", sub: "Marge $183,252 (38.9%)", type: "primary" },
    { label: "SPY", value: "$119,850", sub: "Marge $13,390", type: "success" },
    { label: "Comment/Trust", value: "$4,445", sub: "Marge $3,638", type: "warning" },
  ],
  ytdEvolutionData: [
    { name: "Janvier", ca: 134212, marge: 45992 },
    { name: "Février", ca: 149963, marge: 46948 },
    { name: "Mars", ca: 158668, marge: 61832 },
    { name: "Avril", ca: 151889, marge: 45709 },
  ],
  ytdProductDistribution: [
    { name: "Digit Solution", value: 470438 },
    { name: "SPY", value: 119850 },
    { name: "Comment/Trust", value: 4445 },
  ],
  // Evolution MoM tab (Avril vs Mars)
  evolutionKPIs: [
    { label: "CA Total Growth", value: "-4.3%", sub: "-$6,779", detail: "Mar: $158,668 → Avr: $151,889", type: "warning" },
    { label: "Margin Growth", value: "-26.1%", sub: "-$16,123", detail: "Mar: $61,832 → Avr: $45,709", type: "warning" },
    { label: "Deals Evolution", value: "+8.7%", sub: "+25 deals", detail: "Mar: 288 → Avr: 313", type: "success" },
    { label: "Ticket Moyen Growth", value: "-12.0%", sub: "-$66", detail: "Mar: $551 → Avr: $485", type: "accent" },
  ],
  evolutionProductKPIs: [
    { label: "Digit Solution", value: "-6.2%", sub: "-$7,457", detail: "Mar: $120,458 → Avr: $113,001", type: "warning" },
    { label: "SPY Growth", value: "+2.9%", sub: "+$1,100 🚀", detail: "Mar: $37,350 → Avr: $38,450", type: "success" },
    { label: "Comment/Trust", value: "-49.1%", sub: "-$423", detail: "Mar: $861 → Avr: $438", type: "warning" },
  ],
  evolutionChartData: [-4.3, -26.1, 8.7, -6.2, 2.9, -49.1],
  evolutionInsights: {
    positives: [
      "Deals record : +8.7% (+25 deals, total 313) 🚀",
      "SPY en croissance continue : +2.9% (+$1,100)",
    ],
    warnings: [
      "CA en baisse : -4.3% (-$6,779) malgré la hausse du volume",
      "Marge en forte baisse : -26.1% (-$16,123)",
      "Taux de marge : 30.1% (vs 39.0% en Mars)",
      "Ticket moyen : -12.0% ($485 vs $551)",
      "Digit : -6.2% (-$7,457)",
      "Comment/Trust : -49.1% (-$423)",
    ],
    conclusion: "Volume de deals au plus haut mais érosion marquée du ticket moyen et de la marge. Vigilance requise sur la profitabilité d'Avril.",
  },
};

// ============ MAY 2026 ============
// Source: 🟪 Recap_Finance_2026 (9).xlsx — feuille DATA bloc "May 2026" (lignes 247-305).
// SPY : la donnée source agrège Digit + SPY, mais SUR NOS DASHBOARDS SPY est toujours
// affichée comme entité séparée. Pour Mai, SPY = N/A (donnée non transmise séparément).
const DIGIT_MAY = {
  monthLabel: 'Mai 2026',
  overviewKPIs: [
    { label: "CA Total", value: "$103,409", sub: "350 deals • Ticket moyen $295", type: "primary" },
    { label: "Marge Totale", value: "$30,319", sub: "29.3% du CA", type: "success" },
    { label: "Deals Mai", value: "350", sub: "282 Setup • 68 Ad Account", type: "warning" },
    { label: "Taux de Marge", value: "29.3%", sub: "Performance globale", type: "accent" },
  ],
  overviewProducts: [
    { label: "Digit Solution (Core + SPY)", value: "$102,920", sub: "Marge $30,039 (29.2%) • SPY intégré", type: "primary", chg: "-8.9%" },
    { label: "SPY", value: "Intégré", sub: "Inclus dans Digit Solution depuis Mai", type: "success", chg: null as string | null },
    { label: "Comment/Trust", value: "$489", sub: "Marge $280 (57.3%)", type: "warning", chg: "+11.7%" },
  ],
  overviewChartData: { labels: ['Avril', 'Mai'], ca: [151889, 103409], marge: [45709, 30319] },
  comparisonM1: [
    { label: "CA Avril", value: "$151,889", sub: "313 deals", type: "primary" },
    { label: "Marge Avril", value: "$45,709", sub: "30.1% du CA", type: "success" },
    { label: "Évolution CA", value: "-31.9%", sub: "-$48,480", type: "warning" },
    { label: "Évolution Marge", value: "-33.7%", sub: "-$15,390", type: "warning" },
  ] as any[] | null,
  costsKPIs: [
    { label: "Provider Cost", value: "$28,583", sub: "27.8% du CA Core", type: "primary" },
    { label: "Cost Salary", value: "$23,724", sub: "23.0% du CA Core", type: "accent" },
    { label: "Business Expenses", value: "$6,632", sub: "6.4% du CA Core", type: "warning" },
    { label: "Total Cost", value: "$70,794", sub: "68.8% du CA Core", type: "success" },
  ],
  costsDetail: [
    { label: "Provider Cost", value: "$28,583" },
    { label: "To Blink", value: "$6,605" },
    { label: "Cost Salary", value: "$23,724" },
    { label: "Tools", value: "$618" },
    { label: "Referral", value: "$225" },
    { label: "Business Expenses", value: "$6,632" },
    { label: "Fees Bank/Crypto", value: "$773" },
    { label: "Refunds (Setup + Ad)", value: "$3,350" },
    { label: "Sales Salary (commissions)", value: "$2,088" },
  ],
  costsTotal: "$70,794",
  costsChartData: [28583, 6605, 23724, 6632, 618, 773, 3350],
  spyCostsKPIs: null as any[] | null,
  spyCostsBreakdown: null as any[] | null,
  spyCostsTotal: null as string | null,
  ctCostsKPIs: [
    { label: "CA Comment/Trust", value: "$489", sub: "Services annexes", type: "primary" },
    { label: "Cost Product CT", value: "$172", sub: "35.2% du CA CT", type: "warning" },
    { label: "COM Sales CT", value: "$37", sub: "7.6% du CA CT", type: "accent" },
    { label: "Marge CT", value: "$280", sub: "57.3% du CA CT", type: "success" },
  ],
  ctCostsBreakdown: [
    { label: "CA Comment/Trust", value: "$489", negative: false },
    { label: "Cost Product", value: "-$172", negative: true },
    { label: "COM Blink", value: "$0", negative: false },
    { label: "COM Sales", value: "-$37", negative: true },
  ],
  ctCostsTotal: "$280",
  revenueGlobalKPIs: [
    { label: "Digit Solution (incl. SPY)", value: "$102,920", sub: "350 deals • 99.5% du CA total", type: "primary" },
    { label: "SPY", value: "Intégré", sub: "Inclus dans Digit Solution depuis Mai", type: "success" },
    { label: "Comment/Trust", value: "$489", sub: "0.5% du CA total", type: "warning" },
    { label: "CA Total", value: "$103,409", sub: "Core (incl. SPY) + Comment", type: "accent" },
  ],
  revenueDetailKPIs: [
    { label: "Setup", value: "$80,701", sub: "282 deals • $286/deal", type: "primary" },
    { label: "Ad Account", value: "$16,467", sub: "68 deals • $242/deal", type: "success" },
    { label: "Page", value: "$1,184", sub: "Pages Facebook", type: "accent" },
    { label: "BM", value: "$1,719", sub: "Business Manager", type: "warning" },
    { label: "Gmail / Proxy", value: "$0", sub: "Comptes Gmail & Proxy", type: "primary" },
    { label: "Gas Fees", value: "$932", sub: "Frais blockchain", type: "success" },
    { label: "Profils FB", value: "$95", sub: "Profils Facebook", type: "accent" },
  ],
  revenueKPIs: [
    { label: "CA Setup", value: "$80,701", sub: "282 deals • $286/deal", type: "primary" },
    { label: "CA Ad Account", value: "$16,467", sub: "68 deals • $242/deal", type: "success" },
    { label: "CA SPY", value: "Intégré", sub: "Inclus dans Digit Solution", type: "accent" },
    { label: "CA Comment/Trust", value: "$489", sub: "0.5% du CA total", type: "warning" },
  ],
  revenueComparison: {
    setup: "$87,142 (Avr) → $80,701 (Mai) = -7.4%",
    ad: "$18,772 (Avr) → $16,467 (Mai) = -12.3%",
    spy: "$38,450 (Avr, séparé) → intégré dans Digit Solution (Mai)",
    ct: "$438 (Avr) → $489 (Mai) = +11.7%",
    page: "$1,617 (Avr) → $1,184 (Mai) = -26.8%",
    bm: "$3,000 (Avr) → $1,719 (Mai) = -42.7%",
  },
  revenueDistribution: [
    { name: "Setup", value: 80701 },
    { name: "Ad Account", value: 16467 },
    { name: "Comment/Trust", value: 489 },
  ],
  digitCoreKPIs: [
    { label: "CA Global", value: "$102,920", sub: "350 deals (Setup + Ad Account, SPY intégré)", type: "primary" },
    { label: "Company Margin", value: "$30,039", sub: "29.2% du CA", type: "success" },
    { label: "Setup", value: "$80,701", sub: "282 deals • $286/deal", type: "accent" },
    { label: "Ad Account", value: "$16,467", sub: "68 deals • $242/deal", type: "warning" },
  ],
  spyKPIs: [
    { label: "SPY", value: "Intégré", sub: "Inclus dans Digit Solution depuis Mai 2026", type: "success", chg: null as string | null },
    { label: "Marge SPY", value: "—", sub: "Plus de remontée séparée", type: "accent" },
  ],
  spyDetail: { jan: "$16,750", janMarge: "$3,263", feb: "$27,300", febMarge: "$3,559", mar: "$37,350", marMarge: "$3,470", apr: "$38,450", aprMarge: "$3,098", may: "Intégré", mayMarge: "Intégré" } as any,
  ctKPIs: [
    { label: "CA Comment/Trust", value: "$489", sub: "", type: "warning", chg: "+11.7%" },
    { label: "Marge", value: "$280", sub: "57.3% du CA CT", type: "warning" },
  ],
  ctAlert: "SPY : à partir de Mai 2026, l'activité SPY est intégrée dans Digit Solution (plus de remontée séparée)." as string | null,
  // YTD (Jan→Mai) — SPY séparé Jan→Avr puis intégré dans Digit Solution à partir de Mai
  ytdMainKPIs: [
    { label: "CA Total YTD", value: "$698,141", sub: "5 mois • 1,389 deals" },
    { label: "Marge Totale YTD", value: "$230,800", sub: "33.1% du CA" },
    { label: "Taux de Marge Moyen", value: "33.1%", sub: "Performance globale YTD" },
    { label: "Ticket Moyen YTD", value: "$503", sub: "Sur 1,389 deals" },
  ],
  ytdMonthlyKPIs: [
    { label: "Janvier 2026", value: "$134,212", sub: "CA • 225 deals • Marge $45,992", type: "primary" },
    { label: "Février 2026", value: "$149,963", sub: "CA • 213 deals • Marge $46,948", type: "success" },
    { label: "Mars 2026", value: "$158,668", sub: "CA • 288 deals • Marge $61,832", type: "accent" },
    { label: "Avril 2026", value: "$151,889", sub: "CA • 313 deals • Marge $45,709", type: "warning" },
    { label: "Mai 2026", value: "$103,409", sub: "CA • 350 deals • Marge $30,319 (SPY intégré)", type: "primary" },
  ],
  ytdProductKPIs: [
    { label: "Digit Solution", value: "$573,358", sub: "Marge $213,291 (37.2%) • SPY intégré dès Mai", type: "primary" },
    { label: "SPY (séparé Jan→Avr)", value: "$119,850", sub: "Marge $13,390 — intégré dans Digit dès Mai", type: "success" },
    { label: "Comment/Trust", value: "$4,934", sub: "Marge $3,918", type: "warning" },
  ],
  ytdEvolutionData: [
    { name: "Janvier", ca: 134212, marge: 45992 },
    { name: "Février", ca: 149963, marge: 46948 },
    { name: "Mars", ca: 158668, marge: 61832 },
    { name: "Avril", ca: 151889, marge: 45709 },
    { name: "Mai", ca: 103409, marge: 30319 },
  ],
  ytdProductDistribution: [
    { name: "Digit Solution", value: 573358 },
    { name: "SPY", value: 119850 },
    { name: "Comment/Trust", value: 4934 },
  ],
  evolutionKPIs: [
    { label: "CA Total Growth", value: "-31.9%", sub: "-$48,480", detail: "Avr: $151,889 → Mai: $103,409 (SPY intégré)", type: "warning" },
    { label: "Margin Growth", value: "-33.7%", sub: "-$15,390", detail: "Avr: $45,709 → Mai: $30,319", type: "warning" },
    { label: "Deals Evolution", value: "+11.8%", sub: "+37 deals", detail: "Avr: 313 → Mai: 350", type: "success" },
    { label: "Ticket Moyen Growth", value: "-39.2%", sub: "-$190", detail: "Avr: $485 → Mai: $295", type: "warning" },
  ],
  evolutionProductKPIs: [
    { label: "Digit Solution", value: "-8.9%", sub: "-$10,081", detail: "Avr: $113,001 → Mai: $102,920 (SPY intégré)", type: "warning" },
    { label: "SPY", value: "Intégré", sub: "Plus de remontée séparée dès Mai", detail: "Avr: $38,450 (séparé) → Mai: intégré Digit", type: "success" },
    { label: "Comment/Trust", value: "+11.7%", sub: "+$51", detail: "Avr: $438 → Mai: $489", type: "success" },
  ],
  evolutionChartData: [-31.9, -33.7, 11.8, -8.9, 0, 11.7],
  evolutionInsights: {
    positives: [
      "Volume deals +11.8% (+37 deals, total 350) — record du Q2",
      "Comment/Trust en reprise (+11.7%)",
      "SPY désormais intégré dans Digit Solution (pilotage unifié)",
    ],
    warnings: [
      "CA Digit Solution -8.9% (-$10,081) sur Mai (SPY intégré)",
      "Marge en forte baisse (-33.7%)",
      "Ticket moyen au plus bas ($295 vs $485 en Avril)",
    ],
    conclusion: "Mois plus difficile sur Digit Solution (érosion ticket moyen malgré volume). SPY est désormais intégré dans Digit Solution — pilotage unifié à partir de Mai 2026.",
  },
};

export type DigitMonthData = typeof DIGIT_FEB;

export function getDigitMonthData(month: DigitMonthId): DigitMonthData {
  if (month === 'jan-2026') return DIGIT_JAN as DigitMonthData;
  if (month === 'mar-2026') return DIGIT_MAR as DigitMonthData;
  if (month === 'apr-2026') return DIGIT_APR as DigitMonthData;
  if (month === 'may-2026') return DIGIT_MAY as DigitMonthData;
  return DIGIT_FEB;
}
