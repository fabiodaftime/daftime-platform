// Parsers DÉTERMINISTES par source à format stable (Stripe, Wio, Ebury, 3S Money, Whop).
// Objectif : sortir des chiffres EXACTS sans appel LLM (fiabilité + vitesse), et ne laisser
// l'IA que sur ce qui est vraiment ambigu (PDF/scan/format inconnu).
// Chaque parser convertit déjà dans la devise de reporting via le facteur fourni.
//
// Convention de retour : valeurs ADDITIVES par poste (l'orchestrateur somme entre fichiers),
// les doubles comptages connus sont exclus ICI (Whop≈Stripe, payouts/Network International internes).

import { convert } from "./fx.ts";
import type { SourceType } from "./reconcile.ts";

export interface ParseCtx {
  reporting: string; factor: Record<string, number>; period: string;
  activity?: string;                                  // slug d'activité (mappe les charges vers les bons postes)
  categoryRules?: { match: string; category: string }[]; // règles par client (ex. "paypal" -> "ads")
  // Soldes bancaires de référence (onboarding) : un solde connu à une date permet de reconstituer
  // la trésorerie de fin de mois à partir d'un relevé SANS colonne de solde (ex. Pennylane).
  bankAnchors?: { account: string; date: string; balance: number }[];
}
// Rôle COMPTABLE du document — déterminé par le type de source, jamais deviné :
//  revenue  = ce qui est FACTURÉ (= le CA). Une seule source fait foi (ex. Quaderno).
//  payment  = réception d'un encaissement par un moyen de paiement (Stripe/Whop) → PAS du CA.
//  bank     = relevé bancaire → trésorerie (soldes) + charges (sorties).
//  internal = mouvement interne (payout, virement entre comptes) → ignoré.
export type DocRole = "revenue" | "payment" | "bank" | "internal" | "analytics" | "ads" | "expense";
export interface BreakdownColumn { key: string; label: string; unit?: "CUR" | "%" | "x" | "j" | ""; align?: "left" | "right"; emphasis?: boolean; sort?: boolean }
export interface Breakdown { label: string; rows: { label: string; value: number; values?: Record<string, number>; unit?: string }[]; columns?: BreakdownColumn[]; total_row?: boolean }
export interface ParsedExtract {
  parser: string;
  file?: string;               // nom du fichier source (renseigné par l'orchestrateur après parseFile)
  role: DocRole;
  source_type: SourceType;
  currency: string;            // = reporting (déjà converti)
  values: Record<string, number>;
  revenueCandidate?: number;   // montant qui devient le CA SI le rôle effectif du doc = "revenue"
  sources: Record<string, string>;
  note?: string;
  dedupGroup?: string;         // doublons potentiels (ex. Stripe multi-mois, Ebury -EUR vs -all_currencies)
  count?: number;              // nb de lignes du mois utilisées (sert au dédoublonnage : on garde le plus complet)
  breakdowns?: Record<string, Breakdown>; // données dimensionnelles (ventes par pays, top produits…)
  // EXCLUSIF : les valeurs sont le MÊME fait vu par plusieurs rapports (ex. « Total sales over time »
  // et « Gross sales over time » donnent tous deux le CA brut d'août) → jamais additionnées entre
  // fichiers : on garde la source de plus haute `priority`, les autres servent de contrôle.
  // Non exclusif (défaut) = contributions additives (ex. plusieurs factures logistiques du mois).
  exclusive?: boolean;
  priority?: number;
  aux?: Record<string, unknown>;  // données annexes pour l'orchestrateur (ex. lignes de vente sans coût)
}

const topN = (m: Record<string, number>, n = 8): { label: string; value: number }[] =>
  Object.entries(m).filter(([k]) => k).sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, value]) => ({ label, value: Math.round(value * 100) / 100 }));

// Date → "YYYY-MM-DD". Gère ISO (YYYY-MM-DD[Thh…]) et FR (JJ/MM/AAAA, zéros optionnels : "27/5/2026").
export const isoOf = (dateStr: string | undefined): string | null => {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
};
// Vrai si la date tombe dans le mois de la période (YYYY-MM-01).
const inMonth = (dateStr: string | undefined, period: string): boolean => (isoOf(dateStr) ?? "").slice(0, 7) === period.slice(0, 7);
const r2 = (x: number) => Math.round(x * 100) / 100;
const fmtE = (x: number) => Math.round(x).toLocaleString("fr-FR");
const lastDayOf = (period: string): string => {
  const [y, mo] = period.slice(0, 7).split("-").map(Number);
  return `${period.slice(0, 7)}-${String(new Date(Date.UTC(y, mo, 0)).getUTCDate()).padStart(2, "0")}`;
};
const prevPeriod = (period: string): string => {
  const [y, mo] = period.slice(0, 7).split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
};

// Période couverte, lue dans le nom de fichier ("… - 2026-01-01 - 2026-08-31.csv", "orders_20260101-20260831.csv").
// Un rapport CUMULÉ (sans colonne de date) ne vaut que pour le mois de FIN : on ne rattache jamais un
// total multi-mois à un seul mois.
export function filenameRange(name: string): { from: string; to: string } | null {
  let m = name.match(/(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})/);
  if (m) return { from: m[1], to: m[2] };
  m = name.match(/(\d{4})(\d{2})(\d{2})\s*-\s*(\d{4})(\d{2})(\d{2})/);
  if (m) return { from: `${m[1]}-${m[2]}-${m[3]}`, to: `${m[4]}-${m[5]}-${m[6]}` };
  return null;
}

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

// Variante ÉCONOME pour les exports très larges (ex. commandes Bigblue : ~150 colonnes, 16 000 lignes
// → 140 Mo en mémoire avec parseCsv) : l'en-tête est complet, mais pour les lignes on ne construit
// QUE les colonnes utiles (les autres valent "", sans allocation). Mêmes index de colonnes.
export function parseCsvKeep(text: string, keep: Set<number>): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cur = "", q = false, col = 0, header = true, k = true;
  const push = () => { row.push(k ? cur : ""); cur = ""; col++; k = header || keep.has(col); };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { if (k) cur += '"'; i++; } else q = false; }
      else if (k) cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") push();
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      push(); if (row.some((x) => x !== "")) rows.push(row);
      row = []; col = 0; header = false; k = keep.has(0);
    } else if (k) cur += c;
  }
  if (cur !== "" || row.length) { push(); if (row.some((x) => x !== "")) rows.push(row); }
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
const SAAS = /shopify|paytabs|openai|anthropic|claude|gworkspace|workspace|vercel|supabase|zoom|slack|notion|close crm|canva|calendly|adobe|dropbox|webflow|make\.com|www make|zapier|manychat|heygen|elevenlabs|hyros|asana|miro|loom|respond io|lemlist|typeform|quaderno|submagic|clickfunnels|webinarjam|hotmart|skool|higgsfield|arcads|artlist|fathom|whoscale|turboscribe|onoff|ionos|hetzner|ovhcloud|wistia|foreplay|buffer|chatgpt|monday|airtable|figma/i;

// Catégorie CANONIQUE de dépense, traduite ensuite vers les postes du catalogue selon l'activité.
type Canon = "cogs" | "ads" | "payroll" | "tools" | "fin" | "other";
function categorize(desc: string, rules?: { match: string; category: string }[]): Canon {
  const d = desc.toLowerCase();
  for (const r of rules ?? []) if (r.match && d.includes(r.match.toLowerCase())) return r.category as Canon; // règles du dossier en priorité
  if (ADS.test(d)) return "ads";
  if (FX_FEE.test(d)) return "fin";
  if (SALARY.test(d)) return "payroll";
  if (SAAS.test(d)) return "tools";
  return "other";
}
// Traduction canonique -> id(s) de poste, par activité (un poste pub différent en e-com vs coach…).
const EXPENSE_MAP: Record<string, Record<Canon, string[]>> = {
  ecommerce: { cogs: ["cogs"], ads: ["ads_total"], payroll: ["payroll"], tools: ["platform_fees"], fin: ["financial_result"], other: ["other_opex"] },
  coach: { cogs: ["other_opex"], ads: ["marketing", "ad_spend"], payroll: ["payroll"], tools: ["platform_fees"], fin: ["fin_result"], other: ["other_opex"] },
  default: { cogs: ["cogs"], ads: ["marketing", "ad_spend"], payroll: ["payroll"], tools: ["platform_fees"], fin: ["fin_result"], other: ["other_opex"] },
};

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
    sources: { new_subs: `décompte des lignes «Description» = "subscription creation" · ${n} ligne(s)`, ca: `Σ colonne «Amount» (converti en ${ctx.reporting}) · filtre statut=Paid & mois ${ctx.period} · ${used} paiement(s)` }, dedupGroup: "stripe_recv", count: used,
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
    sources: { ca: `Σ colonne «original_amount» (converti en ${ctx.reporting}) · filtre status=paid, hors avoirs, mois ${ctx.period} · ${used} facture(s)` }, dedupGroup: "quaderno_ca", count: used,
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
    sources: { ca: `Σ colonne «Payment Amount» (converti en ${ctx.reporting}) · filtre Status=paid & mois ${ctx.period} · ${used} paiement(s)` }, dedupGroup: "whop_recv", count: used,
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
    sources: {
      contractors: `Σ débits «Amount» où Description = Salary/Payroll (converti en ${ctx.reporting}) · mois ${ctx.period}`,
      other_opex: `Σ autres débits «Amount» (hors salaires, converti en ${ctx.reporting}) · mois ${ctx.period}`,
      cash_end: `solde «Balance» le plus récent du mois, sommé par devise (converti en ${ctx.reporting})`,
    },
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
    if (amt > 0) continue; // entrées : règlements Stripe / virements — pas de CA ici
    const exp = -conv; const cat = categorize(desc, ctx.categoryRules);
    const map = EXPENSE_MAP[ctx.activity ?? ""] ?? EXPENSE_MAP.default;
    for (const id of (map[cat] ?? ["other_opex"])) add(v, id, cat === "fin" ? -exp : exp); // résultat financier en négatif
  }
  let cash = 0, nAcc = 0;
  for (const { bal, cur } of Object.values(lastBal)) { cash += convert(bal, cur, ctx.factor); nAcc++; }
  if (nAcc) add(v, "cash_end", Math.round(cash * 100) / 100);
  for (const k of Object.keys(v)) v[k] = Math.round(v[k] * 100) / 100;
  const src = (cat: string) => `Σ débits «${h[iAmt] ?? 'Amount'}» classés « ${cat} » (converti en ${ctx.reporting}) · mois ${ctx.period}`;
  void name;
  return { parser: "bank_signed", role: "bank", source_type: "bank_statement", currency: ctx.reporting, values: v, count: used,
    sources: { cogs: src("achats fournisseurs"), ads_total: src("publicité"), marketing: src("publicité"), ad_spend: src("publicité"), payroll: src("salaires"),
      platform_fees: src("outils/SaaS"), financial_result: src("frais de change"), fin_result: src("frais de change"),
      other_opex: src("autres dépenses"),
      cash_end: `dernier solde «Balance» du mois par compte, sommé (converti en ${ctx.reporting}) · ${nAcc} compte(s)` } };
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
  const ym = ctx.period.slice(0, 7);
  const short = name.replace(/\.[a-z0-9]+$/i, "").replace(/\s*-\s*\d{4}-\d{2}-\d{2}.*$/, "").trim();
  const col = (label: string) => h.findIndex((x) => x.trim().toLowerCase() === label.toLowerCase()); // exact → exclut les colonnes « (previous_year) »

  // ---- SÉRIES MENSUELLES (colonne « Month ») : on prend la/les ligne(s) du mois ciblé. -----------
  // Avant : ces rapports étaient soit ignorés (« info uniquement »), soit ADDITIONNÉS sur tous les mois.
  const iMonth = idx(h, "Month");
  if (iMonth >= 0) {
    const rowsM = data.filter((r) => (isoOf(r[iMonth]) ?? "").slice(0, 7) === ym);
    const pick = (label: string): number | undefined => {
      const i = col(label); if (i < 0) return undefined;
      let s = 0, any = false; for (const r of rowsM) { const n = toNum(r[i]); if (n != null) { s += n; any = true; } }
      return any ? r2(s) : undefined;
    };
    const src = (label: string) => `colonne «${label}», ligne Month=${ym} · rapport Shopify « ${short} »`;
    if (!rowsM.length) return mk("analytics", {}, {}, { exclusive: true, priority: 0, note: `Rapport Shopify « ${short} » : aucune ligne pour ${ym}.` });

    // Nouveaux vs récurrents : une ligne par type et par mois.
    if (has(h, "New or returning customer") && has(h, "Customers")) {
      const iType = idx(h, "New or returning customer"), iCust = col("Customers");
      let nw = 0, ret = 0;
      for (const r of rowsM) { const n = toNum(r[iCust]); if (n == null) continue; if (/new/i.test(r[iType] ?? "")) nw += n; else if (/return/i.test(r[iType] ?? "")) ret += n; }
      return mk("analytics", { new_customers: nw, returning_customers: ret, total_customers: nw + ret },
        { new_customers: `Σ «Customers» où type=New · Month=${ym}`, returning_customers: `Σ «Customers» où type=Returning · Month=${ym}`, total_customers: `nouveaux + récurrents · Month=${ym}` },
        { exclusive: true, priority: 100 });
    }
    // Coût des marchandises vendues PAR COMMANDE (coût par article Shopify) → COGS exact du mois.
    if (has(h, "Cost of goods sold") && (has(h, "Order name") || has(h, "Sale ID"))) {
      const iC = col("Cost of goods sold"), iT = idx(h, "Product title at time of sale"), iV = idx(h, "Product variant title at time of sale");
      let cogs = 0, lines = 0; const zero: Record<string, number> = {};
      for (const r of rowsM) {
        const c = toNum(r[iC]); if (c == null) continue; cogs += c; lines++;
        if (c === 0 && iT >= 0) { const t = (r[iT] ?? "").trim(); if (t) zero[t] = (zero[t] ?? 0) + 1; }
      }
      const nZero = Object.values(zero).reduce((a, x) => a + x, 0);
      return mk("analytics", { cogs: r2(cogs) }, { cogs: `Σ «Cost of goods sold» (coût par article Shopify) · Month=${ym} · ${lines} ligne(s) de vente` },
        { exclusive: true, priority: 100, aux: { cogsZeroLines: zero, cogsLines: lines },
          note: nZero ? `COGS Shopify : ${nZero} ligne(s) de vente sur ${lines} sans coût renseigné en ${ym} — complétées par tes coûts SKU (onboarding) quand ils existent.` : undefined });
    }
    // Shopify Payments : réception, PAS le CA.
    if (has(h, "Gross payments")) {
      const g = pick("Gross payments"), t = pick("Transactions");
      return mk("payment", {}, {}, { exclusive: true, priority: 0, note: g != null ? `Shopify Payments (réception, pas le CA) : ${fmtE(g)} ${ctx.reporting} · ${t ?? "?"} transaction(s) en ${ym}.` : undefined });
    }
    // Séries ventes / trafic : mapping par NOM DE COLONNE exact.
    const v: Record<string, number> = {}; const s: Record<string, string> = {};
    const set = (id: string, label: string, val: number | undefined, tf: (x: number) => number = (x) => x) => { if (val != null) { v[id] = r2(tf(val)); s[id] = src(label); } };
    set("ca", "Net sales", pick("Net sales"));
    set("gross_sales", "Gross sales", pick("Gross sales"));
    const rev = pick("Sales reversals"); set("refunds", rev != null ? "Sales reversals" : "Returns", rev ?? pick("Returns"), Math.abs);
    set("orders", "Orders", pick("Orders"));
    set("sessions", "Sessions", pick("Sessions"));
    set("add_to_carts", "Sessions with cart additions", pick("Sessions with cart additions"));
    if (!Object.keys(v).length) return mk("analytics", {}, {}, { exclusive: true, priority: 0 }); // ratio dérivé (panier moyen, qté/commande…) : recalculé par le moteur
    // Plusieurs rapports donnent le même fait : Total sales > AOV > Gross sales ; Sessions > Conversion.
    const priority = has(h, "Net sales") ? 100 : has(h, "Average order value") ? 60
      : has(h, "Online store visitors") ? 100 : has(h, "Sessions with cart additions") ? 90 : 50;
    const extras: string[] = [];
    const disc = pick("Discounts"), ship = pick("Shipping charges"), tax = pick("Taxes"), vis = pick("Online store visitors");
    if (disc != null) extras.push(`remises ${fmtE(Math.abs(disc))}`);
    if (ship != null) extras.push(`frais de port facturés ${fmtE(ship)} (hors CA net)`);
    if (tax != null) extras.push(`taxes ${fmtE(tax)}`);
    if (vis != null) extras.push(`${fmtE(vis)} visiteurs`);
    const isRevenue = v.ca != null;
    return mk(isRevenue ? "revenue" : "analytics", v, s, {
      exclusive: true, priority, ...(isRevenue ? { revenueCandidate: v.ca } : {}),
      // Note uniquement sur le rapport de référence (évite les doublons « remises » d'un rapport secondaire).
      note: extras.length && priority >= 100 ? `Shopify ${ym} (« ${short} ») : ${extras.join(" · ")} ${ctx.reporting}.` : undefined,
    });
  }

  // ---- Rapports CUMULÉS sur une plage (pas de colonne de date) -----------------------------------
  // Un cumul janv.→août ne s'attribue JAMAIS à août : il ne vaut que pour le mois de FIN, et seulement
  // pour ce qui est un état « à date » (stock) ou une répartition explicitement libellée « cumul ».
  const range = filenameRange(name);
  const hasDateCol = has(h, "Day") || has(h, "Month") || has(h, "Date");
  if (range && !hasDateCol) {
    const multi = range.from.slice(0, 7) !== range.to.slice(0, 7);
    const isEnd = range.to.slice(0, 7) === ym;
    const lab = `cumul du ${range.from.split("-").reverse().join("/")} au ${range.to.split("-").reverse().join("/")}`;
    if (!isEnd) return mk("analytics", {}, {}, { exclusive: true, priority: 0, note: `« ${short} » couvre une autre période (${lab}) : non rattaché à ${ym}.` });
    // Stock valorisé : état à date (fin de plage) → valable pour le mois de fin.
    if (has(h, "Ending inventory value")) {
      const i = col("Ending inventory value"); let tot = 0; for (const r of data) { const n = toNum(r[i]); if (n != null) tot += n; }
      return mk("analytics", { inventory_value: r2(tot) }, { inventory_value: `Σ «Ending inventory value» au ${range.to} · ${data.length} variante(s)` }, { exclusive: true, priority: 100 });
    }
    if (multi) {
      const iT = col("Product title"), iNs = col("Net sales"), iCg = col("Cost of goods sold");
      // Marge par produit (cumul) → matrice produit libellée « cumul ».
      if (iT >= 0 && iNs >= 0 && !has(h, "Product variant title")) {
        const rowsP = data.map((r) => ({ t: (r[iT] ?? "").trim(), ns: toNum(r[iNs]) ?? 0, cg: iCg >= 0 ? (toNum(r[iCg]) ?? 0) : null }))
          .filter((x) => x.t && x.ns > 0).sort((a, b) => b.ns - a.ns).slice(0, 15);
        if (rowsP.length) {
          const withCogs = iCg >= 0;
          const bk: Breakdown = withCogs ? {
            label: `Marge par produit — ${lab}`, total_row: true,
            columns: [
              { key: "net_sales", label: "Ventes nettes", unit: "CUR", align: "right", sort: true },
              { key: "cogs", label: "COGS", unit: "CUR", align: "right" },
              { key: "gross_profit", label: "Marge brute", unit: "CUR", align: "right", emphasis: true },
              { key: "margin", label: "Taux de marge", unit: "%", align: "right" },
            ],
            rows: rowsP.map((x) => ({ label: x.t, value: r2(x.ns), values: { net_sales: r2(x.ns), cogs: r2(x.cg ?? 0), gross_profit: r2(x.ns - (x.cg ?? 0)), margin: x.ns ? Math.round(((x.ns - (x.cg ?? 0)) / x.ns) * 1000) / 10 : 0 } })),
          } : { label: `Top produits (ventes nettes) — ${lab}`, rows: rowsP.map((x) => ({ label: x.t, value: r2(x.ns) })) };
          return mk("analytics", {}, {}, { exclusive: true, priority: withCogs ? 60 : 40, breakdowns: { [withCogs ? "product_margin_period" : "top_products_period"]: bk },
            note: `« ${short} » (${lab}) → répartition par produit ; aucune valeur mensuelle tirée de ce cumul.` });
        }
      }
      // Synthèse de marge : sert à mesurer la couverture des coûts dans Shopify.
      if (has(h, "Net sales without cost recorded")) {
        const n = toNum(data[0]?.[col("Net sales")]), w = toNum(data[0]?.[col("Net sales without cost recorded")]);
        return mk("analytics", {}, {}, { exclusive: true, priority: 0,
          note: n && w != null ? `Sur la période (${lab}), ${Math.round((w / n) * 1000) / 10} % des ventes nettes n'ont pas de coût renseigné dans Shopify (${fmtE(w)} ${ctx.reporting}).` : undefined });
      }
      return mk("analytics", {}, {}, { exclusive: true, priority: 0 }); // détail par variante d'un cumul : non repris
    }
  }

  // Ventes : "Net sales by order" / "Discounts by order" → CA, commandes, brut, retours, articles.
  if (has(h, "Net sales") && has(h, "Order name")) {
    const iNet = idx(h, "Net sales"), iDate = idx(h, "Day"), iOrder = idx(h, "Order name"),
          iGross = idx(h, "Gross sales"), iRet = idx(h, "Returns"), iProd = idx(h, "Product title at time of sale");
    const orders = new Set<string>(); let ca = 0, gross = 0, ret = 0, units = 0; const prod: Record<string, number> = {}; const daily: Record<string, number> = {};
    for (const r of data) {
      if (!inMonth(r[iDate], ctx.period)) continue;
      const net = toNum(r[iNet]);
      if (net != null) {
        ca += net;
        const day = (r[iDate] ?? "").trim().slice(0, 10); if (day) daily[day] = (daily[day] ?? 0) + net;
        if (net > 0 && r[iOrder]) { orders.add(r[iOrder]); if (iProd >= 0 && (r[iProd] ?? "").trim()) { units++; prod[(r[iProd] ?? "").trim()] = (prod[(r[iProd] ?? "").trim()] ?? 0) + net; } }
      }
      if (iGross >= 0) { const g = toNum(r[iGross]); if (g != null) gross += g; }
      if (iRet >= 0) { const rr = toNum(r[iRet]); if (rr != null) ret += rr; }
    }
    const v: Record<string, number> = { ca: Math.round(ca * 100) / 100, orders: orders.size };
    if (units) v.units = units;
    if (iGross >= 0) v.gross_sales = Math.round(gross * 100) / 100;
    if (iRet >= 0) v.refunds = Math.round(-ret * 100) / 100; // Returns négatifs → remboursements positifs
    const breakdowns: Record<string, { label: string; rows: { label: string; value: number }[] }> = {};
    if (Object.keys(prod).length) {
      breakdowns.top_products = { label: "Top produits (CA net)", rows: topN(prod) };
      // Catalogue COMPLET (jusqu'à 300 SKU) — sert au pré-remplissage de l'onboarding (coûts par SKU).
      breakdowns.products_catalog = { label: "Catalogue produits (ventes du mois)",
        rows: Object.entries(prod).sort((a, b) => b[1] - a[1]).slice(0, 300).map(([label, value]) => ({ label, value: Math.round(value * 100) / 100 })) };
    }
    if (Object.keys(daily).length) breakdowns.daily_sales = { label: "Ventes par jour", rows: Object.entries(daily).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([label, value]) => ({ label, value: Math.round(value * 100) / 100 })) };
    // le fichier riche (avec Gross sales) prime au dédoublonnage
    return mk("revenue", v, {
      ca: `Σ colonne «Net sales» · mois ${ctx.period} · ${orders.size} commande(s)`,
      orders: `décompte des «Order name» distincts (Net sales>0) · mois ${ctx.period}`,
      ...(iGross >= 0 ? { gross_sales: `Σ colonne «Gross sales» · mois ${ctx.period}` } : {}),
      ...(iRet >= 0 ? { refunds: `−Σ colonne «Returns» · mois ${ctx.period}` } : {}),
      ...(units ? { units: `décompte des lignes avec «Product title…» · mois ${ctx.period}` } : {}),
    }, { revenueCandidate: v.ca, exclusive: true, priority: iGross >= 0 ? 95 : 90, breakdowns });
  }
  // Sessions par PAYS ("Sessions by location") → breakdown (et PAS de valeur sessions pour éviter le double-comptage).
  if (has(h, "Session country")) {
    const iC = idx(h, "Session country"), iR = idx(h, "Session region"), iCity = idx(h, "Session city"), iS = idx(h, "Sessions");
    const tot: Record<string, number> = {};
    for (const r of data) {
      if ((r[iR] ?? "") !== "" || (r[iCity] ?? "") !== "") continue; // ne garder que les lignes "total pays"
      const c = (r[iC] ?? "").trim(); const s = toNum(r[iS]); if (c && s != null) tot[c] = (tot[c] ?? 0) + s;
    }
    return mk("analytics", {}, {}, { breakdowns: { sessions_by_country: { label: "Sessions par pays", rows: topN(tot) } } });
  }
  // Sessions / visiteurs (et fichiers de conversion qui portent aussi Sessions)
  if (has(h, "Sessions") && (has(h, "Online store visitors") || has(h, "Conversion rate"))) {
    const iDate = idx(h, "Day"), iSess = idx(h, "Sessions");
    // add_to_carts vient UNIQUEMENT du rapport "Customer behavior" (évite tout double comptage).
    if (iDate < 0) return mk("analytics", {}, {}, { exclusive: true, priority: 0, note: `« ${short} » : pas de colonne de date — sessions non attribuables à ${ym}.` });
    return mk("analytics", { sessions: sumCol(iSess, iDate) }, { sessions: `Σ colonne «Sessions» · mois ${ctx.period}` }, { exclusive: true, priority: has(h, "Online store visitors") ? 100 : 90 });
  }
  // Comportement (totaux mensuels du funnel : une seule ligne)
  if (has(h, "Sessions with cart additions") && has(h, "Sessions that completed checkout") && !has(h, "Day")) {
    const iCart = idx(h, "Sessions with cart additions"); const c = toNum((data[0] ?? [])[iCart]);
    const v: Record<string, number> = {}; if (c != null) v.add_to_carts = c;
    return mk("analytics", v, { add_to_carts: `colonne «Sessions with cart additions» (total mensuel)` }, { exclusive: true, priority: 100 });
  }
  // Nouveaux vs récurrents (tableau de synthèse, pas la série temporelle)
  if (has(h, "New or returning customer") && has(h, "Customers") && !has(h, "Day")) {
    const iType = idx(h, "New or returning customer"), iCust = idx(h, "Customers");
    let nw = 0, ret = 0;
    for (const r of data) { const n = toNum(r[iCust]); if (n == null) continue; if (/new/i.test(r[iType] ?? "")) nw += n; else if (/return/i.test(r[iType] ?? "")) ret += n; }
    return mk("analytics", { new_customers: nw, returning_customers: ret, total_customers: nw + ret },
      { new_customers: `Σ «Customers» où type=New · mois ${ctx.period}`, returning_customers: `Σ «Customers» où type=Returning · mois ${ctx.period}`, total_customers: `nouveaux + récurrents · mois ${ctx.period}` }, { exclusive: true, priority: 90 });
  }
  // Paiements (PSP) : "Net payments by gateway/method" → réception, PAS le CA (+ ventes par pays si dispo).
  if ((has(h, "Payment gateway") || has(h, "Payment method")) && has(h, "Net payments")) {
    const iNet = idx(h, "Net payments"), iCtry = idx(h, "Billing country"), iMethod = idx(h, "Payment method", "Payment gateway");
    let s = 0; const byCtry: Record<string, number> = {}; const byMethod: Record<string, number> = {};
    for (const r of data) {
      const n = toNum(r[iNet]); if (n == null) continue; s += n;
      if (iCtry >= 0) { const c = (r[iCtry] ?? "").trim(); if (c) byCtry[c] = (byCtry[c] ?? 0) + n; }
      if (iMethod >= 0) { const mth = (r[iMethod] ?? "").trim(); if (mth) byMethod[mth] = (byMethod[mth] ?? 0) + n; }
    }
    const breakdowns: Record<string, Breakdown> = {};
    if (Object.keys(byCtry).length) breakdowns.sales_by_country = { label: "Encaissements par pays", rows: topN(byCtry) };
    if (Object.keys(byMethod).length) breakdowns.payments_by_method = { label: "Encaissements par méthode", rows: topN(byMethod) };
    return mk("payment", {}, {}, { note: `Réception PSP (Shopify Payments) : ${Math.round(s).toLocaleString("fr-FR")} ${ctx.reporting} — réception, pas le CA.`, breakdowns: Object.keys(breakdowns).length ? breakdowns : undefined });
  }
  // FALLBACK ENRICHI : tout export « dimension → total » (recherches, remises, canaux, appareils…)
  // devient un BREAKDOWN exploitable. On EXCLUT les taux/% et les séries temporelles (une somme y serait fausse).
  {
    const lname = name.toLowerCase();
    const isRateOrTime = /\brate\b|conversion|over time|par jour|per day|%/.test(lname) || h.some((x) => /rate|%/.test(x.toLowerCase()));
    const firstIsDate = data.length > 0 && /^\s*(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/.test(data[0]?.[0] ?? "");
    if (!isRateOrTime && !firstIsDate && h.length >= 2 && data.length >= 2) {
      // Colonne valeur = dernière colonne majoritairement numérique ; dimension = 1re colonne (texte).
      let iVal = -1;
      for (let c = h.length - 1; c >= 1; c--) {
        if (/previous_year|%|rate|change/i.test(h[c] ?? "")) continue; // jamais une colonne N-1 ou une variation
        const sample = data.slice(0, 6);
        if (sample.filter((r) => toNum(r[c]) != null).length >= Math.min(2, sample.length)) { iVal = c; break; }
      }
      if (iVal > 0) {
        const agg: Record<string, number> = {};
        for (const r of data) { const k = (r[0] ?? "").trim(); const n = toNum(r[iVal]); if (k && n != null && n !== 0) agg[k] = (agg[k] ?? 0) + n; }
        if (Object.keys(agg).length >= 2) {
          const label = (name.replace(/\.[a-z0-9]+$/i, "").replace(/\s*-\s*\d{4}.*$/, "").trim() || "Répartition").slice(0, 60);
          const slug = "shopify_" + (label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "analytics");
          return mk("analytics", {}, {}, {
            breakdowns: { [slug]: { label, rows: topN(agg, 10) } },
            note: `Export « ${label} » → répartition auto (${Object.keys(agg).length} lignes).`,
          });
        }
      }
    }
  }
  return mk("analytics", {}, {}, { note: `Export Shopify analytique (${name}) — non agrégé (info uniquement).` });
}

// ---- Bigblue (3PL) --------------------------------------------------------------
// Détail de facture (FA-XXXX-details) : chaque ligne = une prestation DATÉE (préparation, transport,
// retours, stockage…). Logistique en ENGAGEMENT = Σ des prestations datées du mois (pas la date de facture).
function bigblueInvoice(name: string, rows: string[][], ctx: ParseCtx): ParsedExtract {
  const h = rows[0];
  const iD = idx(h, "Date"), iP = idx(h, "Price"), iS = idx(h, "Service"), iCur = idx(h, "Currency");
  let tot = 0, used = 0, undated = 0, undatedAmt = 0; const bySvc: Record<string, number> = {};
  for (const r of rows.slice(1)) {
    const p = toNum(r[iP]); if (p == null) continue;
    if (!isoOf(r[iD])) { undated++; undatedAmt += p; continue; }
    if (!inMonth(r[iD], ctx.period)) continue;
    const c = convert(p, (iCur >= 0 ? r[iCur] : "") || ctx.reporting, ctx.factor);
    tot += c; used++; const svc = (r[iS] ?? "").trim() || "Autre"; bySvc[svc] = (bySvc[svc] ?? 0) + c;
  }
  const inv = (name.match(/FA-[A-Z0-9]+?\d{3,}/i) ?? [])[0]?.toUpperCase();
  return { parser: "bigblue_invoice", role: "expense", source_type: "invoice", currency: ctx.reporting,
    values: used ? { shipping_cost: r2(tot) } : {},
    sources: { shipping_cost: `Σ «Price» des prestations Bigblue datées de ${ctx.period.slice(0, 7)}${inv ? ` · facture ${inv}` : ""} · ${used} ligne(s)` },
    breakdowns: used ? { logistics_by_service: { label: "Logistique par prestation (Bigblue)", rows: topN(bySvc, 12) } } : undefined,
    // Plusieurs exports de la MÊME facture (re-téléchargement) → on n'en garde qu'un.
    dedupGroup: inv ? `bigblue_${inv}` : undefined, count: rows.length,
    aux: undated ? { undatedCredits: { n: undated, amount: r2(undatedAmt) } } : undefined };
}

// Export commandes Bigblue : articles expédiés et ventes par pays (TTC). Le CA reste celui de Shopify.
function bigblueOrders(_name: string, rows: string[][], ctx: ParseCtx): ParsedExtract {
  const h = rows[0];
  const iD = idx(h, "Date"), iSt = idx(h, "Order Status"), iTp = idx(h, "Total Price"), iN = idx(h, "Number Items Ordered"), iCo = idx(h, "Country");
  let orders = 0, units = 0, ttc = 0, cancelled = 0; const byCo: Record<string, number> = {};
  for (const r of rows.slice(1)) {
    if (!inMonth(r[iD], ctx.period)) continue;
    if (/cancel/i.test(r[iSt] ?? "")) { cancelled++; continue; }
    orders++; units += toNum(r[iN]) ?? 0; const p = toNum(r[iTp]) ?? 0; ttc += p;
    const co = (r[iCo] ?? "").trim(); if (co) byCo[co] = (byCo[co] ?? 0) + p;
  }
  return { parser: "bigblue_orders", role: "analytics", source_type: "sales_export", currency: ctx.reporting,
    values: orders ? { units } : {}, exclusive: true, priority: 100,
    sources: { units: `Σ «Number Items Ordered» des commandes Bigblue de ${ctx.period.slice(0, 7)} (hors annulées) · ${orders} commande(s)` },
    breakdowns: orders ? { sales_by_country: { label: "Ventes expédiées par pays (TTC, Bigblue)", rows: topN(byCo, 10) } } : undefined,
    note: orders ? `Bigblue ${ctx.period.slice(0, 7)} : ${orders} commandes expédiées (${cancelled} annulée(s)), ${units} articles, ${fmtE(ttc)} ${ctx.reporting} TTC.` : undefined };
}

// Export retours Bigblue : volume et motifs (le montant remboursé est déjà dans les « reversals » Shopify).
const RETURN_REASON: Record<string, string> = {
  ITEM_TOO_SMALL: "Trop petit", ITEM_TOO_BIG: "Trop grand", ITEM_DISLIKED: "Ne plaît pas", DAMAGED_ITEM: "Endommagé",
  WRONG_DESCRIPTION: "Description erronée", WRONG_ITEM_RECEIVED: "Mauvais article reçu", OTHER: "Autre",
};
function bigblueReturns(_name: string, rows: string[][], ctx: ParseCtx): ParsedExtract {
  const h = rows[0];
  const iD = idx(h, "Return creation date"), iR = idx(h, "Return reason"), iF = idx(h, "Refund fee amount");
  let n = 0, fees = 0; const byR: Record<string, number> = {};
  for (const r of rows.slice(1)) {
    if (!inMonth(r[iD], ctx.period)) continue;
    n++; fees += toNum(r[iF]) ?? 0;
    const k = RETURN_REASON[(r[iR] ?? "").trim()] ?? ((r[iR] ?? "").trim() || "Non précisé"); byR[k] = (byR[k] ?? 0) + 1;
  }
  return { parser: "bigblue_returns", role: "analytics", source_type: "other", currency: ctx.reporting, values: {}, sources: {},
    breakdowns: n ? { returns_by_reason: { label: "Retours par motif (Bigblue)", rows: topN(byR, 10) } } : undefined,
    note: n ? `Bigblue ${ctx.period.slice(0, 7)} : ${n} article(s) retourné(s)${fees ? `, frais de retour facturés aux clients ${r2(fees)} ${ctx.reporting}` : ""}.` : undefined };
}

// Réceptions fournisseurs Bigblue : information de réassort (pas une charge du mois).
function bigblueInbound(_name: string, rows: string[][], ctx: ParseCtx): ParsedExtract {
  const h = rows[0];
  const iD = idx(h, "Arrival Date", "Creation Date"), iQ = idx(h, "Accepted Quantity"), iSup = idx(h, "Supplier");
  let q = 0; const sup = new Set<string>();
  for (const r of rows.slice(1)) { if (!inMonth(r[iD], ctx.period)) continue; q += toNum(r[iQ]) ?? 0; if ((r[iSup] ?? "").trim()) sup.add(r[iSup].trim()); }
  return { parser: "bigblue_inbound", role: "analytics", source_type: "other", currency: ctx.reporting, values: {}, sources: {},
    note: q ? `Réceptions ${ctx.period.slice(0, 7)} : ${fmtE(q)} unité(s) entrées en stock (${[...sup].join(", ") || "fournisseur non précisé"}).` : undefined };
}

// ---- Pennylane (export « transaction banking ») ---------------------------------
// Pas de colonne de solde, plusieurs comptes, catégories Pennylane PEU FIABLES (encaissements Shopify
// classés « Logiciels », virements fournisseur en « Frais bancaires ») → classement par CONTREPARTIE.
// Base DÉCAISSEMENTS : sert aux charges hors-exports (pub, outils, frais) et à la trésorerie.
type DebitCat = "refund" | "ads" | "logistics" | "tools" | "bankfees" | "fx" | "vat" | "social" | "tax" | "payroll" | "stock" | "internal" | "ignore" | "other" | "unknown";
const AD_PLATFORMS: [RegExp, string][] = [
  [/snap group|snapchat/i, "Snapchat"], [/google ireland|adwords|google\s*ads/i, "Google"],
  [/facebk|facebook|meta platforms/i, "Meta"], [/tiktok|bytedance/i, "TikTok"],
  [/pinterest/i, "Pinterest"], [/microsoft.{0,12}ads|bing ads/i, "Microsoft"],
];
const counterparty = (w: string): string => {
  const s = w.replace(/\s+/g, " ");
  const m = s.match(/POUR:\s*([^0-9]{3,40}?)(?:\s+\d{2}\s+\d{2}|\s+BQ\b|\s+REF\b|\s+DATE\b|$)/i)
    ?? s.match(/\bDE:\s*([^0-9]{3,40}?)(?:\s+ID:|\s+MOTIF|\s+REF\b|$)/i)
    ?? s.match(/\b(?:to|from)\s+([^(]{3,40}?)(?:\s*\(|$)/i);
  return (m ? m[1] : s.slice(0, 32)).trim().replace(/\s{2,}/g, " ");
};
function classifyDebit(w: string, rules?: { match: string; category: string }[]): { cat: DebitCat; platform?: string } {
  const d = w.toLowerCase();
  for (const r of rules ?? []) if (r.match && d.includes(r.match.toLowerCase())) {
    const c = r.category.toLowerCase();
    const map: Record<string, DebitCat> = { ads: "ads", pub: "ads", publicite: "ads", tools: "tools", outils: "tools", payroll: "payroll", salaires: "payroll",
      cogs: "stock", stock: "stock", achats: "stock", internal: "internal", interne: "internal", ignore: "ignore", fin: "fx", other: "other", autre: "other",
      logistics: "logistics", logistique: "logistics", tax: "tax", impots: "tax", vat: "vat", tva: "vat", bankfees: "bankfees", frais: "bankfees" };
    return { cat: map[c] ?? "other", platform: map[c] === "ads" ? r.match : undefined };
  }
  if (/^refund:|remboursement client/i.test(w)) return { cat: "refund" };
  for (const [re, p] of AD_PLATFORMS) if (re.test(w)) return { cat: "ads", platform: p };
  if (/bigblue|cubyn|sendcloud|boxtal|colissimo|chronopost|mondial relay|dhl|ups\b|gls\b/i.test(w)) return { cat: "logistics" };
  // Frais bancaires AVANT la TVA : « cotisation mensuelle … TVA à 20 % » est un frais, pas un reversement.
  // (« débit mensuel carte » = total des achats carte du mois → à qualifier, ce n'est PAS un frais.)
  if (/tenue de compte|\bcions?\b|commission|frais bancaires|agios|cotisation mensuelle/i.test(w)) return { cat: "bankfees" };
  if (/\btva\b|\bvat\b/i.test(w)) return { cat: "vat" };
  if (/urssaf|retraite|prevoyance|mutuelle/i.test(w)) return { cat: "social" };
  if (/dgfip|impot|\bcfe\b|cotisation fonciere/i.test(w)) return { cat: "tax" };
  if (SALARY.test(w)) return { cat: "payroll" };
  if (FX_FEE.test(w)) return { cat: "fx" };
  if (SAAS.test(w) || /shopify international|klaviyo|gorgias|zapier|triple ?whale|judge\.me|recharge|loox|yotpo/i.test(w)) return { cat: "tools" };
  return { cat: "unknown" };
}
function pennylaneBank(_name: string, rows: string[][], ctx: ParseCtx): ParsedExtract {
  const h = rows[0];
  const iD = idx(h, "Date"), iA = idx(h, "Amount"), iW = idx(h, "Wording", "Label", "Libellé"), iB = idx(h, "Bank account", "Account"),
        iT = idx(h, "Third"), iCm = idx(h, "Comments"), iCur = idx(h, "Currency");
  const ym = ctx.period.slice(0, 7);
  const v: Record<string, number> = {};
  const byPlat: Record<string, number> = {}; const excl: Record<string, number> = {}; const unk: Record<string, number> = {};
  let inflow = 0, used = 0;
  const flowsByAcc: Record<string, { d: string; a: number }[]> = {};
  for (const r of rows.slice(1)) {
    const d = isoOf(r[iD]); const amt = toNum(r[iA]); if (!d || amt == null) continue;
    const acc = (iB >= 0 ? r[iB] : "") || "compte";
    const a = convert(amt, iCur >= 0 ? r[iCur] : ctx.reporting, ctx.factor);
    (flowsByAcc[acc] ??= []).push({ d, a });
    if (d.slice(0, 7) !== ym) continue;
    used++;
    if (a >= 0) { inflow += a; continue; } // encaissements (Shopify, Klarna, Scalapay, PayPal…) = RÉCEPTION, jamais du CA
    const w = [r[iW], iT >= 0 ? r[iT] : "", iCm >= 0 ? r[iCm] : ""].filter(Boolean).join(" ");
    const { cat, platform } = classifyDebit(w, ctx.categoryRules);
    const x = -a;
    switch (cat) {
      case "ads": add(v, "ads_total", x); if (platform === "Meta") add(v, "ads_meta", x); if (platform === "Google") add(v, "ads_google", x); byPlat[platform ?? "Autre"] = (byPlat[platform ?? "Autre"] ?? 0) + x; break;
      case "tools": add(v, "platform_fees", x); break;
      case "payroll": case "social": add(v, "payroll", x); break;
      case "bankfees": case "other": add(v, "other_opex", x); break;
      case "fx": add(v, "financial_result", -x); break;
      case "tax": add(v, "taxes", x); break;
      case "unknown": { const cp = counterparty(String(r[iW] ?? "")); unk[cp] = (unk[cp] ?? 0) + x; break; }
      default: { const lab = { refund: "remboursements clients (déjà dans les retours Shopify)", logistics: "logistique réglée (comptée via les factures du 3PL)", vat: "TVA reversée", stock: "achats de stock", internal: "virements internes", ignore: "ignorés (règle)" }[cat as string] ?? cat; excl[lab] = (excl[lab] ?? 0) + x; }
    }
  }
  for (const k of Object.keys(v)) v[k] = r2(v[k]);
  const sources: Record<string, string> = {};
  const baseSrc = `relevé bancaire (Pennylane), débits de ${ym} classés par contrepartie · base décaissements`;
  for (const k of Object.keys(v)) sources[k] = k === "ads_total" ? `${baseSrc} : ${Object.entries(byPlat).map(([p, x]) => `${p} ${fmtE(x)}`).join(" + ")}` : baseSrc;

  // Trésorerie : pas de solde dans l'export → reconstitution depuis un SOLDE DE RÉFÉRENCE par compte.
  const accounts = Object.keys(flowsByAcc);
  const anchors = ctx.bankAnchors ?? [];
  // Correspondance EXACTE du nom de compte (« Error Company » ≠ « ERROR COMPANY » : deux comptes distincts) ;
  // tolérance à la casse seulement si elle reste sans ambiguïté.
  const lc = (s: string) => s.trim().toLowerCase();
  const anchorOf = (acc: string) => anchors.find((x) => x.account.trim() === acc.trim())
    ?? (accounts.filter((a) => lc(a) === lc(acc)).length === 1 ? anchors.find((x) => lc(x.account) === lc(acc)) : undefined);
  const balAt = (acc: string, dateISO: string): number | null => {
    const an = anchorOf(acc);
    if (!an || !isoOf(an.date) || typeof an.balance !== "number" || !isFinite(an.balance)) return null;
    const ad = isoOf(an.date)!; let b = an.balance;
    for (const f of flowsByAcc[acc]) { if (dateISO >= ad) { if (f.d > ad && f.d <= dateISO) b += f.a; } else if (f.d > dateISO && f.d <= ad) b -= f.a; }
    return b;
  };
  const cashNotes: string[] = [];
  if (accounts.length) {
    const end = lastDayOf(ctx.period), prevEnd = lastDayOf(prevPeriod(ctx.period));
    const ends = accounts.map((acc) => ({ acc, e: balAt(acc, end), s: balAt(acc, prevEnd) }));
    const missing = ends.filter((x) => x.e == null).map((x) => x.acc);
    if (!missing.length) {
      v.cash_end = r2(ends.reduce((s, x) => s + (x.e ?? 0), 0));
      v.cash_start = r2(ends.reduce((s, x) => s + (x.s ?? 0), 0));
      sources.cash_end = `solde de référence par compte (onboarding) ± mouvements Pennylane jusqu'au ${end} · ${accounts.length} compte(s)`;
      sources.cash_start = `idem au ${prevEnd}`;
    } else {
      const net = accounts.reduce((s, acc) => s + flowsByAcc[acc].filter((f) => f.d.slice(0, 7) === ym).reduce((a, f) => a + f.a, 0), 0);
      cashNotes.push(`Flux net de trésorerie ${ym} : ${net >= 0 ? "+" : ""}${fmtE(net)} ${ctx.reporting} (${accounts.length} compte(s)). Solde de fin de mois non calculable : l'export Pennylane n'a pas de colonne de solde — renseigne un solde de référence pour : ${missing.join(", ")}.`);
    }
  }
  const unkTop = Object.entries(unk).sort((a, b) => b[1] - a[1]);
  const unkTot = unkTop.reduce((s, [, x]) => s + x, 0);
  const notes = [
    `Banque ${ym} : encaissements ${fmtE(inflow)} ${ctx.reporting} (réception clients/PSP, hors CA).`,
    Object.keys(excl).length ? `Exclu des charges : ${Object.entries(excl).map(([k, x]) => `${k} ${fmtE(x)}`).join(" · ")}.` : "",
    ...cashNotes,
  ].filter(Boolean);
  return { parser: "pennylane_bank", role: "bank", source_type: "bank_statement", currency: ctx.reporting, values: v, sources, count: used,
    breakdowns: Object.keys(byPlat).length ? { ads_by_platform: { label: "Dépense pub par plateforme (banque)", rows: topN(byPlat, 8) } } : undefined,
    aux: { bankAccounts: accounts, ...(unkTot ? { unqualifiedDebits: unkTop.slice(0, 12).map(([label, value]) => ({ label, value: r2(value) })), unqualifiedTotal: r2(unkTot) } : {}) },
    note: notes.join(" ") };
}

// ---- routeur ------------------------------------------------------------------

// Renvoie un ParsedExtract si un parser déterministe reconnaît le fichier, sinon null (→ IA).
export function parseFile(name: string, text: string, ctx: ParseCtx): ParsedExtract | null {
  if (!text || !text.trim()) return null;
  // Excel multi-feuilles (« # Feuille: X » en tête de chaque bloc) → on essaie chaque feuille.
  if (/^# Feuille: /m.test(text.slice(0, 300))) {
    for (const block of text.split(/^# Feuille: .*$/m)) { const p = parseFile(name, block.trim(), ctx); if (p) return p; }
    return null;
  }
  // Routage sur l'EN-TÊTE seul (bon marché), puis lecture économe des formats très larges.
  const nl = text.search(/\r?\n/);
  const head = parseCsv(nl > 0 ? text.slice(0, nl) : text)[0] ?? [];
  const lean = (names: string[]) => parseCsvKeep(text, new Set(names.map((n) => idx(head, n)).filter((i) => i >= 0)));
  if (has(head, "External Order ID") && has(head, "Number Items Ordered"))
    return bigblueOrders(name, lean(["Date", "Order Status", "Total Price", "Number Items Ordered", "Country"]), ctx);
  if (has(head, "Cost of goods sold") && has(head, "Month") && (has(head, "Order name") || has(head, "Sale ID")))
    return shopify(name, lean(["Month", "Order name", "Sale ID", "Product title at time of sale", "Product variant title at time of sale", "Cost of goods sold"]), ctx);

  const rows = parseCsv(text);
  if (rows.length < 2) return null;
  const h = rows[0];

  // Bigblue (3PL) et Pennylane : formats stables, reconnus par leurs en-têtes.
  if (has(h, "Service") && has(h, "UnitPrice") && has(h, "Price")) return bigblueInvoice(name, rows, ctx);
  if (has(h, "Return reason") && has(h, "Return creation date")) return bigblueReturns(name, rows, ctx);
  if (has(h, "Inbound Shipment ID")) return bigblueInbound(name, rows, ctx);
  if (has(h, "Wording") && has(h, "Amount") && (has(h, "Bank account") || has(h, "Suivi de trésorerie") || has(h, "Justified")))
    return pennylaneBank(name, rows, ctx);

  // Shopify : détecté par les en-têtes caractéristiques de ses rapports.
  const shopifyHit = has(h, "Net sales") || has(h, "Gross sales") || has(h, "Cost of goods sold") || has(h, "Gross payments") ||
    has(h, "Ending inventory value") || has(h, "Quantity ordered per order") || has(h, "Average order value") ||
    has(h, "Online store visitors") || has(h, "Sessions with cart additions") ||
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
