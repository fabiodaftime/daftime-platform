// Reconnaissance d'un fichier DÈS LE DÉPÔT (dans le navigateur) : quelle source, quelle famille de
// données, quelle période couverte. Module PUR (réutilise le routeur des parsers).
// Sert à : (1) afficher tout de suite « Shopify · Total sales over time · janv.→août 2026 » ou
// « non reconnu → lu par l'IA » ; (2) la grille de COUVERTURE des sources (mois × famille) qui dit
// ce qui manque avant même de standardiser.

import { filenameRange, isoOf, parseCsv, parseFile } from "./parsers.ts";

export type SourceFamily = "sales" | "cogs" | "orders" | "logistics" | "bank" | "payments" | "ads" | "inventory" | "traffic" | "other";
export const FAMILY_LABELS: Record<SourceFamily, string> = {
  sales: "Ventes (CA)", cogs: "Coût des ventes", orders: "Commandes 3PL", logistics: "Factures logistique",
  bank: "Banque", payments: "Encaissements (PSP)", ads: "Publicité", inventory: "Stock", traffic: "Trafic", other: "Autre",
};
// Familles attendues pour un e-commerce (lignes de la grille de couverture), dans l'ordre de la cascade.
export const EXPECTED_FAMILIES: Record<string, SourceFamily[]> = {
  ecommerce: ["sales", "cogs", "logistics", "ads", "bank"],
};

export interface DetectedSource {
  recognized: boolean;       // un parser déterministe le lit (sinon : IA de secours)
  parser?: string;
  role?: string;
  family: SourceFamily;
  label: string;             // ex. « Shopify · Total sales over time »
  from?: string;             // plage couverte (ISO), si déterminable
  to?: string;
}

const PARSER_LABEL: Record<string, string> = {
  bigblue_invoice: "Bigblue · facture", bigblue_orders: "Bigblue · commandes", bigblue_returns: "Bigblue · retours",
  bigblue_inbound: "Bigblue · réceptions", pennylane_bank: "Pennylane · relevé bancaire", stripe_payments: "Stripe · paiements",
  stripe_payouts: "Stripe · virements", quaderno: "Quaderno · factures", whop_export: "Whop · ventes", ebury: "Ebury · relevé",
  bank_signed: "Relevé bancaire",
};
const PARSER_FAMILY: Record<string, SourceFamily> = {
  bigblue_invoice: "logistics", bigblue_orders: "orders", bigblue_returns: "orders", bigblue_inbound: "inventory",
  pennylane_bank: "bank", stripe_payments: "payments", stripe_payouts: "payments", quaderno: "sales", whop_export: "sales",
  ebury: "bank", bank_signed: "bank",
};

const lastDay = (ym: string) => { const [y, m] = ym.split("-").map(Number); return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); };

// Plage de dates : nom du fichier d'abord (exports Shopify / Bigblue), sinon min/max de la 1re colonne de date.
function coverage(name: string, text: string): { from?: string; to?: string } {
  const fr = filenameRange(name);
  if (fr) return fr;
  const rows = parseCsv(text.length > 6_000_000 ? text.slice(0, 6_000_000) : text);
  const h = rows[0] ?? [];
  const i = h.findIndex((c) => /^(date|month|day|mois|jour|created|transaction date|order date|date d'opération|date operation|arrival date)/i.test(c.trim()));
  if (i < 0) return {};
  const isMonth = /^(month|mois)/i.test(h[i].trim());
  // Mois marginaux (< 5 % des lignes datées : avoirs tardifs, régularisations) ignorés pour la plage.
  const dates = rows.slice(1).map((r) => isoOf(r[i])).filter((d): d is string => !!d);
  if (!dates.length) return {};
  const perMonth = new Map<string, number>();
  for (const d of dates) perMonth.set(d.slice(0, 7), (perMonth.get(d.slice(0, 7)) ?? 0) + 1);
  const kept = new Set([...perMonth].filter(([, n]) => n >= dates.length * 0.05).map(([m]) => m));
  let from = "", to = "";
  for (const d of dates) { if (!kept.has(d.slice(0, 7))) continue; if (!from || d < from) from = d; if (!to || d > to) to = d; }
  if (!from) return {};
  return { from, to: isMonth ? lastDay(to.slice(0, 7)) : to };
}

function shopifyFamily(report: string): SourceFamily {
  const r = report.toLowerCase();
  if (/cost of goods|gross profit|margin/.test(r)) return "cogs";
  if (/inventory|stock/.test(r)) return "inventory";
  if (/session|visitor|conversion|search/.test(r)) return "traffic";
  if (/payment/.test(r)) return "payments";
  return "sales";
}

export function detectSource(name: string, text: string): DetectedSource {
  const cov = coverage(name, text);
  const ym = (cov.to ?? new Date().toISOString()).slice(0, 7);
  let p = null;
  try { p = parseFile(name, text, { reporting: "EUR", factor: { EUR: 1 }, period: `${ym}-01`, activity: "ecommerce" }); } catch { p = null; }
  const base = name.replace(/\.[a-z0-9]+$/i, "");
  if (p) {
    if (p.parser === "shopify") {
      const report = base.replace(/\s*-\s*\d{4}-\d{2}-\d{2}.*$/, "").trim() || "rapport";
      return { recognized: true, parser: p.parser, role: p.role, family: shopifyFamily(report), label: `Shopify · ${report}`, ...cov };
    }
    return { recognized: true, parser: p.parser, role: p.role, family: PARSER_FAMILY[p.parser] ?? "other", label: PARSER_LABEL[p.parser] ?? p.parser, ...cov };
  }
  // Non reconnu : la famille reste devinable par le nom (exports des régies pub, etc.) → lu par l'IA.
  const n = name.toLowerCase();
  const family: SourceFamily = /meta|facebook|google.?ads|tiktok|snap|pinterest|campaign|campagne|ads?[_\s-]/.test(n) ? "ads"
    : /relev|bank|banque|statement|qonto|revolut/.test(n) ? "bank"
    : /factur|invoice/.test(n) ? "other" : "other";
  return { recognized: false, family, label: "Non reconnu → lu par l'IA", ...cov };
}

// Mois (YYYY-MM-01) couverts par une plage.
export function monthsOf(from?: string, to?: string, max = 36): string[] {
  if (!from || !to) return [];
  const out: string[] = []; let [y, m] = from.slice(0, 7).split("-").map(Number);
  const [ty, tm] = to.slice(0, 7).split("-").map(Number);
  while ((y < ty || (y === ty && m <= tm)) && out.length < max) { out.push(`${y}-${String(m).padStart(2, "0")}-01`); m++; if (m > 12) { m = 1; y++; } }
  return out;
}

// Grille de couverture : pour chaque famille, les mois couverts par au moins un fichier.
// Un fichier sans date (ex. PDF, capture) couvre le mois où il est déposé.
export function coverageGrid(files: { period: string | null; detected?: DetectedSource | null }[]): Record<SourceFamily, Set<string>> {
  const g = Object.fromEntries(Object.keys(FAMILY_LABELS).map((k) => [k, new Set<string>()])) as Record<SourceFamily, Set<string>>;
  for (const f of files) {
    const d = f.detected; if (!d) continue;
    const ms = monthsOf(d.from, d.to);
    for (const m of ms.length ? ms : f.period ? [f.period] : []) g[d.family].add(m);
  }
  return g;
}
