// Parsers DÉTERMINISTES par source à format stable (Stripe, Wio, Ebury, 3S Money, Whop).
// Objectif : sortir des chiffres EXACTS sans appel LLM (fiabilité + vitesse), et ne laisser
// l'IA que sur ce qui est vraiment ambigu (PDF/scan/format inconnu).
// Chaque parser convertit déjà dans la devise de reporting via le facteur fourni.
//
// Convention de retour : valeurs ADDITIVES par poste (l'orchestrateur somme entre fichiers),
// les doubles comptages connus sont exclus ICI (Whop≈Stripe, payouts/Network International internes).

import { convert } from "./fx.ts";
import type { SourceType } from "./reconcile.ts";

export interface ParseCtx { reporting: string; factor: Record<string, number>; period: string; }
// Rôle COMPTABLE du document — déterminé par le type de source, jamais deviné :
//  revenue  = ce qui est FACTURÉ (= le CA). Une seule source fait foi (ex. Quaderno).
//  payment  = réception d'un encaissement par un moyen de paiement (Stripe/Whop) → PAS du CA.
//  bank     = relevé bancaire → trésorerie (soldes) + charges (sorties).
//  internal = mouvement interne (payout, virement entre comptes) → ignoré.
export type DocRole = "revenue" | "payment" | "bank" | "internal" | "analytics" | "ads";
export interface ParsedExtract {
  parser: string;
  role: DocRole;
  source_type: SourceType;
  currency: string;            // = reporting (déjà converti)
  values: Record<string, number>;
  revenueCandidate?: number;   // montant qui devient le CA SI le rôle effectif du doc = "revenue"
  sources: Record<string, string>;
  note?: string;
  dedupGroup?: string;         // doublons potentiels (ex. Stripe multi-mois, Ebury -EUR vs -all_currencies)
  count?: number;              // nb de lignes du mois utilisées (sert au dédoublonnage : on garde le plus complet)
}

// Vrai si la date tombe dans le mois de la période (YYYY-MM-01). Gère ISO (YYYY-MM-DD) et FR (DD/MM/YYYY).
const inMonth = (dateStr: string | undefined, period: string): boolean => {
  if (!dateStr) return false;
  const ym = period.slice(0, 7); const s = String(dateStr).trim();
  let m = s.match(/(\d{4})-(\d{2})-\d{2}/);
  if (m) return `${m[1]}-${m[2]}` === ym;
  m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/); // DD/MM/YYYY
  if (m) return `${m[3]}-${m[2]}` === ym;
  return false;
};

// ---- utilitaires CSV ----------------------------------------------------------

// Parse un CSV en respectant les guillemets (champs avec virgules/retours ligne).
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cur); cur = "";
        if (row.some((x) => x !== "")) rows.push(row);
        row = [];
      } else cur += c;
    }
  }
  if (cur !== "" || row.length) { row.push(cur); if (row.some((x) => x !== "")) rows.push(row); }
  return rows;
}

export function toNum(s: string | undefined): number | null {
  if (s == null) return null;
  let t = String(s).trim().replace(/\s/g, "").replace(/[€$£]/g, "");
  if (!t) return null;
  // gère "1 234,56" (fr) et "1,234.56" (en)
  if (t.includes(",") && t.includes(".")) t = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  else if (t.includes(",")) t = /,\d{1,2}$/.test(t) ? t.replace(",", ".") : t.replace(/,/g, "");
  const n = parseFloat(t);
  return isFinite(n) ? n : null;
}

const idx = (headers: string[], ...names: string[]) => {
  const low = headers.map((h) => h.trim().toLowerCase());
  for (const n of names) { const i = low.indexOf(n.toLowerCase()); if (i >= 0) return i; }
  return -1;
};
const has = (headers: string[], name: string) => headers.some((h) => h.trim().toLowerCase() === name.toLowerCase());

// ---- catégorisation des dépenses bancaires (règles, pas LLM) ------------------

const ADS = /facebk|facebook|meta\b|tiktok|google ads|linkedin|snapchat|taboola/i;
const FX_FEE = /foreign exchange transaction fee|currency conversion fee/i;
const SALARY = /salary|payroll|prestation|salaire/i;
const INTERNAL_IN = /network international|stripe|payout/i; // entrées = règlements Stripe (exclus du CA)
const SAAS = /openai|anthropic|claude|google\b|gworkspace|workspace|vercel|supabase|zoom|slack|notion|close crm|canva|calendly|adobe|apple|dropbox|webflow|make\.com|www make|zapier|manychat|heygen|elevenlabs|hyros|asana|miro|loom|respond io|lemlist|typeform|quaderno|submagic|clickfunnels|webinarjam|hotmart|skool|higgsfield|arcads|artlist|fathom|whoscale|turboscribe|onoff|ionos|hetzner|ovhcloud|wistia|foreplay|buffer|openai|chatgpt|linkedin corp|monday|airtable|stripe|figma/i;

type Cat = "marketing" | "fin_result" | "payroll" | "platform_fees" | "other_opex" | "skip";
function categorize(desc: string): Cat {
  const d = desc.toLowerCase();
  if (ADS.test(d)) return "marketing";
  if (FX_FEE.test(d)) return "fin_result";
  if (SALARY.test(d)) return "payroll";
  if (SAAS.test(d)) return "platform_fees";
  return "other_opex";
}

// ---- parsers par source -------------------------------------------------------

function add(v: Record<string, number>, k: string, amt: number) { v[k] = (v[k] ?? 0) + amt; }

// Stripe — export de paiements (unified_payments) : RÉCEPTION (moyen de paiement), PAS le CA.
// Le CA est facturé via Quaderno ; ici on mesure l'encaissement Stripe + nb de nouveaux abonnements.
function stripePayments(rows: string[][], ctx: ParseCtx): ParsedExtract {
  const h = rows[0];
  const iAmt = idx(h, "Amount"), iCur = idx(h, "Currency"), iStatus = idx(h, "Status"),
        iCap = idx(h, "Captured"), iDesc = idx(h, "Description"), iDate = idx(h, "Created date (UTC)", "Created (UTC)", "Paid at");
  const v: Record<string, number> = {};
  let n = 0, used = 0, received = 0;
  for (const r of rows.slice(1)) {
    if (!inMonth(r[iDate], ctx.period)) continue; // un export peut couvrir plusieurs mois
    const paid = (r[iStatus] ?? "").toLowerCase() === "paid" || (r[iCap] ?? "").toLowerCase() === "true";
    if (!paid) continue;
    const cur = (r[iCur] ?? ctx.reporting).toUpperCase();
    const amt = toNum(r[iAmt]); if (amt == null) continue;
    received += convert(amt, cur, ctx.factor); used++;
    if (iDesc >= 0 && /subscription creation/i.test(r[iDesc] ?? "")) n++;
  }
  if (n) v["new_subs"] = n;
  return { parser: "stripe_payments", role: "payment", source_type: "sales_export", currency: ctx.reporting, values: v,
    revenueCandidate: Math.round(received * 100) / 100,
    sources: { new_subs: "Stripe — nouvelles souscriptions du mois", ca: "Stripe — paiements reçus du mois" }, dedupGroup: "stripe_recv", count: used,
    note: `Réception Stripe : ${Math.round(received).toLocaleString("fr-FR")} ${ctx.reporting} (${used} paiements) — réception, hors CA par défaut (passe le doc en rôle « CA » pour le compter).` };
}

// Stripe — payouts (virements vers la banque) : MOUVEMENT INTERNE.
function stripePayouts(_rows: string[][], ctx: ParseCtx): ParsedExtract {
  return { parser: "stripe_payouts", role: "internal", source_type: "other", currency: ctx.reporting, values: {}, sources: {},
    note: "payouts Stripe → virements internes vers la banque (ni CA ni charge)" };
}

// Quaderno — export de factures (invoices-*.csv) : la SOURCE DE VÉRITÉ DU CA (ce qui est facturé).
// Donne aussi la répartition de la réception par moyen de paiement.
function quaderno(rows: string[][], ctx: ParseCtx): ParsedExtract {
  const h = rows[0];
  const iCur = idx(h, "original_currency"), iAmt = idx(h, "original_amount", "net_amount"),
        iStatus = idx(h, "status"), iDate = idx(h, "payment_date", "date"),
        iType = idx(h, "document_type"), iMethod = idx(h, "payment_method");
  let total = 0, used = 0;
  const byMethod: Record<string, number> = {};
  for (const r of rows.slice(1)) {
    if (iType >= 0 && /credit.?note|avoir|refund/i.test(r[iType] ?? "")) continue; // pas les avoirs
    if (!inMonth(r[iDate], ctx.period)) continue;
    if (iStatus >= 0 && (r[iStatus] ?? "").toLowerCase() !== "paid") continue;
    const amt = toNum(r[iAmt]); if (amt == null) continue;
    const c = convert(amt, (r[iCur] ?? ctx.reporting).toUpperCase(), ctx.factor);
    total += c; used++;
    const m = (iMethod >= 0 ? r[iMethod] : "") || "autre";
    byMethod[m] = (byMethod[m] ?? 0) + c;
  }
  const recap = Object.entries(byMethod).map(([m, x]) => `${m} ${Math.round(x).toLocaleString("fr-FR")}`).join(", ");
  return { parser: "quaderno", role: "revenue", source_type: "invoice", currency: ctx.reporting, values: {},
    revenueCandidate: Math.round(total * 100) / 100,
    sources: { ca: "Quaderno — factures émises du mois (original_amount)" }, dedupGroup: "quaderno_ca", count: used,
    note: recap ? `CA facturé par moyen de paiement : ${recap}.` : undefined };
}

// Whop — export de paiements (exprt) : RÉCEPTION (moyen de paiement), PAS le CA (déjà facturé Quaderno).
function whopExport(rows: string[][], ctx: ParseCtx): ParsedExtract {
  const h = rows[0];
  const iCur = idx(h, "Payment Currency"), iAmt = idx(h, "Payment Amount"),
        iStatus = idx(h, "Status"), iDate = idx(h, "Paid at");
  let used = 0, received = 0;
  for (const r of rows.slice(1)) {
    if ((r[iStatus] ?? "").toLowerCase() !== "paid") continue;
    if (!inMonth(r[iDate], ctx.period)) continue;
    const amt = toNum(r[iAmt]); if (amt == null) continue;
    received += convert(amt, (r[iCur] ?? ctx.reporting).toUpperCase(), ctx.factor); used++;
  }
  return { parser: "whop_export", role: "payment", source_type: "sales_export", currency: ctx.reporting, values: {},
    revenueCandidate: Math.round(received * 100) / 100,
    sources: { ca: "Whop — paiements reçus du mois" }, dedupGroup: "whop_recv", count: used,
    note: `Réception Whop : ${Math.round(received).toLocaleString("fr-FR")} ${ctx.reporting} (${used} paiements) — réception, hors CA par défaut (passe le doc en rôle « CA » pour le compter).` };
}

// Ebury — comptes multi-devises : encaissements clients directs = CA ; salaires/prestations = prestataires.
function ebury(rows: string[][], ctx: ParseCtx): ParsedExtract {
  const h = rows[0];
  const iDesc = idx(h, "Description"), iCur = idx(h, "Currency"), iAmt = idx(h, "Amount"),
        iBal = idx(h, "Balance"), iDate = idx(h, "Timestamp");
  const v: Record<string, number> = {};
  const balByCur: Record<string, number> = {}; // 1ère ligne du mois par devise = solde le plus récent (anti-chrono)
  let used = 0;
  for (const r of rows.slice(1)) {
    const desc = r[iDesc] ?? ""; const cur = (r[iCur] ?? ctx.reporting).toUpperCase();
    const amt = toNum(r[iAmt]); const bal = toNum(r[iBal]);
    if (!inMonth(r[iDate], ctx.period)) continue;
    if (bal != null && balByCur[cur] == null && !/opening balance/i.test(desc)) balByCur[cur] = bal;
    if (amt == null) continue;
    used++;
    const conv = convert(amt, cur, ctx.factor);
    // Entrées "Funds" = encaissements clients = TRÉSORERIE (déjà reflétée dans le solde), pas du CA additionnel
    // (le CA vient des factures Whop + Stripe ; compter aussi les encaissements doublerait).
    if (amt < 0 && SALARY.test(desc)) add(v, "contractors", -conv);
    else if (amt < 0) add(v, "other_opex", -conv);
  }
  let cash = 0; for (const [cur, b] of Object.entries(balByCur)) cash += convert(b, cur, ctx.factor);
  if (Object.keys(balByCur).length) add(v, "cash_end", cash);
  for (const k of Object.keys(v)) v[k] = Math.round(v[k] * 100) / 100;
  return { parser: "ebury", role: "bank", source_type: "bank_statement", currency: ctx.reporting, values: v,
    sources: { contractors: "Ebury — Salary/Payroll", cash_end: "Ebury — solde par devise" },
    dedupGroup: "ebury", count: used };
}

// Relevé bancaire générique signé (Wio, Revolut, Wise) : catégorise les dépenses DU MOIS, somme les soldes par compte.
function bankSigned(rows: string[][], ctx: ParseCtx, name: string): ParsedExtract {
  const h = rows[0];
  const iAmt = idx(h, "Amount", "Transaction amount"), iCur = idx(h, "Account currency", "Currency"),
        iDesc = idx(h, "Description", "Reference", "Narrative"), iBal = idx(h, "Balance"),
        iAcc = idx(h, "Account IBAN", "Account number", "MCV", "Account name"),
        iDate = idx(h, "Date"), iNotes = idx(h, "Notes"), iRef = idx(h, "Reference"), iAdd = idx(h, "Additional Information");
  const v: Record<string, number> = {};
  const lastBal: Record<string, { bal: number; cur: string }> = {};
  let used = 0;
  for (const r of rows.slice(1)) {
    if (iDate >= 0 && !inMonth(r[iDate], ctx.period)) continue;
    // libellé enrichi : certains relevés mettent l'info clé (ex. "Salary") en Notes, pas en Description
    const desc = [r[iDesc], iRef >= 0 ? r[iRef] : "", iNotes >= 0 ? r[iNotes] : "", iAdd >= 0 ? r[iAdd] : ""].filter(Boolean).join(" ");
    const cur = (iCur >= 0 ? r[iCur] : ctx.reporting).toUpperCase();
    const amt = toNum(r[iAmt]); const bal = iBal >= 0 ? toNum(r[iBal]) : null;
    const acc = iAcc >= 0 ? (r[iAcc] || "main") : "main";
    if (bal != null) lastBal[acc] = { bal, cur }; // fichier chrono croissant → dernière du mois = plus récente
    if (amt == null) continue;
    used++;
    const conv = convert(amt, cur, ctx.factor);
    if (amt > 0) continue; // entrées : règlements Stripe / virements — pas de CA ici (CA = Stripe + Ebury)
    const exp = -conv; const cat = categorize(desc);
    if (cat === "fin_result") add(v, "fin_result", -exp); // charge financière (négatif)
    else if (cat === "marketing") { add(v, "marketing", exp); add(v, "ad_spend", exp); }
    else add(v, cat, exp);
  }
  let cash = 0, nAcc = 0;
  for (const { bal, cur } of Object.values(lastBal)) { cash += convert(bal, cur, ctx.factor); nAcc++; }
  if (nAcc) add(v, "cash_end", Math.round(cash * 100) / 100);
  for (const k of Object.keys(v)) v[k] = Math.round(v[k] * 100) / 100;
  return { parser: "bank_signed", role: "bank", source_type: "bank_statement", currency: ctx.reporting, values: v, count: used,
    sources: { marketing: `${name} — pub (FACEBK…)`, payroll: `${name} — Salary`, platform_fees: `${name} — outils/SaaS`,
      fin_result: `${name} — frais de change`, other_opex: `${name} — autres dépenses`, cash_end: `${name} — solde(s) de clôture` } };
}

// ---- Shopify (exports analytics) ----------------------------------------------
// Chaque rapport Shopify a son propre schéma : on mappe vers les indicateurs e-commerce.
function shopify(name: string, rows: string[][], ctx: ParseCtx): ParsedExtract | null {
  const h = rows[0]; const data = rows.slice(1);
  const sumCol = (col: number, iDate: number) => {
    let s = 0; for (const r of data) { if (iDate >= 0 && !inMonth(r[iDate], ctx.period)) continue; const n = toNum(r[col]); if (n != null) s += n; }
    return Math.round(s * 100) / 100;
  };
  const mk = (role: DocRole, values: Record<string, number>, sources: Record<string, string>, extra: Partial<ParsedExtract> = {}): ParsedExtract =>
    ({ parser: "shopify", role, source_type: "sales_export", currency: ctx.reporting, values, sources, ...extra });

  // Ventes : "Net sales by order" / "Discounts by order" → CA, commandes, brut, retours, articles.
  if (has(h, "Net sales") && has(h, "Order name")) {
    const iNet = idx(h, "Net sales"), iDate = idx(h, "Day"), iOrder = idx(h, "Order name"),
          iGross = idx(h, "Gross sales"), iRet = idx(h, "Returns"), iProd = idx(h, "Product title at time of sale");
    const orders = new Set<string>(); let ca = 0, gross = 0, ret = 0, units = 0;
    for (const r of data) {
      if (!inMonth(r[iDate], ctx.period)) continue;
      const net = toNum(r[iNet]);
      if (net != null) { ca += net; if (net > 0 && r[iOrder]) { orders.add(r[iOrder]); if (iProd >= 0 && (r[iProd] ?? "").trim()) units++; } }
      if (iGross >= 0) { const g = toNum(r[iGross]); if (g != null) gross += g; }
      if (iRet >= 0) { const rr = toNum(r[iRet]); if (rr != null) ret += rr; }
    }
    const v: Record<string, number> = { ca: Math.round(ca * 100) / 100, orders: orders.size };
    if (units) v.units = units;
    if (iGross >= 0) v.gross_sales = Math.round(gross * 100) / 100;
    if (iRet >= 0) v.refunds = Math.round(-ret * 100) / 100; // Returns négatifs → remboursements positifs
    // le fichier riche (avec Gross sales) prime au dédoublonnage
    return mk("revenue", v, { ca: `Shopify (${name}) — net sales`, orders: "Shopify — commandes distinctes du mois" },
      { revenueCandidate: v.ca, dedupGroup: "shopify_ca", count: iGross >= 0 ? 1_000_000 : orders.size });
  }
  // Sessions / visiteurs (et fichiers de conversion qui portent aussi Sessions)
  if (has(h, "Sessions") && (has(h, "Online store visitors") || has(h, "Conversion rate"))) {
    const iDate = idx(h, "Day"), iSess = idx(h, "Sessions");
    // add_to_carts vient UNIQUEMENT du rapport "Customer behavior" (évite tout double comptage).
    return mk("analytics", { sessions: sumCol(iSess, iDate) }, { sessions: "Shopify — sessions du mois" }, { dedupGroup: "shopify_sessions", count: data.length });
  }
  // Comportement (totaux mensuels du funnel : une seule ligne)
  if (has(h, "Sessions with cart additions") && has(h, "Sessions that completed checkout") && !has(h, "Day")) {
    const iCart = idx(h, "Sessions with cart additions"); const c = toNum((data[0] ?? [])[iCart]);
    const v: Record<string, number> = {}; if (c != null) v.add_to_carts = c;
    return mk("analytics", v, { add_to_carts: "Shopify — sessions avec ajout panier (mois)" }, { dedupGroup: "shopify_sessions_carts", count: 1_000_000 });
  }
  // Nouveaux vs récurrents (tableau de synthèse, pas la série temporelle)
  if (has(h, "New or returning customer") && has(h, "Customers") && !has(h, "Day")) {
    const iType = idx(h, "New or returning customer"), iCust = idx(h, "Customers");
    let nw = 0, ret = 0;
    for (const r of data) { const n = toNum(r[iCust]); if (n == null) continue; if (/new/i.test(r[iType] ?? "")) nw += n; else if (/return/i.test(r[iType] ?? "")) ret += n; }
    return mk("analytics", { new_customers: nw, returning_customers: ret, total_customers: nw + ret },
      { new_customers: "Shopify — nouveaux clients", returning_customers: "Shopify — clients récurrents" }, { dedupGroup: "shopify_customers", count: 1_000_000 });
  }
  // Paiements (PSP) : "Net payments by gateway/method" → réception, PAS le CA.
  if ((has(h, "Payment gateway") || has(h, "Payment method")) && has(h, "Net payments")) {
    const iNet = idx(h, "Net payments"); let s = 0; for (const r of data) { const n = toNum(r[iNet]); if (n != null) s += n; }
    return mk("payment", {}, {}, { note: `Réception PSP (Shopify Payments) : ${Math.round(s).toLocaleString("fr-FR")} ${ctx.reporting} — réception, pas le CA.` });
  }
  // Autres exports analytics (recherches, one-time customers, séries temporelles, localisation…) : ignorés proprement (pas d'IA).
  return mk("analytics", {}, {}, { note: `Export Shopify analytique (${name}) — non agrégé (info uniquement).` });
}

// ---- routeur ------------------------------------------------------------------

// Renvoie un ParsedExtract si un parser déterministe reconnaît le fichier, sinon null (→ IA).
export function parseFile(name: string, text: string, ctx: ParseCtx): ParsedExtract | null {
  if (!text || !text.trim()) return null;
  const rows = parseCsv(text);
  if (rows.length < 2) return null;
  const h = rows[0];

  // Shopify : détecté par les en-têtes caractéristiques de ses rapports.
  const shopifyHit = has(h, "Net sales") || has(h, "Online store visitors") || has(h, "Sessions with cart additions") ||
    has(h, "New or returning customer") || has(h, "Search query") || has(h, "Customer first order date") ||
    has(h, "Checkout conversion rate") || has(h, "Sessions") || (has(h, "Day") && has(h, "Total sales")) ||
    ((has(h, "Payment gateway") || has(h, "Payment method")) && has(h, "Net payments"));
  if (shopifyHit) { const s = shopify(name, rows, ctx); if (s) return s; }

  if (has(h, "Converted Amount") && has(h, "Captured")) return stripePayments(rows, ctx);
  if (has(h, "Arrival Date (UTC)") || (has(h, "Destination Name") && has(h, "Source Type"))) return stripePayouts(rows, ctx);
  if (has(h, "document_type") && has(h, "accounting_currency")) return quaderno(rows, ctx);
  if (has(h, "Payment Amount") && has(h, "Total Amount USD (Including Fees)")) return whopExport(rows, ctx);
  if (has(h, "Timestamp") && has(h, "Additional Information") && has(h, "Balance")) return ebury(rows, ctx);
  if (has(h, "Paid In") && has(h, "Paid Out")) return bankSigned(rows, ctx, "3S Money");
  if (has(h, "Account IBAN") && has(h, "Transaction type")) return bankSigned(rows, ctx, "Wio");
  if (has(h, "Balance") && (has(h, "Amount") || has(h, "Transaction amount")) && (has(h, "Currency") || has(h, "Account currency")))
    return bankSigned(rows, ctx, "Banque");
  return null;
}
