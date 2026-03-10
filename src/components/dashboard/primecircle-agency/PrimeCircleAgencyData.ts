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
export const pctChg = (cur: number, prev: number) => {
  if (!prev) return "N/A";
  const d = ((cur - prev) / prev * 100).toFixed(0);
  return (Number(d) > 0 ? "+" : "") + d + "%";
};

// ===== FEB DATA =====
export const expenseBreakdown = [
  { name: "Ads", value: 6666 }, { name: "Setup Cost", value: 2500 },
  { name: "Salary", value: 1200 }, { name: "Master Referral", value: 211 }, { name: "No Limit Referral", value: 30 },
];

export const clientLifecycle = [
  { status: "New", count: 116, color: C.green },
  { status: "Renewed", count: 20, color: C.primary },
  { status: "Upgraded", count: 6, color: C.purple },
  { status: "Trial", count: 3, color: C.orange },
];

export const tierBreakdown = [
  { tier: "Tier 1", count: 32 }, { tier: "Tier 2", count: 21 }, { tier: "Tier 3", count: 18 },
  { tier: "Tier 4", count: 11 }, { tier: "Tier 5", count: 5 }, { tier: "Tier 6", count: 42 },
];

export const topClientsRev = [
  { name: "Salmech (115)", received: 141328, type: "CL", status: "Active", detail: "Tier 6 - massive CL" },
  { name: "8 Labs (127)", received: 92812, type: "CL", status: "Active", detail: "Tier 6 - new client" },
  { name: "Stelio Audrey (098)", received: 60284, type: "CL", status: "Active", detail: "VIP - multi payments" },
  { name: "Joel Lalazuelks (135)", received: 18440, type: "CL", status: "Active", detail: "Tier 4 - new" },
  { name: "AY (130)", received: 8786, type: "CL", status: "Active", detail: "Tier 2>3 upgraded" },
  { name: "Celementa (100)", received: 4576, type: "CL", status: "Active", detail: "Tier 2 multi" },
  { name: "Hunter (125)", received: 3963, type: "CL", status: "Active", detail: "Tier 4 new" },
  { name: "Bo (64)", received: 2776, type: "CC", status: "Active", detail: "Tier 3>4>6" },
  { name: "Syed (78)", received: 2135, type: "CC", status: "Active", detail: "Tier 6 new" },
  { name: "Sammy Ivan (139)", received: 1945, type: "CL", status: "Active", detail: "Tier 1 new" },
];

export const topSpenders = [
  { name: "Salmech (115) Tier 6", spend: 132012, pct: 25.6 },
  { name: "Hugo (58) Tier 6", spend: 61449, pct: 11.9 },
  { name: "BO (64) Tier 3-6", spend: 54887, pct: 10.6 },
  { name: "Jordan (91) Tier 5", spend: 47405, pct: 9.2 },
  { name: "Miriano T (98) CL", spend: 30204, pct: 5.9 },
  { name: "Benjamin (141) Tier 6", spend: 21827, pct: 4.2 },
  { name: "Joel (135) Tier 4", spend: 17334, pct: 3.4 },
  { name: "Ladox (108) Tier 2", spend: 16264, pct: 3.2 },
  { name: "8 Labs (127) Tier 6", spend: 16198, pct: 3.1 },
  { name: "Mathias (48) Tier 3", spend: 14117, pct: 2.7 },
];

export const currencyMix = [
  { name: "USD", value: 398812 }, { name: "EUR", value: 84884 },
  { name: "CHF", value: 21827 }, { name: "NOK", value: 8073 }, { name: "GBP", value: 1643 }, { name: "Others", value: 714 },
];

export const newClientsDetail = [
  { name: "Salmech (115)", sub: 1499, tier: "T6", type: "CL", note: "$141K received" },
  { name: "8 Labs (127)", sub: 1499, tier: "T6", type: "CL", note: "$93K received" },
  { name: "Hugo (58)", sub: 1499, tier: "T6", type: "CC", note: "Renewing VIP" },
  { name: "Syed (78)", sub: 1499, tier: "T6", type: "CC", note: "Multiple setups" },
  { name: "Bo (64)", sub: 1499, tier: "T3>6", type: "CC", note: "8 lines, upgraded" },
  { name: "Jordan (91)", sub: 1199, tier: "T5", type: "CC", note: "5 lines" },
  { name: "Joel (135)", sub: 799, tier: "T4", type: "CL", note: "$18K CL" },
  { name: "Hunter (125)", sub: 799, tier: "T4", type: "CL", note: "$4K received" },
  { name: "Stelio (098)", sub: 199, tier: "---", type: "CL", note: "$60K CL" },
  { name: "Benjamin Centra (141)", sub: 1499, tier: "T6", type: "CC", note: "Master ref" },
];

// M-1 comparison
export const janData = { gross: 10726, expenses: 6237, net: 4489, pcaShare: 2244, transactions: 62, mediaSpend: 279691 };
export const febData = { gross: 35080, expenses: 10606, net: 24473, pcaShare: 12237, transactions: 145, mediaSpend: 515952 };
export const ytdData = { gross: 45806, expenses: 16843, net: 28962, pcaShare: 14481 };

export const monthlyTrend = [
  { month: "Jan-26", gross: 10726, net: 4489, expenses: 6237, media: 279691 },
  { month: "Feb-26", gross: 35080, net: 24473, expenses: 10606, media: 515952 },
];

export const risks = [
  { label: "Concentration Salmech", desc: "25.6% du media spend Feb ($132K). Concentration plus saine que Hugo en Jan (60.8%).", severity: "medium", icon: "🎯" },
  { label: "CL Exposure croissante", desc: "$211K de media CL en Feb vs $21K en Jan (x10). Volume a surveiller.", severity: "high", icon: "💳" },
  { label: "Marge Nette 69.8%", desc: "En forte hausse vs 41.8% en Jan. Portee par le volume CL a haute valeur.", severity: "low", icon: "📈" },
];

export const waterfallRows = [
  { l: "Subscriptions", v: 28889, jan: 8074, bg: null as string | null, b: false },
  { l: "Setup Fees", v: 7959, jan: 2787, bg: null as string | null, b: false },
  { l: "Discounts", v: -718, jan: -135, bg: null as string | null, b: false },
  { l: "GROSS REVENUE", v: 35080, jan: 10726, bg: "greenSoft", b: true },
  { l: "Setup Cost", v: -2500, jan: -1300, bg: null as string | null, b: false },
  { l: "Salary", v: -1200, jan: -1200, bg: null as string | null, b: false },
  { l: "Ads", v: -6666, jan: -1038, bg: null as string | null, b: false },
  { l: "Master Referral", v: -211, jan: -66, bg: null as string | null, b: false },
  { l: "No Limit Referral", v: -30, jan: 0, bg: null as string | null, b: false },
  { l: "TOTAL EXPENSES", v: -10606, jan: -6237, bg: "redSoft", b: true },
  { l: "NET REVENUE", v: 24473, jan: 4489, bg: "primarySoft", b: true },
  { l: "PCA Share (50%)", v: 12237, jan: 2244, bg: "purpleSoft", b: true },
  { l: "PC Retained (50%)", v: 12236, jan: 2244, bg: "accentSoft", b: true },
];

export const blinkRows = [
  { l: "Revenu Net", v: [4489, 24473, 28962], bg: null as string | null, b: false, sep: false },
  { l: "CA PCA (50%)", v: [2244, 12237, 14481], bg: null as string | null, b: false, sep: false },
  { l: "CA Blink a payer (50%)", v: [2244, 12237, 14481], bg: null as string | null, b: false, sep: false },
  { l: "Paye par PCA sur Benefit", v: [2244, 12237, 14481], bg: "greenSoft", b: true, sep: true },
  { l: "Total Media a payer (CL)", v: [21009, 210984, 231993], bg: null as string | null, b: false, sep: false },
  { l: "Paye par PCA sur Media", v: [21009, 210984, 231993], bg: "greenSoft", b: true, sep: true },
  { l: "Total Blink a payer / Mois", v: [23253, 223220, 246473], bg: "primarySoft", b: true, sep: false },
];

export const blinkHeaders = ["", "Jan-26", "Feb-26", "YTD"];

export const trialClients = [
  { name: "Sam (101)", converted: false, received: 0, note: "No payment" },
  { name: "FFC Kemi (109)", converted: false, received: 0, note: "No payment" },
  { name: "Florian (92)", converted: false, received: 0, note: "Stopped" },
];
