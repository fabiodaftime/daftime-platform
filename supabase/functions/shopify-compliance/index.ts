// shopify-compliance — webhooks OBLIGATOIRES de conformité (RGPD) de l'app Shopify publique.
//   customers/data_request : un client final demande ses données → nous ne stockons AUCUNE donnée
//                            personnelle (agrégats + commandes minimisées) : rien à fournir, demande journalisée.
//   customers/redact       : effacement d'un client → on purge les commandes citées (données déjà minimisées).
//   shop/redact            : 48 h après désinstallation → on efface tout ce qui vient de la boutique.
// Signature X-Shopify-Hmac-Sha256 vérifiée (401 sinon, exigence Shopify). Pas de JWT (appel Shopify).
// Secret : SHOPIFY_API_SECRET (Client Secret de l'app publique).

import { json } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabaseClients.ts";
import { verifyWebhook } from "../_shared/shopifyAuth.ts";

const SECRET = Deno.env.get("SHOPIFY_API_SECRET") ?? "";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const raw = await req.text();
  if (!(await verifyWebhook(raw, req.headers.get("X-Shopify-Hmac-Sha256"), SECRET))) return json({ error: "HMAC invalide" }, 401);

  const topic = req.headers.get("X-Shopify-Topic") ?? "";
  let p: Record<string, unknown> = {};
  try { p = JSON.parse(raw); } catch { /* corps vide toléré */ }
  const shop = String(p.shop_domain ?? req.headers.get("X-Shopify-Shop-Domain") ?? "");
  const admin = serviceClient();

  // Dossiers reliés à cette boutique (connexion active ou en attente).
  const { data: conns } = await admin.from("src_connections").select("id, client_id").eq("provider", "shopify").eq("external_account_id", shop);
  const clientIds = [...new Set((conns ?? []).map((c: { client_id: string }) => c.client_id))];
  let action = "aucune donnée personnelle détenue";

  try {
    if (topic === "customers/redact") {
      const orders = ((p.orders_to_redact as (number | string)[] | undefined) ?? []).map(String);
      if (orders.length && clientIds.length) {
        await admin.from("src_orders").delete().in("client_id", clientIds).eq("source", "shopify").in("external_id", orders);
        action = `${orders.length} commande(s) purgée(s)`;
      }
    } else if (topic === "shop/redact") {
      if (clientIds.length) {
        await admin.from("src_orders").delete().in("client_id", clientIds).eq("source", "shopify");
        await admin.from("std_facts").delete().in("client_id", clientIds).eq("source", "shopify_api").eq("source_doc", `shopify:${shop}`);
        await admin.from("src_connections").delete().eq("provider", "shopify").eq("external_account_id", shop);
      }
      await admin.from("src_pending_connections").delete().eq("provider", "shopify").eq("shop", shop);
      action = "données de la boutique effacées";
    }
  } catch (e) { action = `erreur : ${e instanceof Error ? e.message : String(e)}`; }

  // Journal : identifiants seulement (jamais e-mail / téléphone du client).
  const customer = p.customer as { id?: unknown } | undefined;
  await admin.from("std_compliance_log").insert({ topic, shop, action,
    payload: { customer_id: customer?.id ?? null, orders: p.orders_to_redact ?? p.orders_requested ?? null, data_request_id: (p.data_request as { id?: unknown } | undefined)?.id ?? null } });
  return json({ received: true });
});
