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

// Overview
export const overviewKPIs = [
  { label: "CA Total", value: "$149,963", sub: "Chiffre d'affaires", type: "primary" },
  { label: "Marge", value: "$45,992", sub: "KPI Principal", type: "success" },
  { label: "Taux de Marge", value: "31.3%", sub: "Marge / CA", type: "accent" },
  { label: "Nombre de Deals", value: "194", sub: "Total tous produits", type: "warning" },
  { label: "Setup", value: "151", sub: "80% des deals", type: "warning" },
  { label: "Ad Account", value: "43", sub: "12% des deals", type: "warning" },
  { label: "SPY", value: "5", sub: "2% des deals", type: "warning" },
  { label: "Comment/Trust", value: "20", sub: "7% des deals", type: "warning" },
];

// Comparaison M-1 (Janvier)
export const comparisonM1 = [
  { label: "CA Janvier", value: "$134,212", sub: "206 deals (165 Setup + 41 Ad Acc)", type: "primary" },
  { label: "Marge Janvier", value: "$45,992", sub: "34.3% du CA", type: "success" },
  { label: "Évolution CA", value: "+11.7%", sub: "+$15,751", type: "success" },
  { label: "Évolution Marge", value: "+2.1%", sub: "+$955", type: "success" },
];

export const waterfallOverview = [
  { label: "CA Total", value: 149963, color: "green" },
  { label: "Provider Cost", value: -33906, color: "red" },
  { label: "Blink Com", value: -14735, color: "orange" },
  { label: "Sales Com", value: -3896, color: "accent" },
  { label: "Spy Product", value: -11250, color: "indigo" },
  { label: "Cost Salary", value: -21971, color: "neutral" },
  { label: "Fees & Autres", value: -3265, color: "neutralLight" },
  { label: "Company Margin", value: 43249, color: "green" },
];

export const economicSplit = [
  { name: "Company Margin", value: 43249 },
  { name: "Provider Cost", value: 33906 },
  { name: "Blink Com", value: 14735 },
  { name: "Sales Com", value: 3896 },
  { name: "Spy Product", value: 11250 },
  { name: "Cost Salary", value: 21971 },
  { name: "Fees & Autres", value: 3265 },
];

export const chargesDetail = [
  { label: "Provider Cost", value: "$33,906", sub: "Coûts fournisseurs produits", color: D.red },
  { label: "Blink Commission", value: "$16,325", sub: "Global $12,922 + SPY $1,813", color: D.orange },
  { label: "Commission Sales", value: "$2,656", sub: "Global $2,656 + SPY $425 + CT $281", color: D.accent },
  { label: "Spy Cost Product", value: "$11,250", sub: "Licences outils SPY", color: D.indigo },
  { label: "Cost Salary", value: "$21,971", sub: "Salaires fixes équipe", color: D.textSecondary },
  { label: "Fees & Autres", value: "$3,265", sub: "Tools, Refunds, Business Exp, Referral", color: D.textMuted },
];

// Revenue
export const revenueKPIsRow1 = [
  { label: "CA Total", value: "$149,963", sub: "194 deals", type: "primary" },
  { label: "CA Set-up", value: "$79,141", sub: "58% | 151 deals", type: "success" },
  { label: "CA Ad Account", value: "$25,309", sub: "20% | 43 deals", type: "accent" },
  { label: "CA SPY", value: "$27,300", sub: "12% | 5 deals", type: "warning" },
];

export const revenueKPIsRow2 = [
  { label: "CA Comment/Trust", value: "$333", sub: "2% | 20 deals", type: "accent" },
  { label: "CA Autres Produits", value: "$9,935", sub: "7% (BM, Page, Gmail, etc.)", type: "warning" },
];

export const revenueByCategory = [
  { name: "Set-up", value: 77409 },
  { name: "Ad Account", value: 27305 },
  { name: "Spy", value: 27300 },
  { name: "BM", value: 5651 },
  { name: "Page", value: 2770 },
  { name: "Trust", value: 1560 },
  { name: "Comm", value: 1253 },
];

export const revenueDistribution = [
  { name: "Set-up (58%)", value: 77409 },
  { name: "Ad Account (20%)", value: 27305 },
  { name: "Spy (12%)", value: 27300 },
  { name: "BM (4%)", value: 5651 },
  { name: "Autres (6%)", value: 7097 },
];

// Costs
export const costsKPIs = [
  { label: "Provider Cost", value: "$33,906", sub: "22.1% du CA", type: "warning" },
  { label: "Blink Commission", value: "$16,325", sub: "12.2% (incl. refunds $1,591)", type: "accent" },
  { label: "Commission Sales", value: "$2,656", sub: "2.9% du CA", type: "success" },
  { label: "Marge", value: "$46,948", sub: "31.3% du CA", type: "primary" },
];

export const blinkDetail = [
  { label: "To Blink (Global)", value: "$12,922", sub: "Commission Digit Solution", type: "accent" },
  { label: "To Blink (SPY)", value: "$1,813", sub: "Commission SPY", type: "accent" },
  { label: "Refunds", value: "$1,591", sub: "Remboursements clients", type: "warning" },
  { label: "Total Blink", value: "$16,325", sub: "Blink + Refunds", type: "primary" },
];

export const fullWaterfall = [
  { label: "CA Total", value: 149963, color: "green" },
  { label: "Provider Cost", value: -33906, color: "red" },
  { label: "Blink Com", value: -14735, color: "orange" },
  { label: "Sales Com", value: -3896, color: "accent" },
  { label: "Spy Product", value: -11250, color: "indigo" },
  { label: "Cost Salary", value: -21971, color: "neutral" },
  { label: "Fees & Autres", value: -3265, color: "neutralLight" },
  { label: "Company Margin", value: 43249, color: "green" },
];

// Global Product (Digit Solution)
export const globalKPIs = [
  { label: "CA", value: "$122,330", sub: "CA Total Digit Solution", type: "primary" },
  { label: "Marge", value: "$43,249", sub: "35.4% du CA", type: "success" },
  { label: "Total Deals", value: "267", sub: "151 Setup + 43 Ad Account", type: "accent" },
  { label: "Dépense Moy. / Client Global", value: "$429", sub: "Moyenne générale", type: "warning" },
];

export const globalTicketMoyens = [
  { label: "Dépense Moy. / Client Setup", value: "$332", sub: "151 deals", type: "accent" },
  { label: "Dépense Moy. / Client Ad Account", value: "$803", sub: "43 deals", type: "accent" },
];

export const globalVariableCosts = [
  { label: "Provider Cost", value: "$33,906", sub: "25.9% du CA", type: "warning" },
  { label: "To Blink", value: "$12,922", sub: "11.3% du CA", type: "accent" },
  { label: "Commission Sales", value: "$2,656", sub: "2.8% du CA", type: "success" },
];

export const globalFixedCosts = [
  { label: "Cost Salary", value: "$21,971", sub: "Salaires fixes équipe", type: "indigo" },
  { label: "Tools", value: "$332", sub: "Logiciels & outils", type: "warning" },
  { label: "Business Expenses", value: "$6,668", sub: "Frais divers", type: "warning" },
  { label: "Fees Bank/Crypto", value: "$503", sub: "Frais bancaires & crypto", type: "warning" },
  { label: "Refunds", value: "$1,591", sub: "Remboursements clients", type: "warning" },
];

export const globalSynthesis = [
  { label: "CA", value: "$122,330", sub: "Chiffre d'affaires", type: "primary" },
  { label: "Total Cost", value: "$76,425", sub: "62.1% du CA", type: "warning" },
  { label: "Marge", value: "$43,249", sub: "35.4% du CA", type: "success" },
];

// SPY Product
export const spyKPIs = [
  { label: "CA SPY", value: "$27,300", sub: "Chiffre d'affaires", type: "primary" },
  { label: "Marge SPY", value: "$3,559", sub: "19.5% du CA", type: "success" },
  { label: "Total Deals", value: "5", sub: "Licences SPY", type: "accent" },
  { label: "Dépense Moy. / Client", value: "$3,350", sub: "CA / Deals", type: "warning" },
];

export const spyVariableCosts = [
  { label: "Cost Product", value: "$11,250", sub: "67.2% du CA", type: "warning" },
  { label: "COM Blink", value: "$1,812", sub: "10.8% du CA", type: "accent" },
  { label: "COM Sales", value: "$425", sub: "2.5% du CA", type: "success" },
];

export const spySynthesis = [
  { label: "CA", value: "$27,300", sub: "Chiffre d'affaires", type: "primary" },
  { label: "Total Cost", value: "$13,488", sub: "80.5% du CA", type: "warning" },
  { label: "Marge", value: "$3,559", sub: "19.5% du CA", type: "success" },
];

// Comment/Trust Product
export const commentTrustKPIs = [
  { label: "CA Comment/Trust", value: "$333", sub: "Chiffre d'affaires", type: "primary" },
  { label: "Marge", value: "$140", sub: "90.0% du CA", type: "success" },
  { label: "Total Deals", value: "20", sub: "16 Comment | 4 Trustpilot", type: "accent" },
  { label: "Dépense Moy. / Client", value: "$141", sub: "CA / Deals", type: "warning" },
];

export const commentVariableCosts = [
  { label: "Cost Product", value: "$0", sub: "Aucun coût produit", type: "warning" },
  { label: "COM Sales", value: "$281", sub: "10.0% du CA", type: "success" },
];

export const commentSynthesis = [
  { label: "CA", value: "$333", sub: "Chiffre d'affaires", type: "primary" },
  { label: "Total Cost", value: "$281", sub: "10.0% du CA", type: "warning" },
  { label: "Marge", value: "$140", sub: "90.0% du CA", type: "success" },
];

// YTD 2026 Data
export const ytdMainKPIs = [
  { label: "CA Total YTD", value: "$284,175", sub: "2 mois cumulés", type: "primary" },
  { label: "Marge Totale YTD", value: "$92,940", sub: "32.7% du CA", type: "success" },
  { label: "Taux de Marge Moyen", value: "32.7%", sub: "Performance globale", type: "accent" },
  { label: "Total Deals YTD", value: "400", sub: "316 Setup | 84 Ad Acc", type: "warning" },
];

export const ytdMonthlyKPIs = [
  { label: "Janvier 2026", value: "$134,212", sub: "CA • 206 deals • Marge $45,992 (34.3%)", type: "primary" },
  { label: "Février 2026", value: "$149,963", sub: "CA • 194 deals • Marge $46,948 (31.3%)", type: "primary" },
  { label: "Croissance CA", value: "+11.7%", sub: "Février vs Janvier • +$15,751", type: "success" },
  { label: "Ticket Moyen", value: "$710", sub: "YTD • Jan $652 → Fév $773", type: "warning" },
];

export const ytdProductKPIs = [
  { label: "Digit Solution", value: "$236,979", sub: "Marge $83,447 (35.2%) • 400 deals", type: "primary" },
  { label: "SPY", value: "$44,050", sub: "Marge $6,822 • 15.5%", type: "success" },
  { label: "Comment/Trust", value: "$3,146", sub: "Marge $2,671 • 84.9%", type: "warning" },
];

export const ytdEvolutionData = [
  { name: "Janvier", ca: 134212, marge: 45992 },
  { name: "Février", ca: 149963, marge: 46948 },
];

export const ytdProductDistribution = [
  { name: "Digit Solution", value: 236979 },
  { name: "SPY", value: 44050 },
  { name: "Comment/Trust", value: 3146 },
];

export const PIE_COLORS = [D.green, D.red, D.orange, D.accent, D.indigo, D.textMuted, "#9ca3af"];
export const REVENUE_PIE_COLORS = [D.primary, D.green, D.orange, D.accent, D.textMuted];
export const YTD_PRODUCT_COLORS = [D.primary, D.green, D.orange];
