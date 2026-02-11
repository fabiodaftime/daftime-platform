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
  { label: "Company Margin", value: "$48,454", sub: "KPI Principal", type: "primary" },
  { label: "Chiffre d'Affaires", value: "$134,212", sub: "Total facturé", type: "success" },
  { label: "Taux de Marge", value: "36.1%", sub: "Margin / CA", type: "accent" },
  { label: "Nombre de Deals", value: "267", sub: "Transactions", type: "warning" },
];

export const waterfallOverview = [
  { label: "CA Total", value: 134212, color: "green" },
  { label: "Provider Costs", value: -40958, color: "red" },
  { label: "Blink Com", value: -14112, color: "orange" },
  { label: "Sales Salary", value: -3896, color: "neutral" },
  { label: "Company Margin", value: 48454, color: "accent" },
];

export const economicSplit = [
  { name: "Company Margin", value: 48454 },
  { name: "Provider Costs", value: 40958 },
  { name: "Blink Com", value: 14112 },
  { name: "Sales Salary", value: 3896 },
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
  { label: "Provider Costs", value: -40958, color: "red" },
  { label: "Blink Com", value: -14112, color: "orange" },
  { label: "Sales Salary", value: -3896, color: "neutral" },
  { label: "Cost Salary", value: -25366, color: "indigo" },
  { label: "Company Margin", value: 48454, color: "accent" },
];

export const PIE_COLORS = [D.accent, D.red, D.orange, D.textMuted];
export const REVENUE_PIE_COLORS = [D.primary, D.green, D.orange, D.accent, D.textMuted];
