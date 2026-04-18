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

export type DigitMonthData = typeof DIGIT_FEB;

export function getDigitMonthData(month: DigitMonthId): DigitMonthData {
  if (month === 'jan-2026') return DIGIT_JAN as DigitMonthData;
  if (month === 'mar-2026') return DIGIT_MAR as DigitMonthData;
  return DIGIT_FEB;
}
