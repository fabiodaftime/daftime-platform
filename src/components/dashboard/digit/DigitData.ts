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
  { label: "CA Total", value: "$134,212", sub: "Chiffre d'affaires", type: "primary" },
  { label: "Marge", value: "$46,641", sub: "KPI Principal", type: "success" },
  { label: "Taux de Marge", value: "34.8%", sub: "Marge / CA", type: "accent" },
  { label: "Nombre de Deals", value: "292", sub: "Total tous produits", type: "warning" },
  { label: "Setup", value: "233", sub: "80% des deals", type: "warning" },
  { label: "Ad Account", value: "34", sub: "12% des deals", type: "warning" },
  { label: "SPY", value: "5", sub: "2% des deals", type: "warning" },
  { label: "Comment/Trust", value: "20", sub: "7% des deals", type: "warning" },
];

export const waterfallOverview = [
  { label: "CA Total", value: 134212, color: "green" },
  { label: "Provider Cost", value: -29708, color: "red" },
  { label: "Blink Com", value: -14735, color: "orange" },
  { label: "Sales Com", value: -3896, color: "accent" },
  { label: "Spy Product", value: -11250, color: "indigo" },
  { label: "Cost Salary", value: -25366, color: "neutral" },
  { label: "Business Expenses", value: -2616, color: "neutralLight" },
  { label: "Company Margin", value: 46641, color: "green" },
];

export const economicSplit = [
  { name: "Company Margin", value: 46641 },
  { name: "Provider Cost", value: 29708 },
  { name: "Blink Com", value: 14735 },
  { name: "Sales Com", value: 3896 },
  { name: "Spy Product", value: 11250 },
  { name: "Cost Salary", value: 25366 },
  { name: "Autres", value: 2616 },
];

export const chargesDetail = [
  { label: "Provider Cost", value: "$29,708", sub: "Coûts fournisseurs produits", color: D.red },
  { label: "Blink Commission", value: "$16,325", sub: "Global $12,922 + SPY $1,813", color: D.orange },
  { label: "Commission Sales", value: "$3,896", sub: "Global $3,190 + SPY $425 + CT $281", color: D.accent },
  { label: "Spy Cost Product", value: "$11,250", sub: "Licences outils SPY", color: D.indigo },
  { label: "Cost Salary", value: "$25,366", sub: "Salaires fixes équipe", color: D.textSecondary },
  { label: "Business Expenses", value: "$2,616", sub: "Tools, Refunds, Business Exp, Referral", color: D.textMuted },
];

// Revenue
export const revenueKPIsRow1 = [
  { label: "CA Total", value: "$134,212", sub: "292 deals", type: "primary" },
  { label: "CA Set-up", value: "$77,409", sub: "58% | 233 deals", type: "success" },
  { label: "CA Ad Account", value: "$27,305", sub: "20% | 34 deals", type: "accent" },
  { label: "CA SPY", value: "$16,750", sub: "12% | 5 deals", type: "warning" },
];

export const revenueKPIsRow2 = [
  { label: "CA Comment/Trust", value: "$2,813", sub: "2% | 20 deals", type: "accent" },
  { label: "CA Autres Produits", value: "$9,935", sub: "7% (BM, Page, Gmail, etc.)", type: "warning" },
];

export const revenueByCategory = [
  { name: "Set-up", value: 77409 },
  { name: "Ad Account", value: 27305 },
  { name: "Spy", value: 16750 },
  { name: "BM", value: 5651 },
  { name: "Page", value: 2770 },
  { name: "Trust", value: 1560 },
  { name: "Comm", value: 1253 },
];

export const revenueDistribution = [
  { name: "Set-up (58%)", value: 77409 },
  { name: "Ad Account (20%)", value: 27305 },
  { name: "Spy (12%)", value: 16750 },
  { name: "BM (4%)", value: 5651 },
  { name: "Autres (6%)", value: 7097 },
];

// Costs
export const costsKPIs = [
  { label: "Provider Cost", value: "$29,708", sub: "22.1% du CA", type: "warning" },
  { label: "Blink Commission", value: "$16,325", sub: "12.2% (incl. refunds $1,591)", type: "accent" },
  { label: "Commission Sales", value: "$3,896", sub: "2.9% du CA", type: "success" },
  { label: "Marge", value: "$46,641", sub: "34.8% du CA", type: "primary" },
];

export const blinkDetail = [
  { label: "To Blink (Global)", value: "$12,922", sub: "Commission Digit Solution", type: "accent" },
  { label: "To Blink (SPY)", value: "$1,813", sub: "Commission SPY", type: "accent" },
  { label: "Refunds", value: "$1,591", sub: "Remboursements clients", type: "warning" },
  { label: "Total Blink", value: "$16,325", sub: "Blink + Refunds", type: "primary" },
];

export const fullWaterfall = [
  { label: "CA Total", value: 134212, color: "green" },
  { label: "Provider Cost", value: -29708, color: "red" },
  { label: "Blink Com", value: -14735, color: "orange" },
  { label: "Sales Com", value: -3896, color: "accent" },
  { label: "Spy Product", value: -11250, color: "indigo" },
  { label: "Cost Salary", value: -25366, color: "neutral" },
  { label: "Business Expenses", value: -2616, color: "neutralLight" },
  { label: "Company Margin", value: 46641, color: "green" },
];

// Global Product (Digit Solution)
export const globalKPIs = [
  { label: "CA", value: "$114,649", sub: "CA Total Digit Solution", type: "primary" },
  { label: "Marge", value: "$40,848", sub: "35.6% du CA", type: "success" },
  { label: "Total Deals", value: "267", sub: "233 Setup + 34 Ad Account", type: "accent" },
  { label: "Dépense Moy. / Client Global", value: "$429", sub: "Moyenne générale", type: "warning" },
];

export const globalTicketMoyens = [
  { label: "Dépense Moy. / Client Setup", value: "$332", sub: "233 deals", type: "accent" },
  { label: "Dépense Moy. / Client Ad Account", value: "$803", sub: "34 deals", type: "accent" },
];

export const globalVariableCosts = [
  { label: "Provider Cost", value: "$29,708", sub: "25.9% du CA", type: "warning" },
  { label: "To Blink", value: "$12,922", sub: "11.3% du CA", type: "accent" },
  { label: "Commission Sales", value: "$3,190", sub: "2.8% du CA", type: "success" },
];

export const globalFixedCosts = [
  { label: "Cost Salary", value: "$25,366", sub: "Salaires fixes équipe", type: "indigo" },
  { label: "Tools", value: "$423", sub: "Logiciels & outils", type: "warning" },
  { label: "Business Expenses", value: "$528", sub: "Frais divers", type: "warning" },
  { label: "Refunds", value: "$1,591", sub: "Remboursements clients", type: "warning" },
];

export const globalSynthesis = [
  { label: "CA", value: "$114,649", sub: "Chiffre d'affaires", type: "primary" },
  { label: "Total Cost", value: "$70,612", sub: "61.6% du CA", type: "warning" },
  { label: "Marge", value: "$40,848", sub: "35.6% du CA", type: "success" },
];

// SPY Product
export const spyKPIs = [
  { label: "CA SPY", value: "$16,750", sub: "Chiffre d'affaires", type: "primary" },
  { label: "Marge SPY", value: "$3,262", sub: "19.5% du CA", type: "success" },
  { label: "Total Deals", value: "5", sub: "Licences SPY", type: "accent" },
  { label: "Dépense Moy. / Client", value: "$3,350", sub: "CA / Deals", type: "warning" },
];

export const spyVariableCosts = [
  { label: "Cost Product", value: "$11,250", sub: "67.2% du CA", type: "warning" },
  { label: "COM Blink", value: "$1,812", sub: "10.8% du CA", type: "accent" },
  { label: "COM Sales", value: "$425", sub: "2.5% du CA", type: "success" },
];

export const spySynthesis = [
  { label: "CA", value: "$16,750", sub: "Chiffre d'affaires", type: "primary" },
  { label: "Total Cost", value: "$13,488", sub: "80.5% du CA", type: "warning" },
  { label: "Marge", value: "$3,262", sub: "19.5% du CA", type: "success" },
];

// Comment/Trust Product
export const commentTrustKPIs = [
  { label: "CA Comment/Trust", value: "$2,813", sub: "Chiffre d'affaires", type: "primary" },
  { label: "Marge", value: "$2,531", sub: "90.0% du CA", type: "success" },
  { label: "Total Deals", value: "20", sub: "16 Comment | 4 Trustpilot", type: "accent" },
  { label: "Dépense Moy. / Client", value: "$141", sub: "CA / Deals", type: "warning" },
];

export const commentVariableCosts = [
  { label: "Cost Product", value: "$0", sub: "Aucun coût produit", type: "warning" },
  { label: "COM Sales", value: "$281", sub: "10.0% du CA", type: "success" },
];

export const commentSynthesis = [
  { label: "CA", value: "$2,813", sub: "Chiffre d'affaires", type: "primary" },
  { label: "Total Cost", value: "$281", sub: "10.0% du CA", type: "warning" },
  { label: "Marge", value: "$2,531", sub: "90.0% du CA", type: "success" },
];

export const PIE_COLORS = [D.green, D.red, D.orange, D.accent, D.indigo, D.textMuted, "#9ca3af"];
export const REVENUE_PIE_COLORS = [D.primary, D.green, D.orange, D.accent, D.textMuted];
