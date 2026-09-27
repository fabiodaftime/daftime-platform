// ⑧ shopify-sync — synchronise les chiffres de vente mensuels d'une boutique connectée (Nango) vers le
// registre de faits. Staff uniquement. ShopifyQL via le proxy Nango : aucun jeton Shopify chez nous.
//
// Body: { client_id, from?: "YYYY-MM-01", to?: "YYYY-MM-01" }  (défaut : 13 derniers mois)
// Scopes requis sur l'app Shopify : read_reports (+ accès « données client protégées » niveau 2 déclaré).

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { parseSalesTable, salesQuery, salesToFacts, type TableData } from "../_shared/shopifyql.ts";
import { ratesToReporting } from "../_shared/fx.ts";

const NANGO_API_URL = Deno.env.get("NANGO_API_URL") ?? "https://api.nango.dev";
const NANGO_SECRET_KEY = Deno.env.get("NANGO_SECRET_KEY") ?? "";
const API_VERSIONS = ["2026-07", "2026-04", "2026-01", "2025-10"]; // shopifyqlQuery : 2025-10 minimum

const monthStart = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);

async function nangoGraphql(connectionId: string, query: string, variables: Record<string, unknown>) {
  let last = "";
  for (const v of API_VERSIONS) {
    const r = await fetch(`${NANGO_API_URL}/proxy/admin/api/${v}/graphql.json`, {
      method: "POST",
      headers: { Authorization: `Bearer ${NANGO_SECRET_KEY}`, "Connection-Id": connectionId, "Provider-Config-Key": "shopify", "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    const text = await r.text();
    if (r.status === 404) { last = `version ${v} indisponible`; continue; }
    if (!r.ok) throw new Error(`Shopify ${r.status} : ${text.slice(0, 300)}`);
    return { version: v, body: JSON.parse(text) };
  }
  throw new Error(`Aucune version d'API Shopify disponible (${last})`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const guard = await requireStaff(req);
    if (!guard.ok) return json({ error: guard.error }, guard.status);
    const { admin } = guard;
    if (!NANGO_SECRET_KEY) return json({ error: "NANGO_SECRET_KEY non configuré" }, 500);

    const body = await req.json().catch(() => ({}));
    const client_id: string | undefined = body.client_id;
    if (!client_id) return json({ error: "client_id requis" }, 400);
    const now = new Date();
    const to: string = body.to ?? monthStart(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)));
    const from: string = body.from ?? monthStart(new Date(Date.UTC(Number(to.slice(0, 4)), Number(to.slice(5, 7)) - 13, 1)));

    const { data: conn } = await admin.from("src_connections").select("id, nango_connection_id, external_account_id")
      .eq("client_id", client_id).eq("provider", "shopify").eq("status", "active").maybeSingle();
    if (!conn?.nango_connection_id) return json({ error: "Aucune boutique Shopify connectée pour ce client." }, 404);
    const { data: client } = await admin.from("clients").select("currency").eq("id", client_id).maybeSingle();

    const q = `query($q: String!) { shopifyqlQuery(query: $q) { tableData { columns { name dataType } rows } parseErrors } shop { myshopifyDomain currencyCode } }`;
    const { version, body: res } = await nangoGraphql(conn.nango_connection_id, q, { q: salesQuery(from, to) });
    const errs = res.errors?.map((e: { message: string }) => e.message) ?? [];
    const sq = res.data?.shopifyqlQuery;
    const parseErrors: string[] = (sq?.parseErrors ?? []).map((e: unknown) => (typeof e === "string" ? e : JSON.stringify(e)));
    if (errs.length || parseErrors.length || !sq?.tableData) {
      const msg = [...errs, ...parseErrors].join(" · ") || "réponse ShopifyQL vide";
      await admin.from("src_connections").update({ status: "active", last_error: msg.slice(0, 500) }).eq("id", conn.id);
      return json({ ok: false, error: msg, hint: /access|scope|protected|denied/i.test(msg) ? "Ajoute le scope read_reports et déclare l'accès aux données client protégées (niveau 2) sur l'app, puis reconnecte la boutique." : undefined }, 502);
    }
    const shop: string = res.data?.shop?.myshopifyDomain ?? conn.external_account_id ?? "boutique";
    const byMonth = parseSalesTable(sq.tableData as TableData);

    // Devise de la boutique ≠ devise de reporting du client → conversion (taux BCE du dernier mois).
    const shopCur: string = res.data?.shop?.currencyCode ?? "EUR", reporting: string = (client as { currency?: string } | null)?.currency ?? "EUR";
    let factor = 1;
    if (shopCur !== reporting) { const fx = await ratesToReporting(to, reporting); factor = fx.factor[shopCur] ?? 1; }

    const facts = salesToFacts(byMonth, { client_id, shop, factor });
    if (facts.length) { const { error } = await admin.from("std_facts").upsert(facts, { onConflict: "dedup_key" }); if (error) throw error; }
    await admin.from("src_connections").update({ last_synced_at: new Date().toISOString(), last_error: null, external_account_id: shop }).eq("id", conn.id);
    return json({ ok: true, shop, api_version: version, months: Object.keys(byMonth).sort(), facts: facts.length, currency: shopCur, factor });
  } catch (e) {
    console.error("shopify-sync:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
