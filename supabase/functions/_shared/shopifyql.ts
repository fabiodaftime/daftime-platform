// Connecteur SHOPIFY (via Nango) — module PUR : requête ShopifyQL + conversion en faits du registre.
// ShopifyQL = le moteur des rapports Shopify (« Total sales over time ») → mêmes chiffres que les exports,
// sans reconstituer ventes / remises / retours commande par commande (les retours sont datés au jour du
// remboursement côté Shopify : impossible à refaire proprement depuis les commandes).
// Aucune donnée personnelle demandée : uniquement des agrégats mensuels.

import type { Fact } from "./registry.ts";

export const SALES_METRICS = ["gross_sales", "discounts", "returns", "net_sales", "shipping_charges", "taxes", "total_sales", "orders"] as const;

export function salesQuery(from: string, to: string): string {
  const until = (() => { const [y, m] = to.slice(0, 7).split("-").map(Number); return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); })();
  return `FROM sales SHOW ${SALES_METRICS.join(", ")} GROUP BY month SINCE ${from.slice(0, 10)} UNTIL ${until} ORDER BY month`;
}

export interface TableData { columns: { name: string }[]; rows: unknown[] }

// Lignes ShopifyQL (tableau de tableaux OU d'objets selon la version) → { mois: { métrique: valeur } }.
export function parseSalesTable(t: TableData): Record<string, Record<string, number>> {
  const names = t.columns.map((c) => c.name);
  const out: Record<string, Record<string, number>> = {};
  for (const raw of t.rows ?? []) {
    const row: Record<string, unknown> = Array.isArray(raw) ? Object.fromEntries(names.map((n, i) => [n, raw[i]])) : (raw as Record<string, unknown>);
    const month = String(row.month ?? row.Month ?? "").slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) continue;
    const vals: Record<string, number> = {};
    for (const k of SALES_METRICS) { const v = Number(row[k]); if (row[k] != null && row[k] !== "" && isFinite(v)) vals[k] = v; }
    out[`${month}-01`] = vals;
  }
  return out;
}

// Faits du registre : même concepts que les exports (ca = ventes nettes, refunds = retours en positif).
// Source « shopify_api », prioritaire sur l'export (110 > 100) ; file_id nul (fait de connecteur).
export function salesToFacts(byMonth: Record<string, Record<string, number>>, ctx: { client_id: string; shop: string; factor?: number }): Fact[] {
  const f = ctx.factor ?? 1;
  const doc = `shopify:${ctx.shop}`;
  const out: Fact[] = [];
  const push = (period: string, concept: string, amount: number, role: string) => out.push({
    client_id: ctx.client_id, period, concept, amount: Math.round(amount * f * 100) / 100, source: "shopify_api", source_doc: doc,
    role, exclusive: true, priority: 110, file_id: null, basis: "engagement", dedup_key: `${ctx.client_id}|shopify_api|${doc}|${concept}|${period}` });
  for (const [period, v] of Object.entries(byMonth)) {
    if (v.net_sales != null) push(period, "ca", v.net_sales, "revenue");
    if (v.gross_sales != null) push(period, "gross_sales", v.gross_sales, "revenue");
    if (v.returns != null) push(period, "refunds", Math.abs(v.returns), "revenue");
    if (v.orders != null) out.push({ ...mk(period, "orders", v.orders) });
    // Non catalogue, servent aux contrôles croisés (encaissements, TVA).
    if (v.total_sales != null) push(period, "_sales_ttc", v.total_sales, "revenue");
    if (v.taxes != null) push(period, "_taxes_collected", v.taxes, "revenue");
  }
  return out;
  function mk(period: string, concept: string, n: number): Fact {
    return { client_id: ctx.client_id, period, concept, amount: n, source: "shopify_api", source_doc: doc, role: "revenue", exclusive: true, priority: 110,
      file_id: null, basis: "engagement", dedup_key: `${ctx.client_id}|shopify_api|${doc}|${concept}|${period}` };
  }
}

// Faits de connecteur d'un mois → pseudo-extraction lue par la fusion actuelle (même logique que les fichiers).
export function connectorFactsToExtract(facts: Fact[]) {
  const bySrc = new Map<string, Fact[]>();
  for (const x of facts) (bySrc.get(`${x.source}|${x.source_doc}`) ?? bySrc.set(`${x.source}|${x.source_doc}`, []).get(`${x.source}|${x.source_doc}`)!).push(x);
  return [...bySrc.values()].map((fs) => {
    const values: Record<string, number> = {}, sources: Record<string, string> = {}, aux: Record<string, unknown> = { connector: true };
    let revenueCandidate: number | undefined;
    const label = fs[0].source === "shopify_api" ? `API Shopify (${fs[0].source_doc.replace(/^shopify:/, "")}) · rapport ventes ShopifyQL` : `${fs[0].source} (connecteur)`;
    for (const x of fs) {
      if (x.concept === "_sales_ttc") { aux.salesTTC = x.amount; continue; }
      if (x.concept === "_taxes_collected") { aux.taxesCollected = x.amount; continue; }
      if (x.concept === "ca") revenueCandidate = x.amount; else values[x.concept] = x.amount;
      sources[x.concept] = `${label} · ${x.period.slice(0, 7)}`;
    }
    return { parser: fs[0].source, role: fs[0].role ?? "revenue", source_type: "sales_export", currency: "", values, sources,
      exclusive: true, priority: fs[0].priority, file: label, aux, ...(revenueCandidate != null ? { revenueCandidate } : {}) };
  });
}
