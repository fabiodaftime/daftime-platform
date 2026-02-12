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
  { label: "Company Margin", value: "$46,641", sub: "KPI Principal", type: "primary" },
  { label: "Chiffre d'Affaires", value: "$134,212", sub: "Total facturé", type: "success" },
  { label: "Taux de Marge", value: "34.8%", sub: "Margin / CA", type: "accent" },
  { label: "Nombre de Deals", value: "267", sub: "Transactions", type: "warning" },
];

export const waterfallOverview = [
  { label: "CA Total", value: 134212, color: "green" },
  { label: "Provider Cost", value: -29708, color: "red" },
  { label: "Blink Com", value: -14735, color: "orange" },
  { label: "Sales Com", value: -3896, color: "accent" },
  { label: "Spy Product", value: -11250, color: "indigo" },
  { label: "Cost Salary", value: -25366, color: "neutral" },
  { label: "Autres Charges", value: -2616, color: "neutralLight" },
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
  { label: "Blink Commission", value: "$14,735", sub: "Global $12,922 + SPY $1,813", color: D.orange },
  { label: "Sales Commission", value: "$3,896", sub: "Global $3,190 + SPY $425 + CT $281", color: D.accent },
  { label: "Spy Cost Product", value: "$11,250", sub: "Licences outils SPY", color: D.indigo },
  { label: "Cost Salary", value: "$25,366", sub: "Salaires fixes équipe", color: D.textSecondary },
  { label: "Autres Charges", value: "$2,616", sub: "Tools, Refunds, Business Exp, Referral", color: D.textMuted },
];

// Revenue
export const revenueKPIs = [
  { label: "CA Total", value: "$134,212", sub: "267 deals", type: "primary" },
  { label: "Ticket Moyen", value: "$503", sub: "CA / Nombre de deals", type: "success" },
  { label: "Top Produit", value: "$77,409", sub: "Set-up (58% du CA)", type: "accent" },
  { label: "CA Récurrent", value: "20%", sub: "Ad Account + Spy", type: "warning" },
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
  { label: "Provider Costs", value: "$40,958", sub: "30.5% du CA", type: "warning" },
  { label: "Blink Commission", value: "$14,112", sub: "10.5% du CA", type: "accent" },
  { label: "Sales Salary", value: "$3,896", sub: "2.9% du CA", type: "success" },
  { label: "Coûts Variables", value: "$58,966", sub: "Total variables", type: "primary" },
];

export const costsKPIs2 = [
  { label: "Cost Salary (Fixe)", value: "$25,366", sub: "Salaires mensuels", type: "indigo" },
  { label: "Coûts Totaux", value: "$84,332", sub: "Variables + Fixes", type: "primary" },
  { label: "Profit Net Final", value: "$23,088", sub: "17.2% du CA", type: "success" },
];

export const fullWaterfall = [
  { label: "CA Total", value: 134212, color: "green" },
  { label: "Provider Cost", value: -29708, color: "red" },
  { label: "Blink Com", value: -14735, color: "orange" },
  { label: "Sales Com", value: -3896, color: "accent" },
  { label: "Spy Product", value: -11250, color: "indigo" },
  { label: "Cost Salary", value: -25366, color: "neutral" },
  { label: "Autres Charges", value: -2616, color: "neutralLight" },
  { label: "Company Margin", value: 46641, color: "green" },
];

// Global Product
export const globalKPIs = [
  { label: "Gross Amount", value: "$114,649", sub: "CA Total Global", type: "primary" },
  { label: "Company Margin", value: "$40,848", sub: "35.6% du CA", type: "success" },
  { label: "Total Deals", value: "267", sub: "233 Setup + 34 Ad Account", type: "accent" },
  { label: "Ticket Moyen", value: "$429", sub: "CA / Deals", type: "warning" },
];

export const globalVariableCosts = [
  { label: "Provider Cost", value: "$29,708", sub: "25.9% du CA", type: "warning" },
  { label: "To Blink", value: "$12,922", sub: "11.3% du CA", type: "accent" },
  { label: "Sales Salary", value: "$3,190", sub: "2.8% du CA", type: "success" },
];

export const globalFixedCosts = [
  { label: "Cost Salary", value: "$25,366", sub: "Salaires fixes équipe", type: "indigo" },
  { label: "Tools", value: "$423", sub: "Logiciels & outils", type: "warning" },
  { label: "Business Expenses", value: "$528", sub: "Frais divers", type: "warning" },
  { label: "Refunds", value: "$1,591", sub: "Remboursements clients", type: "warning" },
];

export const globalSynthesis = [
  { label: "Total Cost", value: "$70,612", sub: "61.6% du CA", type: "primary" },
  { label: "Company Margin", value: "$40,848", sub: "35.6% du CA", type: "success" },
];

// SPY Product
export const spyKPIs = [
  { label: "CA SPY", value: "$16,750", sub: "Chiffre d'affaires", type: "primary" },
  { label: "Margin SPY", value: "$3,262", sub: "19.5% du CA", type: "success" },
  { label: "Cost Product", value: "$11,250", sub: "67.2% du CA", type: "warning" },
  { label: "Total Commissions", value: "$2,238", sub: "Blink + Sales", type: "accent" },
];

export const spyCommissions = [
  { label: "COM Blink", value: "$1,812", sub: "10.8% du CA", type: "accent" },
  { label: "COM Sales", value: "$425", sub: "2.5% du CA", type: "success" },
];

// Comment/Trust Product
export const commentTrustKPIs = [
  { label: "CA Comment/Trust", value: "$2,813", sub: "Chiffre d'affaires", type: "primary" },
  { label: "Margin", value: "$2,531", sub: "90.0% du CA", type: "success" },
  { label: "Cost Product", value: "$0", sub: "Aucun coût produit", type: "warning" },
  { label: "COM Sales", value: "$281", sub: "10.0% du CA", type: "accent" },
];

export const marginComparison = [
  { label: "Marge Comment/Trust", value: "90.0%", sub: "La plus élevée", color: D.green },
  { label: "Marge SPY", value: "19.5%", sub: "Impactée par coûts", color: D.orange },
  { label: "Marge Global", value: "35.6%", sub: "Setup + Ad Account", color: D.primary },
];

export const PIE_COLORS = [D.green, D.red, D.orange, D.accent, D.indigo, D.textMuted, "#9ca3af"];
export const REVENUE_PIE_COLORS = [D.primary, D.green, D.orange, D.accent, D.textMuted];
