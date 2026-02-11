export const C = {
  bg: "#F7F8FC", surface: "#FFFFFF", surfaceAlt: "#F0F1F8", card: "#FFFFFF",
  border: "#E4E6F1", borderLight: "#EDEDF5",
  primary: "#4F5BD5", primarySoft: "#E8EAFF",
  accent: "#D946A8", accentSoft: "#FDE8F5",
  green: "#22C55E", greenSoft: "#ECFDF5", greenText: "#16A34A",
  red: "#EF4444", redSoft: "#FEF2F2", redText: "#DC2626",
  orange: "#F59E0B", orangeSoft: "#FFFBEB", orangeText: "#D97706",
  purple: "#8B5CF6", purpleSoft: "#F3F0FF",
  cyan: "#06B6D4", cyanSoft: "#ECFEFF",
  text: "#1E1E2F", textSecondary: "#64668B", textMuted: "#9496B3", textLight: "#B4B6CD",
};

export const PIE_COLORS = [C.primary, C.green, C.orange, C.red, C.purple, C.cyan, C.accent];

export const fmt = (n: number) => {
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
  return "$" + n;
};
export const fmtF = (n: number) => "$" + n.toLocaleString();

export const expenseBreakdown = [
  { name: "Chris Referral", value: 2633 }, { name: "Setup Cost", value: 1300 },
  { name: "Salary", value: 1200 }, { name: "Ads", value: 1038 }, { name: "Master Referral", value: 66 },
];

export const clientLifecycle = [
  { status: "New", count: 21, color: C.green },
  { status: "Trial", count: 20, color: C.orange },
  { status: "Renewed", count: 20, color: C.primary },
  { status: "Upgraded", count: 1, color: C.purple },
];

export const tierBreakdown = [
  { tier: "Tier 1", count: 47 }, { tier: "Tier 2", count: 5 },
  { tier: "Tier 3", count: 6 }, { tier: "Tier 6", count: 1 },
];

export const topClientsRev = [
  { name: "Stelio Audrey (098)", received: 15503, type: "CL", status: "Active", detail: "VIP - 2 CL payments" },
  { name: "Don Dankowich (12)", received: 2938, type: "CL", status: "Stopped", detail: "New - CL media" },
  { name: "Salmech (115)", received: 1960, type: "CL", status: "Active", detail: "Trial to Active" },
  { name: "Deborah (42)", received: 1761, type: "CL", status: "Active", detail: "Renewed x3" },
  { name: "Hugo VIP (58)", received: 1499, type: "CC", status: "Active", detail: "Tier 6 - $170K spend" },
  { name: "Celementa (100)", received: 1343, type: "CL", status: "Active", detail: "Trial convert" },
  { name: "Oscar (49)", received: 814, type: "CC", status: "Active", detail: "Renewed T3" },
  { name: "Raphael (61)", received: 798, type: "CC", status: "Active", detail: "New T3" },
  { name: "Lucas (43)", received: 699, type: "CC", status: "Active", detail: "Renewed" },
  { name: "Jordan (91)", received: 682, type: "CC", status: "Active", detail: "New T2" },
];

export const topSpenders = [
  { name: "Hugo (58) Tier 6", spend: 169965, pct: 60.8 },
  { name: "Yolanda (94) Tier 1", spend: 21903, pct: 7.8 },
  { name: "Lucas (43) Tier 4", spend: 17900, pct: 6.4 },
  { name: "Miriano T (98) CL", spend: 16804, pct: 6.0 },
  { name: "BO (64) Tier 3", spend: 10154, pct: 3.6 },
  { name: "Oscar (49) Tier 3", spend: 9293, pct: 3.3 },
  { name: "Raphael (61) Tier 3", spend: 9124, pct: 3.3 },
  { name: "Jordan (91) Tier 2", spend: 6129, pct: 2.2 },
  { name: "Ahmed (65) Tier 1", spend: 3542, pct: 1.3 },
  { name: "Mateo (90) Tier 1", spend: 2787, pct: 1.0 },
];

export const currencyMix = [
  { name: "USD", value: 247805 }, { name: "SEK", value: 21903 },
  { name: "EUR", value: 6994 }, { name: "AED", value: 2787 }, { name: "Others", value: 203 },
];

export const newClientsDetail = [
  { name: "Hugo (58)", sub: 1499, tier: "T6", type: "CC", note: "VIP biggest spender" },
  { name: "Raphael (61)", sub: 499, tier: "T3", type: "CC", note: "2 ad accounts" },
  { name: "Julius (68)", sub: 499, tier: "T3", type: "CL", note: "Master referral" },
  { name: "Fellipe (87)", sub: 299, tier: "T2", type: "CC", note: "" },
  { name: "Jordan (91)", sub: 299, tier: "T2", type: "CC", note: "$6K spend" },
  { name: "Oussi (59)", sub: 299, tier: "T2", type: "CC", note: "" },
  { name: "Lawrence (89)", sub: 299, tier: "T2", type: "CC", note: "" },
  { name: "Edward (69)", sub: 199, tier: "T1", type: "CC", note: "Master ref" },
  { name: "Kirin (96)", sub: 199, tier: "T1", type: "CC", note: "" },
  { name: "Mateo (90)", sub: 199, tier: "T1", type: "CC", note: "$2.8K spend" },
  { name: "Don Dankowich (12)", sub: 0, tier: "T1", type: "CL", note: "$2,938 CL - Stopped" },
  { name: "Stelio (098)", sub: 0, tier: "---", type: "CL", note: "$15.5K received" },
];

export const trialClients = [
  { name: "Salmech (115)", converted: true, received: 1960, note: "CL - High value" },
  { name: "Celementa (100)", converted: true, received: 1343, note: "CL - Active" },
  { name: "FFC Sander (105)", converted: true, received: 199, note: "" },
  { name: "FFC Gabrielle (103)", converted: true, received: 199, note: "Then New" },
  { name: "FFC Kelly (107)", converted: true, received: 0, note: "Then New" },
  { name: "FFC Amy (106)", converted: true, received: 0, note: "Then Renewed" },
  { name: "Kirin (96)", converted: true, received: 0, note: "Then New $199" },
  { name: "Sam (101)", converted: false, received: 0, note: "No payment" },
  { name: "FFC Kemi (109)", converted: false, received: 0, note: "No payment" },
  { name: "Florian (92)", converted: false, received: 0, note: "Stopped" },
  { name: "Maduro (97)", converted: false, received: 0, note: "Stopped x2" },
  { name: "Yolanda (94)", converted: false, received: 0, note: "Stopped x3 $22K spend!" },
  { name: "Balli (55)", converted: false, received: 100, note: "Stopped" },
];

export const risks = [
  { label: "Hugo = 60.8% du spend", desc: "Un seul client genere $170K de media spend. Depart = perte massive de volume.", severity: "high", icon: "🎯" },
  { label: "20 Trials, conversion incertaine", desc: "32% des transactions sont des trials. Beaucoup n'ont pas paye.", severity: "high", icon: "🧪" },
  { label: "Yolanda: $22K spend, $0 revenu", desc: "3 trials, toutes stopped. $21.9K de media spend en SEK sans paiement.", severity: "high", icon: "⚠️" },
  { label: "CL Exposure: $21K", desc: "$21K de media avance sur comptes CL en janvier.", severity: "medium", icon: "💳" },
  { label: "Referral costs en hausse", desc: "Chris referral: $2,633 (41.7% des depenses). Tendance croissante.", severity: "medium", icon: "📣" },
  { label: "14 clients Stopped", desc: "23% des transactions Jan ont abouti a un arret.", severity: "medium", icon: "📉" },
  { label: "FFC batch : 7 trials simultanes", desc: "Amy, Gabrielle, Jolene, Kelly, Sander, Kemi - pipeline fragile.", severity: "medium", icon: "🏭" },
];

export const waterfallRows = [
  { l: "Subscriptions", v: 8074, bg: "primarySoft", b: false },
  { l: "Setup Fees", v: 2787, bg: "primarySoft", b: false },
  { l: "Discounts", v: -135, bg: null, b: false },
  { l: "GROSS REVENUE", v: 10726, bg: "primarySoft", b: true },
  { l: "", v: null, bg: null, b: false },
  { l: "Setup Cost (agents)", v: -1300, bg: null, b: false },
  { l: "Salary", v: -1200, bg: null, b: false },
  { l: "Advertising", v: -1038, bg: null, b: false },
  { l: "Chris Referral (10%)", v: -2633, bg: null, b: false },
  { l: "Master Referral (5%)", v: -66, bg: null, b: false },
  { l: "TOTAL EXPENSES", v: -6237, bg: "redSoft", b: true },
  { l: "", v: null, bg: null, b: false },
  { l: "NET REVENUE", v: 4489, bg: "greenSoft", b: true },
  { l: "PCA Share (50%)", v: -2245, bg: "purpleSoft", b: true },
  { l: "PC RETAINED", v: 2244, bg: "greenSoft", b: true },
];
