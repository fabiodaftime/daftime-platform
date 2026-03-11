// Digit Dashboard Data - Multi-Month Support

export type DigitMonthId = 'jan-2026' | 'feb-2026';

export const DIGIT_AVAILABLE_MONTHS = [
  { id: 'jan-2026' as DigitMonthId, label: 'Janvier 2026' },
  { id: 'feb-2026' as DigitMonthId, label: 'Février 2026' },
];

export const D = {
  bg: "#f8f9fb", surface: "#FFFFFF", surfaceAlt: "#f8f9fb",
  border: "#eff1f5", borderLight: "#e5e7eb",
  primary: "#4F5BD5", primarySoft: "#f5f3ff",
  accent: "#D946A8", accentSoft: "#fde8f5",
  green: "#10b981", greenSoft: "#ecfdf5", greenText: "#059669",
  red: "#ef4444", redSoft: "#fef2f2", redText: "#dc2626",
  orange: "#f59e0b", orangeSoft: "#fffbeb", orangeText: "#d97706",
  indigo: "#6366f1",
  text: "#111827", textSecondary: "#6b7280", textMuted: "#9ca3af",
  lavender: "#f5f3ff",
};

export const fmt = (n: number) => {
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
  return "$" + n;
};
export const fmtF = (n: number) => "$" + n.toLocaleString();

export const PIE_COLORS = [D.green, D.red, D.orange, D.accent, D.indigo, D.textMuted, "#9ca3af"];
export const REVENUE_PIE_COLORS = [D.primary, D.green, D.orange, D.accent, D.textMuted];
export const YTD_PRODUCT_COLORS = [D.primary, D.green, D.orange];

// ============ JANUARY 2026 ============
const DIGIT_JAN = {
  monthLabel: 'Janvier 2026',
  overviewKPIs: [
    { label: "CA Total", value: "$134,212", sub: "Chiffre d'affaires", type: "primary" },
    { label: "Marge", value: "$45,992", sub: "KPI Principal", type: "success" },
    { label: "Taux de Marge", value: "34.3%", sub: "Marge / CA", type: "accent" },
    { label: "Nombre de Deals", value: "292", sub: "Total tous produits", type: "warning" },
    { label: "Setup", value: "233", sub: "80% des deals", type: "warning" },
    { label: "Ad Account", value: "34", sub: "12% des deals", type: "warning" },
    { label: "SPY", value: "5", sub: "2% des deals", type: "warning" },
    { label: "Comment/Trust", value: "20", sub: "7% des deals", type: "warning" },
  ],
  comparisonM1: null as any[] | null,
  waterfallOverview: [
    { label: "CA Total", value: 134212, color: "green" },
    { label: "Provider Cost", value: -29708, color: "red" },
    { label: "Blink Com", value: -14735, color: "orange" },
    { label: "Sales Com", value: -3896, color: "accent" },
    { label: "Spy Product", value: -11250, color: "indigo" },
    { label: "Cost Salary", value: -25366, color: "neutral" },
    { label: "Fees & Autres", value: -3265, color: "neutralLight" },
    { label: "Company Margin", value: 45992, color: "green" },
  ],
  economicSplit: [
    { name: "Company Margin", value: 45992 },
    { name: "Provider Cost", value: 29708 },
    { name: "Blink Com", value: 14735 },
    { name: "Sales Com", value: 3896 },
    { name: "Spy Product", value: 11250 },
    { name: "Cost Salary", value: 25366 },
    { name: "Fees & Autres", value: 3265 },
  ],
  chargesDetail: [
    { label: "Provider Cost", value: "$29,708", sub: "Coûts fournisseurs produits", color: D.red },
    { label: "Blink Commission", value: "$16,325", sub: "Global $12,922 + SPY $1,813", color: D.orange },
    { label: "Commission Sales", value: "$3,896", sub: "Global $3,190 + SPY $425 + CT $281", color: D.accent },
    { label: "Spy Cost Product", value: "$11,250", sub: "Licences outils SPY", color: D.indigo },
    { label: "Cost Salary", value: "$25,366", sub: "Salaires fixes équipe", color: D.textSecondary },
    { label: "Fees & Autres", value: "$3,265", sub: "Tools, Refunds, Business Exp, Referral", color: D.textMuted },
  ],
  revenueKPIsRow1: [
    { label: "CA Total", value: "$134,212", sub: "292 deals", type: "primary" },
    { label: "CA Set-up", value: "$77,409", sub: "58% | 233 deals", type: "success" },
    { label: "CA Ad Account", value: "$27,305", sub: "20% | 34 deals", type: "accent" },
    { label: "CA SPY", value: "$16,750", sub: "12% | 5 deals", type: "warning" },
  ],
  revenueKPIsRow2: [
    { label: "CA Comment/Trust", value: "$2,813", sub: "2% | 20 deals", type: "accent" },
    { label: "CA Autres Produits", value: "$9,935", sub: "7% (BM, Page, Gmail, etc.)", type: "warning" },
  ],
  revenueByCategory: [
    { name: "Set-up", value: 77409 },
    { name: "Ad Account", value: 27305 },
    { name: "Spy", value: 16750 },
    { name: "BM", value: 5651 },
    { name: "Page", value: 2770 },
    { name: "Trust", value: 1560 },
    { name: "Comm", value: 1253 },
  ],
  revenueDistribution: [
    { name: "Set-up (58%)", value: 77409 },
    { name: "Ad Account (20%)", value: 27305 },
    { name: "Spy (12%)", value: 16750 },
    { name: "BM (4%)", value: 5651 },
    { name: "Autres (6%)", value: 5583 },
  ],
  costsKPIs: [
    { label: "Provider Cost", value: "$29,708", sub: "22.1% du CA", type: "warning" },
    { label: "Blink Commission", value: "$16,325", sub: "12.2% (incl. refunds $1,591)", type: "accent" },
    { label: "Commission Sales", value: "$3,896", sub: "2.9% du CA", type: "success" },
    { label: "Marge", value: "$45,992", sub: "34.3% du CA", type: "primary" },
  ],
  blinkDetail: [
    { label: "To Blink (Global)", value: "$12,922", sub: "Commission Digit Solution", type: "accent" },
    { label: "To Blink (SPY)", value: "$1,813", sub: "Commission SPY", type: "accent" },
    { label: "Refunds", value: "$1,591", sub: "Remboursements clients", type: "warning" },
    { label: "Total Blink", value: "$16,325", sub: "Blink + Refunds", type: "primary" },
  ],
  fullWaterfall: [
    { label: "CA Total", value: 134212, color: "green" },
    { label: "Provider Cost", value: -29708, color: "red" },
    { label: "Blink Com", value: -14735, color: "orange" },
    { label: "Sales Com", value: -3896, color: "accent" },
    { label: "Spy Product", value: -11250, color: "indigo" },
    { label: "Cost Salary", value: -25366, color: "neutral" },
    { label: "Fees & Autres", value: -3265, color: "neutralLight" },
    { label: "Company Margin", value: 45992, color: "green" },
  ],
  globalKPIs: [
    { label: "CA", value: "$114,649", sub: "CA Total Digit Solution", type: "primary" },
    { label: "Marge", value: "$40,198", sub: "35.1% du CA", type: "success" },
    { label: "Total Deals", value: "267", sub: "233 Setup + 34 Ad Account", type: "accent" },
    { label: "Dépense Moy. / Client Global", value: "$429", sub: "Moyenne générale", type: "warning" },
  ],
  globalTicketMoyens: [
    { label: "Dépense Moy. / Client Setup", value: "$332", sub: "233 deals", type: "accent" },
    { label: "Dépense Moy. / Client Ad Account", value: "$803", sub: "34 deals", type: "accent" },
  ],
  globalVariableCosts: [
    { label: "Provider Cost", value: "$29,708", sub: "25.9% du CA", type: "warning" },
    { label: "To Blink", value: "$12,922", sub: "11.3% du CA", type: "accent" },
    { label: "Commission Sales", value: "$3,190", sub: "2.8% du CA", type: "success" },
  ],
  globalFixedCosts: [
    { label: "Cost Salary", value: "$25,366", sub: "Salaires fixes équipe", type: "indigo" },
    { label: "Tools", value: "$422", sub: "Logiciels & outils", type: "warning" },
    { label: "Business Expenses", value: "$0", sub: "Frais divers", type: "warning" },
    { label: "Fees Bank/Crypto", value: "$1,177", sub: "Frais bancaires & crypto", type: "warning" },
    { label: "Refunds", value: "$1,591", sub: "Remboursements clients", type: "warning" },
  ],
  globalSynthesis: [
    { label: "CA", value: "$114,649", sub: "Chiffre d'affaires", type: "primary" },
    { label: "Total Cost", value: "$71,261", sub: "62.1% du CA", type: "warning" },
    { label: "Marge", value: "$40,198", sub: "35.1% du CA", type: "success" },
  ],
  spyKPIs: [
    { label: "CA SPY", value: "$16,750", sub: "Chiffre d'affaires", type: "primary" },
    { label: "Marge SPY", value: "$3,262", sub: "19.5% du CA", type: "success" },
    { label: "Total Deals", value: "5", sub: "Licences SPY", type: "accent" },
    { label: "Dépense Moy. / Client", value: "$3,350", sub: "CA / Deals", type: "warning" },
  ],
  spyVariableCosts: [
    { label: "Cost Product", value: "$11,250", sub: "67.2% du CA", type: "warning" },
    { label: "COM Blink", value: "$1,812", sub: "10.8% du CA", type: "accent" },
    { label: "COM Sales", value: "$425", sub: "2.5% du CA", type: "success" },
  ],
  spySynthesis: [
    { label: "CA", value: "$16,750", sub: "Chiffre d'affaires", type: "primary" },
    { label: "Total Cost", value: "$13,488", sub: "80.5% du CA", type: "warning" },
    { label: "Marge", value: "$3,262", sub: "19.5% du CA", type: "success" },
  ],
  commentTrustKPIs: [
    { label: "CA Comment/Trust", value: "$2,813", sub: "Chiffre d'affaires", type: "primary" },
    { label: "Marge", value: "$2,531", sub: "90.0% du CA", type: "success" },
    { label: "Total Deals", value: "20", sub: "16 Comment | 4 Trustpilot", type: "accent" },
    { label: "Dépense Moy. / Client", value: "$141", sub: "CA / Deals", type: "warning" },
  ],
  commentVariableCosts: [
    { label: "Cost Product", value: "$0", sub: "Aucun coût produit", type: "warning" },
    { label: "COM Sales", value: "$281", sub: "10.0% du CA", type: "success" },
  ],
  commentSynthesis: [
    { label: "CA", value: "$2,813", sub: "Chiffre d'affaires", type: "primary" },
    { label: "Total Cost", value: "$281", sub: "10.0% du CA", type: "warning" },
    { label: "Marge", value: "$2,531", sub: "90.0% du CA", type: "success" },
  ],
  ytdMainKPIs: [
    { label: "CA Total YTD", value: "$134,212", sub: "1 mois", type: "primary" },
    { label: "Marge Totale YTD", value: "$45,992", sub: "34.3% du CA", type: "success" },
    { label: "Taux de Marge Moyen", value: "34.3%", sub: "Performance globale", type: "accent" },
    { label: "Total Deals YTD", value: "292", sub: "233 Setup | 34 Ad Acc | 5 SPY | 20 CT", type: "warning" },
  ],
  ytdMonthlyKPIs: [
    { label: "Janvier 2026", value: "$134,212", sub: "CA • 292 deals • Marge $45,992 (34.3%)", type: "primary" },
  ],
  ytdProductKPIs: [
    { label: "Digit Solution", value: "$114,649", sub: "Marge $40,198 (35.1%) • 267 deals", type: "primary" },
    { label: "SPY", value: "$16,750", sub: "Marge $3,262 • 19.5%", type: "success" },
    { label: "Comment/Trust", value: "$2,813", sub: "Marge $2,531 • 90.0%", type: "warning" },
  ],
  ytdEvolutionData: [{ name: "Janvier", ca: 134212, marge: 45992 }],
  ytdProductDistribution: [
    { name: "Digit Solution", value: 114649 },
    { name: "SPY", value: 16750 },
    { name: "Comment/Trust", value: 2813 },
  ],
};

// ============ FEBRUARY 2026 ============
const DIGIT_FEB = {
  monthLabel: 'Février 2026',
  overviewKPIs: [
    { label: "CA Total", value: "$149,963", sub: "Chiffre d'affaires", type: "primary" },
    { label: "Marge", value: "$45,992", sub: "KPI Principal", type: "success" },
    { label: "Taux de Marge", value: "31.3%", sub: "Marge / CA", type: "accent" },
    { label: "Nombre de Deals", value: "194", sub: "Total tous produits", type: "warning" },
    { label: "Setup", value: "151", sub: "80% des deals", type: "warning" },
    { label: "Ad Account", value: "43", sub: "12% des deals", type: "warning" },
    { label: "SPY", value: "5", sub: "2% des deals", type: "warning" },
    { label: "Comment/Trust", value: "20", sub: "7% des deals", type: "warning" },
  ],
  comparisonM1: [
    { label: "CA Janvier", value: "$134,212", sub: "206 deals (165 Setup + 41 Ad Acc)", type: "primary" },
    { label: "Marge Janvier", value: "$45,992", sub: "34.3% du CA", type: "success" },
    { label: "Évolution CA", value: "+11.7%", sub: "+$15,751", type: "success" },
    { label: "Évolution Marge", value: "+2.1%", sub: "+$955", type: "success" },
  ] as any[] | null,
  waterfallOverview: [
    { label: "CA Total", value: 149963, color: "green" },
    { label: "Provider Cost", value: -33906, color: "red" },
    { label: "Blink Com", value: -14735, color: "orange" },
    { label: "Sales Com", value: -3896, color: "accent" },
    { label: "Spy Product", value: -11250, color: "indigo" },
    { label: "Cost Salary", value: -21971, color: "neutral" },
    { label: "Fees & Autres", value: -3265, color: "neutralLight" },
    { label: "Company Margin", value: 43249, color: "green" },
  ],
  economicSplit: [
    { name: "Company Margin", value: 43249 },
    { name: "Provider Cost", value: 33906 },
    { name: "Blink Com", value: 14735 },
    { name: "Sales Com", value: 3896 },
    { name: "Spy Product", value: 11250 },
    { name: "Cost Salary", value: 21971 },
    { name: "Fees & Autres", value: 3265 },
  ],
  chargesDetail: [
    { label: "Provider Cost", value: "$33,906", sub: "Coûts fournisseurs produits", color: D.red },
    { label: "Blink Commission", value: "$16,325", sub: "Global $12,922 + SPY $1,813", color: D.orange },
    { label: "Commission Sales", value: "$2,656", sub: "Global $2,656 + SPY $425 + CT $281", color: D.accent },
    { label: "Spy Cost Product", value: "$11,250", sub: "Licences outils SPY", color: D.indigo },
    { label: "Cost Salary", value: "$21,971", sub: "Salaires fixes équipe", color: D.textSecondary },
    { label: "Fees & Autres", value: "$3,265", sub: "Tools, Refunds, Business Exp, Referral", color: D.textMuted },
  ],
  revenueKPIsRow1: [
    { label: "CA Total", value: "$149,963", sub: "194 deals", type: "primary" },
    { label: "CA Set-up", value: "$79,141", sub: "58% | 151 deals", type: "success" },
    { label: "CA Ad Account", value: "$25,309", sub: "20% | 43 deals", type: "accent" },
    { label: "CA SPY", value: "$27,300", sub: "12% | 5 deals", type: "warning" },
  ],
  revenueKPIsRow2: [
    { label: "CA Comment/Trust", value: "$333", sub: "2% | 20 deals", type: "accent" },
    { label: "CA Autres Produits", value: "$9,935", sub: "7% (BM, Page, Gmail, etc.)", type: "warning" },
  ],
  revenueByCategory: [
    { name: "Set-up", value: 77409 },
    { name: "Ad Account", value: 27305 },
    { name: "Spy", value: 27300 },
    { name: "BM", value: 5651 },
    { name: "Page", value: 2770 },
    { name: "Trust", value: 1560 },
    { name: "Comm", value: 1253 },
  ],
  revenueDistribution: [
    { name: "Set-up (58%)", value: 77409 },
    { name: "Ad Account (20%)", value: 27305 },
    { name: "Spy (12%)", value: 27300 },
    { name: "BM (4%)", value: 5651 },
    { name: "Autres (6%)", value: 7097 },
  ],
  costsKPIs: [
    { label: "Provider Cost", value: "$33,906", sub: "22.1% du CA", type: "warning" },
    { label: "Blink Commission", value: "$16,325", sub: "12.2% (incl. refunds $1,591)", type: "accent" },
    { label: "Commission Sales", value: "$2,656", sub: "2.9% du CA", type: "success" },
    { label: "Marge", value: "$46,948", sub: "31.3% du CA", type: "primary" },
  ],
  blinkDetail: [
    { label: "To Blink (Global)", value: "$12,922", sub: "Commission Digit Solution", type: "accent" },
    { label: "To Blink (SPY)", value: "$1,813", sub: "Commission SPY", type: "accent" },
    { label: "Refunds", value: "$1,591", sub: "Remboursements clients", type: "warning" },
    { label: "Total Blink", value: "$16,325", sub: "Blink + Refunds", type: "primary" },
  ],
  fullWaterfall: [
    { label: "CA Total", value: 149963, color: "green" },
    { label: "Provider Cost", value: -33906, color: "red" },
    { label: "Blink Com", value: -14735, color: "orange" },
    { label: "Sales Com", value: -3896, color: "accent" },
    { label: "Spy Product", value: -11250, color: "indigo" },
    { label: "Cost Salary", value: -21971, color: "neutral" },
    { label: "Fees & Autres", value: -3265, color: "neutralLight" },
    { label: "Company Margin", value: 43249, color: "green" },
  ],
  globalKPIs: [
    { label: "CA", value: "$122,330", sub: "CA Total Digit Solution", type: "primary" },
    { label: "Marge", value: "$43,249", sub: "35.4% du CA", type: "success" },
    { label: "Total Deals", value: "267", sub: "151 Setup + 43 Ad Account", type: "accent" },
    { label: "Dépense Moy. / Client Global", value: "$429", sub: "Moyenne générale", type: "warning" },
  ],
  globalTicketMoyens: [
    { label: "Dépense Moy. / Client Setup", value: "$332", sub: "151 deals", type: "accent" },
    { label: "Dépense Moy. / Client Ad Account", value: "$803", sub: "43 deals", type: "accent" },
  ],
  globalVariableCosts: [
    { label: "Provider Cost", value: "$33,906", sub: "25.9% du CA", type: "warning" },
    { label: "To Blink", value: "$12,922", sub: "11.3% du CA", type: "accent" },
    { label: "Commission Sales", value: "$2,656", sub: "2.8% du CA", type: "success" },
  ],
  globalFixedCosts: [
    { label: "Cost Salary", value: "$21,971", sub: "Salaires fixes équipe", type: "indigo" },
    { label: "Tools", value: "$332", sub: "Logiciels & outils", type: "warning" },
    { label: "Business Expenses", value: "$6,668", sub: "Frais divers", type: "warning" },
    { label: "Fees Bank/Crypto", value: "$503", sub: "Frais bancaires & crypto", type: "warning" },
    { label: "Refunds", value: "$1,591", sub: "Remboursements clients", type: "warning" },
  ],
  globalSynthesis: [
    { label: "CA", value: "$122,330", sub: "Chiffre d'affaires", type: "primary" },
    { label: "Total Cost", value: "$76,425", sub: "62.1% du CA", type: "warning" },
    { label: "Marge", value: "$43,249", sub: "35.4% du CA", type: "success" },
  ],
  spyKPIs: [
    { label: "CA SPY", value: "$27,300", sub: "Chiffre d'affaires", type: "primary" },
    { label: "Marge SPY", value: "$3,559", sub: "19.5% du CA", type: "success" },
    { label: "Total Deals", value: "5", sub: "Licences SPY", type: "accent" },
    { label: "Dépense Moy. / Client", value: "$3,350", sub: "CA / Deals", type: "warning" },
  ],
  spyVariableCosts: [
    { label: "Cost Product", value: "$11,250", sub: "67.2% du CA", type: "warning" },
    { label: "COM Blink", value: "$1,812", sub: "10.8% du CA", type: "accent" },
    { label: "COM Sales", value: "$425", sub: "2.5% du CA", type: "success" },
  ],
  spySynthesis: [
    { label: "CA", value: "$27,300", sub: "Chiffre d'affaires", type: "primary" },
    { label: "Total Cost", value: "$13,488", sub: "80.5% du CA", type: "warning" },
    { label: "Marge", value: "$3,559", sub: "19.5% du CA", type: "success" },
  ],
  commentTrustKPIs: [
    { label: "CA Comment/Trust", value: "$333", sub: "Chiffre d'affaires", type: "primary" },
    { label: "Marge", value: "$140", sub: "90.0% du CA", type: "success" },
    { label: "Total Deals", value: "20", sub: "16 Comment | 4 Trustpilot", type: "accent" },
    { label: "Dépense Moy. / Client", value: "$141", sub: "CA / Deals", type: "warning" },
  ],
  commentVariableCosts: [
    { label: "Cost Product", value: "$0", sub: "Aucun coût produit", type: "warning" },
    { label: "COM Sales", value: "$281", sub: "10.0% du CA", type: "success" },
  ],
  commentSynthesis: [
    { label: "CA", value: "$333", sub: "Chiffre d'affaires", type: "primary" },
    { label: "Total Cost", value: "$281", sub: "10.0% du CA", type: "warning" },
    { label: "Marge", value: "$140", sub: "90.0% du CA", type: "success" },
  ],
  ytdMainKPIs: [
    { label: "CA Total YTD", value: "$284,175", sub: "2 mois cumulés", type: "primary" },
    { label: "Marge Totale YTD", value: "$92,940", sub: "32.7% du CA", type: "success" },
    { label: "Taux de Marge Moyen", value: "32.7%", sub: "Performance globale", type: "accent" },
    { label: "Total Deals YTD", value: "400", sub: "316 Setup | 84 Ad Acc", type: "warning" },
  ],
  ytdMonthlyKPIs: [
    { label: "Janvier 2026", value: "$134,212", sub: "CA • 206 deals • Marge $45,992 (34.3%)", type: "primary" },
    { label: "Février 2026", value: "$149,963", sub: "CA • 194 deals • Marge $46,948 (31.3%)", type: "primary" },
    { label: "Croissance CA", value: "+11.7%", sub: "Février vs Janvier • +$15,751", type: "success" },
    { label: "Ticket Moyen", value: "$710", sub: "YTD • Jan $652 → Fév $773", type: "warning" },
  ],
  ytdProductKPIs: [
    { label: "Digit Solution", value: "$236,979", sub: "Marge $83,447 (35.2%) • 400 deals", type: "primary" },
    { label: "SPY", value: "$44,050", sub: "Marge $6,822 • 15.5%", type: "success" },
    { label: "Comment/Trust", value: "$3,146", sub: "Marge $2,671 • 84.9%", type: "warning" },
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
};

export type DigitMonthData = typeof DIGIT_FEB;

export function getDigitMonthData(month: DigitMonthId): DigitMonthData {
  return month === 'jan-2026' ? DIGIT_JAN as DigitMonthData : DIGIT_FEB;
}
