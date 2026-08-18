// ingest-records — endpoint INTERNE : recoit des lots d'enregistrements (via Nango sync / webhook),
// les mappe vers les tables canoniques et fait un UPSERT idempotent (cle UNIQUE -> pas de doublon).
//
// Appele serveur-a-serveur, protege par un secret partage : header X-Ingest-Secret == INGEST_SECRET.
// Corps attendu : { client_id, connection_id?, provider, model, records: [...] }
//
// Cadre generique + registre de mappers par `${provider}:${model}`. Ajouter une source = ajouter
// un mapper, rien d'autre a changer en aval (l'agregation lit les tables canoniques).

import { corsHeaders, json } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabaseClients.ts";

const INGEST_SECRET = Deno.env.get("INGEST_SECRET") ?? "";

const num = (x: unknown): number | null =>
  x === null || x === undefined || x === "" ? null : Number(x);

type Ctx = { client_id: string; connection_id: string | null };
type Mapped = { table: string; conflict: string; rows: Record<string, unknown>[] };
type Mapper = (records: Record<string, unknown>[], ctx: Ctx) => Mapped;

// ── Mapper Shopify "orders" (amorce Phase 1) ─────────────────────────────────
// ⚠️ Cale sur la forme de l'objet Order de l'Admin API Shopify. Si la sync Nango renvoie une forme
//    deja transformee, ajuster les chemins de champs. A valider sur un vrai payload au branchement.
const shopifyOrders: Mapper = (records, ctx) => {
  const rows = records.map((o) => {
    const gross = num(o.total_line_items_price);
    const discounts = num(o.total_discounts);
    const tax = num(o.total_tax);
    const refunds = Array.isArray(o.refunds)
      ? (o.refunds as Record<string, unknown>[]).reduce((s, r) => {
          const txs = (r.transactions as Record<string, unknown>[] | undefined) ?? [];
          return s + txs.reduce((a, t) => a + (num(t.amount) ?? 0), 0);
        }, 0)
      : null;
    const shipSet = (o.total_shipping_price_set as Record<string, unknown> | undefined)?.shop_money as
      Record<string, unknown> | undefined;
    const shipping = num(shipSet?.amount) ?? num(o.total_shipping_price);
    const net = (gross ?? 0) - (discounts ?? 0) - (refunds ?? 0);
    const ship = (o.shipping_address as Record<string, unknown> | undefined);
    const bill = (o.billing_address as Record<string, unknown> | undefined);
    const cust = (o.customer as Record<string, unknown> | undefined);
    const ordersCount = num(cust?.orders_count);
    return {
      client_id: ctx.client_id,
      connection_id: ctx.connection_id,
      source: "shopify",
      external_id: String(o.id),
      occurred_at: o.created_at ?? null,
      currency: o.currency ?? null,
      gross, discounts, refunds, tax, shipping, net,
      financial_status: o.financial_status ?? null,
      customer_type: ordersCount && ordersCount > 1 ? "returning" : "new",
      country: (ship?.country_code ?? bill?.country_code ?? null) as string | null,
      raw: o,
    };
  });
  return { table: "src_orders", conflict: "client_id,source,external_id", rows };
};

const MAPPERS: Record<string, Mapper> = {
  "shopify:orders": shopifyOrders,
  // Phase 1+ : "meta:insights", "google_ads:insights", "tiktok:insights" -> src_ad_spend
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (!INGEST_SECRET || req.headers.get("X-Ingest-Secret") !== INGEST_SECRET) {
    return json({ error: "Non autorise" }, 401);
  }

  let body: { client_id?: string; connection_id?: string; provider?: string; model?: string; records?: unknown[] };
  try { body = await req.json(); } catch { return json({ error: "JSON invalide" }, 400); }
  const { client_id, connection_id = null, provider, model, records } = body;
  if (!client_id || !provider || !model) return json({ error: "client_id, provider, model requis" }, 400);
  if (!Array.isArray(records)) return json({ error: "records[] requis" }, 400);
  if (records.length === 0) return json({ upserted: 0 });

  const mapper = MAPPERS[`${provider}:${model}`];
  if (!mapper) return json({ error: `mapper absent pour ${provider}:${model} (Phase 1+)` }, 501);

  const mapped = mapper(records as Record<string, unknown>[], { client_id, connection_id });
  const admin = serviceClient();
  const { error } = await admin.from(mapped.table).upsert(mapped.rows, { onConflict: mapped.conflict });
  if (error) return json({ error: error.message }, 500);

  return json({ upserted: mapped.rows.length, table: mapped.table });
});
