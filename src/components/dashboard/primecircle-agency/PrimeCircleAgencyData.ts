export const C = {
  bg: "#F4F7FA", surface: "#FFFFFF", surfaceAlt: "#F4F7FA", card: "#FFFFFF",
  border: "#CFD9DE", borderLight: "#B8C5CC",
  primary: "#1E56A0", primarySoft: "#E8F0FA",
  accent: "#1E56A0", accentSoft: "#E8F0FA",
  green: "#17B169", greenSoft: "#ECFDF5", greenText: "#16A34A",
  red: "#DC2626", redSoft: "#FEF2F2", redText: "#DC2626",
  orange: "#F59E0B", orangeSoft: "#FFFBEB", orangeText: "#D97706",
  purple: "#7C3AED", purpleSoft: "#F3F0FF",
  cyan: "#4A90D9", cyanSoft: "#E8F0FA",
  text: "#0F1419", textSecondary: "#536471", textMuted: "#8899A6", textLight: "#B8C5CC",
  gold: "#C9A227",
};

export const PIE_COLORS = [C.primary, C.green, C.cyan, C.red, C.purple, C.orange, C.gold];

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

// ===== MONTH TYPES =====
export type PCAMonthId = 'jan-2026' | 'feb-2026' | 'mar-2026' | 'apr-2026';

export const PCA_AVAILABLE_MONTHS = [
  { id: 'jan-2026', label: 'Janvier 2026' },
  { id: 'feb-2026', label: 'Février 2026' },
  { id: 'mar-2026', label: 'Mars 2026' },
  { id: 'apr-2026', label: 'Avril 2026' },
];

export interface PCAMonthData {
  monthId: PCAMonthId;
  monthLabel: string;
  monthShort: string;
  // Overview KPIs
  gross: number;
  expenses: number;
  net: number;
  pcaShare: number;
  transactions: number;
  mediaSpend: number;
  clientsActifs: number;
  totalEncaisse: number;
  adAccounts: number;
  marginPct: number;
  // Prev month comparison
  prevGross: number;
  prevExpenses: number;
  prevNet: number;
  prevPcaShare: number;
  prevTransactions: number;
  prevMediaSpend: number;
  // YTD
  ytdNet: number;
  ytdPcaShare: number;
  ytdGross: number;
  ytdExpenses: number;
  expenseRatio: number;
  // Expense breakdown
  expenseBreakdown: { name: string; value: number }[];
  // Client lifecycle
  clientLifecycle: { status: string; count: number; color: string }[];
  // Waterfall
  waterfallRows: { l: string; v: number; prev: number; bg: string | null; b: boolean }[];
  // Clients tab
  clientKPIs: { label: string; value: string; icon: string; sub?: string }[];
  topClientsRev: { name: string; received: number; type: string; status: string; detail: string }[];
  newClientsDetail: { name: string; sub: number; tier: string; type: string; note: string }[];
  tierBreakdown: { tier: string; count: number }[];
  ccCount: number;
  clCount: number;
  ccPct: string;
  clPct: string;
  // Media tab
  mediaKPIs: { label: string; value: string; icon: string; sub?: string }[];
  topSpenders: { name: string; spend: number; pct: number }[];
  currencyMix: { name: string; value: number }[];
  ccSpend: string;
  clSpend: string;
  ccSpendPct: string;
  clSpendPct: string;
  ccSpendPctPrev: string;
  clSpendPctPrev: string;
  // Blink tab
  blinkHeaders: string[];
  blinkRows: { l: string; v: number[]; bg: string | null; b: boolean; sep: boolean }[];
  // Risks tab
  riskKPIs: { l: string; v: string; s: string; c: string }[];
  risks: { label: string; desc: string; severity: string; icon: string }[];
  // Monthly trend (for chart)
  monthlyTrend: { month: string; gross: number; net: number; expenses: number; media: number; ccMedia: number; clMedia: number; newClients: number; renewed: number; upgraded: number; trial: number }[];
}

// ===== JAN 2026 DATA =====
const janData: PCAMonthData = {
  monthId: 'jan-2026',
  monthLabel: 'Janvier 2026',
  monthShort: 'JAN 2026',
  gross: 10726, expenses: 6237, net: 4489, pcaShare: 2245,
  transactions: 62, mediaSpend: 279691, clientsActifs: 47, totalEncaisse: 28975, adAccounts: 33,
  marginPct: 41.8,
  prevGross: 0, prevExpenses: 0, prevNet: 0, prevPcaShare: 0, prevTransactions: 0, prevMediaSpend: 0,
  ytdNet: 4489, ytdPcaShare: 2245, ytdGross: 10726, ytdExpenses: 6237,
  expenseRatio: 58.2,
  expenseBreakdown: [
    { name: "Chris Referral", value: 2633 }, { name: "Setup Cost", value: 1300 },
    { name: "Salary", value: 1200 }, { name: "Ads", value: 1038 }, { name: "Master Referral", value: 66 },
  ],
  clientLifecycle: [
    { status: "New", count: 21, color: C.green }, { status: "Trial", count: 20, color: C.orange },
    { status: "Renewed", count: 20, color: C.primary }, { status: "Upgraded", count: 1, color: C.purple },
  ],
  waterfallRows: [
    { l: "Subscriptions", v: 8074, prev: 0, bg: null, b: false },
    { l: "Setup Fees", v: 2787, prev: 0, bg: null, b: false },
    { l: "Discounts", v: -135, prev: 0, bg: null, b: false },
    { l: "GROSS REVENUE", v: 10726, prev: 0, bg: "greenSoft", b: true },
    { l: "Setup Cost", v: -1300, prev: 0, bg: null, b: false },
    { l: "Salary", v: -1200, prev: 0, bg: null, b: false },
    { l: "Ads", v: -1038, prev: 0, bg: null, b: false },
    { l: "Chris Referral", v: -2633, prev: 0, bg: null, b: false },
    { l: "Master Referral", v: -66, prev: 0, bg: null, b: false },
    { l: "TOTAL EXPENSES", v: -6237, prev: 0, bg: "redSoft", b: true },
    { l: "NET REVENUE", v: 4489, prev: 0, bg: "primarySoft", b: true },
    { l: "PCA Share (50%)", v: 2245, prev: 0, bg: "purpleSoft", b: true },
    { l: "PC Retained (50%)", v: 2244, prev: 0, bg: "accentSoft", b: true },
  ],
  clientKPIs: [
    { label: "Nouveaux", value: "21", icon: "🆕", sub: "Dont Stelio $13K" },
    { label: "Renouveles", value: "20", icon: "🔄" },
    { label: "Trials", value: "20", icon: "🧪", sub: "~35% conversion" },
    { label: "Stopped", value: "14", icon: "🛑" },
    { label: "CC Comptes", value: "47", icon: "💳" },
    { label: "CL Comptes", value: "14", icon: "⚡", sub: "Risque credit" },
  ],
  topClientsRev: [
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
  ],
  newClientsDetail: [
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
  ],
  tierBreakdown: [
    { tier: "Tier 1", count: 47 }, { tier: "Tier 2", count: 5 },
    { tier: "Tier 3", count: 6 }, { tier: "Tier 6", count: 1 },
  ],
  ccCount: 47, clCount: 14, ccPct: "75.8", clPct: "22.6",
  mediaKPIs: [
    { label: "Total Media Spend", value: "$279.7K", icon: "📡", sub: "x4.3 vs decembre" },
    { label: "CC Spend", value: "$258.7K", icon: "💳", sub: "92.5% - sans risque" },
    { label: "CL Spend", value: "$21.0K", icon: "📊", sub: "7.5% du total" },
    { label: "Ad Accounts", value: "33", icon: "📂" },
  ],
  topSpenders: [
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
  ],
  currencyMix: [
    { name: "USD", value: 247805 }, { name: "SEK", value: 21903 },
    { name: "EUR", value: 6994 }, { name: "AED", value: 2787 }, { name: "Others", value: 203 },
  ],
  ccSpend: "$258.7K", clSpend: "$21.0K", ccSpendPct: "92.5", clSpendPct: "7.5",
  ccSpendPctPrev: "", clSpendPctPrev: "",
  blinkHeaders: ["", "Sep-25", "Oct-25", "Nov-25", "Dec-25", "Jan-26"],
  blinkRows: [
    { l: "Net Revenue", v: [198, 10644, 5854, 8518, 4489], bg: null, b: false, sep: false },
    { l: "CA PCA (50%)", v: [99, 5322, 2927, 4259, 2244], bg: null, b: false, sep: false },
    { l: "CA PCA Cumulated", v: [99, 5421, 8348, 12607, 14852], bg: "primarySoft", b: true, sep: false },
    { l: "CA Blink to PAID (50%)", v: [99, 5322, 2927, 4259, 2244], bg: null, b: false, sep: false },
    { l: "Paid by PCA on Benefit", v: [0, 0, 0, 0, 0], bg: "redSoft", b: false, sep: false },
    { l: "To Paid Cumulated", v: [99, 5421, 8348, 12607, 14852], bg: "redSoft", b: true, sep: true },
    { l: "Total Media to Pay (CL)", v: [31788, 12866, 5730, 4406, 21009], bg: null, b: false, sep: false },
    { l: "Paid by PCA on Media", v: [31788, 12866, 5730, 4406, 21009], bg: "greenSoft", b: false, sep: false },
    { l: "To Paid Cumulated (Media)", v: [0, 0, 0, 0, 0], bg: "greenSoft", b: true, sep: true },
    { l: "Total Blink / Month", v: [31887, 18188, 8657, 8665, 23253], bg: null, b: false, sep: false },
    { l: "Total Blink Cumulated", v: [99, 5421, 8348, 12607, 14852], bg: "purpleSoft", b: true, sep: false },
  ],
  riskKPIs: [
    { l: "Concentration Hugo", v: "60.8%", s: "du media spend", c: C.redText },
    { l: "CL Exposure", v: "$21.0K", s: "media avance", c: C.redText },
    { l: "Marge Nette", v: "41.8%", s: "vs 54.8% en Dec", c: C.orangeText },
    { l: "Clients Stopped", v: "14", s: "23% des tx", c: C.orangeText },
  ],
  risks: [
    { label: "Hugo = 60.8% du spend", desc: "Un seul client genere $170K de media spend.", severity: "high", icon: "🎯" },
    { label: "20 Trials, conversion incertaine", desc: "32% des transactions sont des trials.", severity: "high", icon: "🧪" },
    { label: "Yolanda: $22K spend, $0 revenu", desc: "3 trials, toutes stopped. $21.9K de media.", severity: "high", icon: "⚠️" },
  ],
  monthlyTrend: [
    { month: "Jan-26", gross: 10726, net: 4489, expenses: 6237, media: 279691, ccMedia: 258682, clMedia: 21009, newClients: 21, renewed: 20, upgraded: 1, trial: 20 },
  ],
};

// ===== FEB 2026 DATA =====
const febData: PCAMonthData = {
  monthId: 'feb-2026',
  monthLabel: 'Février 2026',
  monthShort: 'FEB 2026',
  gross: 35080, expenses: 10606, net: 24473, pcaShare: 12237,
  transactions: 148, mediaSpend: 515952, clientsActifs: 0, totalEncaisse: 0, adAccounts: 63,
  marginPct: 69.8,
  prevGross: 10726, prevExpenses: 6237, prevNet: 4489, prevPcaShare: 2245,
  prevTransactions: 62, prevMediaSpend: 279691,
  ytdNet: 28962, ytdPcaShare: 14482, ytdGross: 45806, ytdExpenses: 16843,
  expenseRatio: 30.2,
  expenseBreakdown: [
    { name: "Ads", value: 6666 }, { name: "Setup Cost", value: 2500 },
    { name: "Salary", value: 1200 }, { name: "Master Referral", value: 211 }, { name: "No Limit Referral", value: 30 },
  ],
  clientLifecycle: [
    { status: "New", count: 118, color: C.green },
    { status: "Renewed", count: 21, color: C.primary },
    { status: "Upgraded", count: 6, color: C.purple },
    { status: "Trial", count: 3, color: C.orange },
  ],
  waterfallRows: [
    { l: "Subscriptions", v: 28889, prev: 8074, bg: null, b: false },
    { l: "Setup Fees", v: 7959, prev: 2787, bg: null, b: false },
    { l: "Discounts", v: -718, prev: -135, bg: null, b: false },
    { l: "GROSS REVENUE", v: 35080, prev: 10726, bg: "greenSoft", b: true },
    { l: "Setup Cost", v: -2500, prev: -1300, bg: null, b: false },
    { l: "Salary", v: -1200, prev: -1200, bg: null, b: false },
    { l: "Ads", v: -6666, prev: -1038, bg: null, b: false },
    { l: "Master Referral", v: -211, prev: -66, bg: null, b: false },
    { l: "No Limit Referral", v: -30, prev: 0, bg: null, b: false },
    { l: "TOTAL EXPENSES", v: -10606, prev: -6237, bg: "redSoft", b: true },
    { l: "NET REVENUE", v: 24473, prev: 4489, bg: "primarySoft", b: true },
    { l: "PCA Share (50%)", v: 12237, prev: 2244, bg: "purpleSoft", b: true },
    { l: "PC Retained (50%)", v: 12236, prev: 2244, bg: "accentSoft", b: true },
  ],
  clientKPIs: [
    { label: "Nouveaux", value: "118", icon: "🆕", sub: "vs 21 en Jan" },
    { label: "Renouveles", value: "21", icon: "🔄", sub: "vs 20 en Jan" },
    { label: "Upgraded", value: "6", icon: "⬆️", sub: "vs 1 en Jan" },
    { label: "Trials", value: "3", icon: "🧪" },
    { label: "CC Comptes", value: "70", icon: "💳" },
    { label: "CL Comptes", value: "78", icon: "⚡", sub: "52.7% des tx" },
  ],
  topClientsRev: [
    { name: "Salmech (115)", received: 141328, type: "CL", status: "Active", detail: "Tier 6 - massive CL" },
    { name: "8 Labs (127)", received: 92812, type: "CL", status: "Active", detail: "Tier 6 - new client" },
    { name: "Stelio Audrey (098)", received: 60284, type: "CL", status: "Active", detail: "VIP - multi payments" },
    { name: "Joel Lalazuelks (135)", received: 18440, type: "CL", status: "Active", detail: "Tier 4 - new" },
    { name: "AY (130)", received: 8786, type: "CL", status: "Active", detail: "Tier 2>3 upgraded" },
    { name: "Celementa (100)", received: 4576, type: "CL", status: "Active", detail: "Tier 2 multi" },
    { name: "Hunter (125)", received: 4378, type: "CL", status: "Active", detail: "Tier 4 new" },
    { name: "Bo (64)", received: 2776, type: "CC", status: "Active", detail: "Tier 3>4>6" },
    { name: "Jordan (91)", received: 2557, type: "CC", status: "Active", detail: "Tier 5 renewed" },
    { name: "Syed (78)", received: 2135, type: "CC", status: "Active", detail: "Tier 6 new" },
  ],
  newClientsDetail: [
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
  ],
  tierBreakdown: [
    { tier: "Tier 1", count: 32 }, { tier: "Tier 2", count: 22 }, { tier: "Tier 3", count: 18 },
    { tier: "Tier 4", count: 12 }, { tier: "Tier 5", count: 6 }, { tier: "Tier 6", count: 42 },
  ],
  ccCount: 70, clCount: 78, ccPct: "47.3", clPct: "52.7",
  mediaKPIs: [
    { label: "Total Media Spend", value: "$516.0K", icon: "📡", sub: pctChg(515952, 279691) + " vs Jan" },
    { label: "CC Spend", value: "$305.0K", icon: "💳", sub: "59.1% du total" },
    { label: "CL Spend", value: "$211.0K", icon: "📊", sub: "40.9% du total" },
    { label: "Ad Accounts", value: "63", icon: "📂", sub: "vs 33 en Jan (+91%)" },
  ],
  topSpenders: [
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
  ],
  currencyMix: [
    { name: "USD", value: 398812 }, { name: "EUR", value: 84884 },
    { name: "CHF", value: 21827 }, { name: "NOK", value: 8073 }, { name: "GBP", value: 1643 }, { name: "Others", value: 714 },
  ],
  ccSpend: "$305K", clSpend: "$211K", ccSpendPct: "59.1", clSpendPct: "40.9",
  ccSpendPctPrev: "vs 92.5% en Jan", clSpendPctPrev: "vs 7.5% en Jan",
  blinkHeaders: ["", "Jan-26", "Feb-26", "YTD"],
  blinkRows: [
    { l: "Revenu Net", v: [4489, 24473, 28962], bg: null, b: false, sep: false },
    { l: "CA PCA (50%)", v: [2245, 12237, 14482], bg: null, b: false, sep: false },
    { l: "CA Blink a payer (50%)", v: [2245, 12237, 14482], bg: null, b: false, sep: false },
    { l: "Paye par PCA sur Benefit", v: [2245, 12237, 14482], bg: "greenSoft", b: true, sep: true },
    { l: "Total Media a payer (CL)", v: [21009, 210984, 231993], bg: null, b: false, sep: false },
    { l: "Paye par PCA sur Media", v: [21009, 210984, 231993], bg: "greenSoft", b: true, sep: true },
    { l: "Total Blink a payer / Mois", v: [23253, 223220, 246473], bg: "primarySoft", b: true, sep: false },
  ],
  riskKPIs: [
    { l: "Top Spender Concentration", v: "25.6%", s: "Salmech - mieux reparti vs Jan", c: C.orangeText },
    { l: "CL Exposure", v: "$211K", s: "x10 vs Jan ($21K)", c: C.redText },
    { l: "Marge Nette", v: "69.8%", s: "vs 41.8% en Jan", c: C.greenText },
  ],
  risks: [
    { label: "Concentration Salmech", desc: "25.6% du media spend Feb ($132K).", severity: "medium", icon: "🎯" },
    { label: "CL Exposure croissante", desc: "$211K de media CL en Feb vs $21K en Jan (x10).", severity: "high", icon: "💳" },
    { label: "Marge Nette 69.8%", desc: "En forte hausse vs 41.8% en Jan.", severity: "low", icon: "📈" },
  ],
  monthlyTrend: [
    { month: "Jan-26", gross: 10726, net: 4489, expenses: 6237, media: 279691, ccMedia: 258682, clMedia: 21009, newClients: 21, renewed: 20, upgraded: 1, trial: 20 },
    { month: "Feb-26", gross: 35080, net: 24473, expenses: 10606, media: 515952, ccMedia: 304968, clMedia: 210984, newClients: 118, renewed: 21, upgraded: 6, trial: 3 },
  ],
};

// ===== MAR 2026 DATA =====
const marData: PCAMonthData = {
  monthId: 'mar-2026',
  monthLabel: 'Mars 2026',
  monthShort: 'MAR 2026',
  gross: 46402, expenses: 16555, net: 29892, pcaShare: 14946,
  transactions: 149, mediaSpend: 1244096, clientsActifs: 0, totalEncaisse: 0, adAccounts: 89,
  marginPct: 64.4,
  prevGross: 36184, prevExpenses: 9406, prevNet: 26778, prevPcaShare: 13389,
  prevTransactions: 148, prevMediaSpend: 515952,
  // YTD 2026 (Jan + Feb + Mar + restatement adjustments)
  ytdNet: 65317, ytdPcaShare: 32659, ytdGross: 97471, ytdExpenses: 32198,
  expenseRatio: 35.7,
  expenseBreakdown: [
    { name: "Ads", value: 11163 }, { name: "Setup Cost", value: 3500 },
    { name: "Salary", value: 1400 }, { name: "Master Referral", value: 307 },
    { name: "No Limit Referral", value: 140 }, { name: "Transaction Fees", value: 45 },
  ],
  clientLifecycle: [
    { status: "New", count: 104, color: C.green },
    { status: "Renewed", count: 27, color: C.primary },
    { status: "Trials", count: 12, color: C.orange },
    { status: "Upgraded", count: 6, color: C.purple },
  ],
  waterfallRows: [
    { l: "Subscriptions", v: 36797, prev: 28889, bg: null, b: false },
    { l: "Setup Fees (35 setups)", v: 10846, prev: 7959, bg: null, b: false },
    { l: "CL Amount", v: 1241, prev: 0, bg: null, b: false },
    { l: "GROSS REVENUE", v: 46402, prev: 36184, bg: "greenSoft", b: true },
    { l: "Setup Cost", v: -3500, prev: -2500, bg: null, b: false },
    { l: "Salary", v: -1400, prev: -1200, bg: null, b: false },
    { l: "Ads (Facebook)", v: -11163, prev: -6666, bg: null, b: false },
    { l: "Master Referral", v: -307, prev: -211, bg: null, b: false },
    { l: "No Limit Referral", v: -140, prev: -30, bg: null, b: false },
    { l: "Transaction Fees", v: -45, prev: 0, bg: null, b: false },
    { l: "TOTAL EXPENSES", v: -16555, prev: -9406, bg: "redSoft", b: true },
    { l: "NET REVENUE", v: 29892, prev: 26778, bg: "primarySoft", b: true },
    { l: "PCA Share (50%)", v: 14946, prev: 13389, bg: "purpleSoft", b: true },
    { l: "PC Retained (50%)", v: 14946, prev: 13389, bg: "accentSoft", b: true },
  ],
  clientKPIs: [
    { label: "Nouveaux", value: "104", icon: "🆕", sub: "vs 118 en Feb" },
    { label: "Renouveles", value: "27", icon: "🔄", sub: "vs 21 en Feb" },
    { label: "Upgraded", value: "6", icon: "⬆️", sub: "vs 6 en Feb" },
    { label: "Trials", value: "12", icon: "🧪", sub: "vs 3 en Feb" },
    { label: "CC Comptes", value: "89", icon: "💳", sub: "59.7% des tx" },
    { label: "CL Comptes", value: "51", icon: "⚡", sub: "34.2% des tx" },
  ],
  topClientsRev: [
    { name: "AY (130)", received: 20089, type: "CL", status: "Active", detail: "Upgraded T3" },
    { name: "Stelio Audrey (098)", received: 8000, type: "CL", status: "Active", detail: "VIP CL" },
    { name: "Philippe Heave (167)", received: 4589, type: "CC", status: "Active", detail: "New T2" },
    { name: "Adam Rotard (166)", received: 4042, type: "CC", status: "Active", detail: "New" },
    { name: "Sammy Ivan (139)", received: 2922, type: "CL", status: "Active", detail: "T1 CL" },
    { name: "Celementa (100)", received: 2668, type: "CL", status: "Active", detail: "T2 CL" },
    { name: "Lamama Delamama (188)", received: 2504, type: "CC", status: "Active", detail: "New" },
    { name: "Alex Zhang (170)", received: 2179, type: "CC", status: "Active", detail: "New EB" },
    { name: "Syed (78)", received: 2031, type: "CC", status: "Active", detail: "T6 CC" },
    { name: "Hunter (125)", received: 1963, type: "CL", status: "Active", detail: "T4 CL" },
  ],
  newClientsDetail: [
    { name: "Philippe Heave (167)", sub: 4589, tier: "T2", type: "CC", note: "New, $4.5K" },
    { name: "Adam Rotard (166)", sub: 4042, tier: "---", type: "CC", note: "New" },
    { name: "Lamama Delamama (188)", sub: 2504, tier: "---", type: "CC", note: "New" },
    { name: "Alex Zhang (170)", sub: 2179, tier: "---", type: "CC", note: "New EB" },
    { name: "Sammy Ivan (139)", sub: 1499, tier: "T1", type: "CL", note: "" },
  ],
  tierBreakdown: [
    { tier: "Tier 1", count: 51 }, { tier: "Tier 2", count: 23 },
    { tier: "Tier 3", count: 23 }, { tier: "Tier 4", count: 6 },
    { tier: "Tier 5", count: 3 }, { tier: "Tier 6", count: 26 },
  ],
  ccCount: 89, clCount: 51, ccPct: "59.7", clPct: "34.2",
  mediaKPIs: [
    { label: "Total Media Spend", value: "$1.24M", icon: "📡", sub: "+140% vs Feb ($516K)" },
    { label: "CC Spend", value: "$1.10M", icon: "💳", sub: "88.8% du total" },
    { label: "CL Spend", value: "$139.9K", icon: "📊", sub: "11.2% du total" },
    { label: "Ad Accounts", value: "89", icon: "📂", sub: "vs 63 en Feb (+41%)" },
  ],
  topSpenders: [
    { name: "Carl (76) T6", spend: 142771, pct: 11.5 },
    { name: "Benjamin (141) T6", spend: 131603, pct: 10.6 },
    { name: "LE (77) T3", spend: 86232, pct: 6.9 },
    { name: "Elveria (98) T1", spend: 83714, pct: 6.7 },
    { name: "Maxime (66) T3", spend: 80583, pct: 6.5 },
    { name: "Thomas (99) T1", spend: 72971, pct: 5.9 },
    { name: "Carl (76) T6 Repl.", spend: 58292, pct: 4.7 },
    { name: "Jordan (91) T3", spend: 50367, pct: 4.0 },
    { name: "Hugo (58) T6", spend: 46966, pct: 3.8 },
    { name: "PH (167) T2", spend: 39882, pct: 3.2 },
  ],
  currencyMix: [
    { name: "USD", value: 1104200 }, { name: "EUR", value: 100000 }, { name: "Others", value: 39896 },
  ],
  ccSpend: "$1.10M", clSpend: "$139.9K", ccSpendPct: "88.8", clSpendPct: "11.2",
  ccSpendPctPrev: "vs 59.1% en Feb", clSpendPctPrev: "vs 40.9% en Feb",
  blinkHeaders: ["", "Jan-26", "Feb-26", "Mar-26", "Cumule"],
  blinkRows: [
    { l: "Revenu Net", v: [4489, 24473, 29892, 58854], bg: null, b: false, sep: false },
    { l: "PCA Share (50%)", v: [2244, 12237, 14946, 29427], bg: null, b: false, sep: true },
    { l: "Benefit a payer", v: [2244, 12237, 14946, 0], bg: null, b: false, sep: false },
    { l: "Paye par PCA sur Benefit", v: [2244, 12237, 0, 0], bg: "greenSoft", b: false, sep: false },
    { l: "Solde Benefit mensuel", v: [0, 0, 14946, 0], bg: null, b: false, sep: false },
    { l: "Solde Benefit du (cumule)", v: [0, 0, 0, 18869], bg: "redSoft", b: true, sep: true },
    { l: "Media CL a payer", v: [21009, 210984, 161343, 0], bg: null, b: false, sep: false },
    { l: "Paye par PCA sur Media", v: [21009, 210984, 67423, 0], bg: "greenSoft", b: false, sep: false },
    { l: "Solde Media mensuel", v: [0, 0, 93920, 0], bg: null, b: false, sep: false },
    { l: "Solde Media du (cumule)", v: [0, 0, 0, 93920], bg: "redSoft", b: true, sep: true },
    { l: "Total Cumule du a Blink", v: [0, 0, 0, 112789], bg: "primarySoft", b: true, sep: false },
  ],
  riskKPIs: [
    { l: "Top Spender Concentration", v: "11.5%", s: "Carl - bien reparti", c: C.greenText },
    { l: "CL Exposure", v: "$139.9K", s: "vs $211K en Feb (-34%)", c: C.orangeText },
    { l: "Marge Nette", v: "64.4%", s: "vs 74.0% en Feb (-9.6 pts)", c: C.orangeText },
    { l: "Solde Blink du", v: "$112.8K", s: "Benefit + Media cumule", c: C.redText },
  ],
  risks: [
    { label: "Solde Blink cumule $112.8K", desc: "Benefit ($18.9K) + Media ($93.9K) non payes a fin Mars.", severity: "high", icon: "💰" },
    { label: "Charges +76% vs Feb", desc: "Total expenses passent de $9.4K a $16.5K (Ads x1.7).", severity: "medium", icon: "📈" },
    { label: "Marge Nette -9.6 pts", desc: "64.4% vs 74.0% en Feb, due a la hausse Ads.", severity: "medium", icon: "📊" },
  ],
  monthlyTrend: [
    { month: "Jan-26", gross: 10726, net: 4489, expenses: 6237, media: 279691, ccMedia: 258682, clMedia: 21009, newClients: 21, renewed: 20, upgraded: 1, trial: 20 },
    { month: "Feb-26", gross: 35080, net: 24473, expenses: 10606, media: 515952, ccMedia: 304968, clMedia: 210984, newClients: 118, renewed: 21, upgraded: 6, trial: 3 },
    { month: "Mar-26", gross: 46402, net: 29892, expenses: 16555, media: 1244096, ccMedia: 1104200, clMedia: 139896, newClients: 104, renewed: 27, upgraded: 6, trial: 12 },
  ],
};

const monthDataMap: Record<PCAMonthId, PCAMonthData> = {
  'jan-2026': janData,
  'feb-2026': febData,
  'mar-2026': marData,
};

export function getPCAMonthData(monthId: PCAMonthId): PCAMonthData {
  return monthDataMap[monthId];
}
