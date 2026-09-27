// shopify-install — démarre la connexion quand un marchand installe l'app DEPUIS SHOPIFY (lien d'installation,
// fiche d'app). Shopify ouvre l'App URL (page /shopify du site) avec ?shop=…&hmac=… : la page transmet ces
// paramètres ici ; on vérifie la signature puis on crée une session Nango Connect préremplie avec la boutique.
// La connexion obtenue arrive « en attente » (src_pending_connections) jusqu'à son rattachement à un dossier.
// Pas de JWT (le marchand n'a pas de compte Daftime) : la signature Shopify fait office d'authentification.
// Secrets : SHOPIFY_API_SECRET, NANGO_SECRET_KEY.

import { corsHeaders, json } from "../_shared/cors.ts";
import { isShopDomain, verifyLaunchQuery } from "../_shared/shopifyAuth.ts";

const SECRET = Deno.env.get("SHOPIFY_API_SECRET") ?? "";
const NANGO_API_URL = Deno.env.get("NANGO_API_URL") ?? "https://api.nango.dev";
const NANGO_SECRET_KEY = Deno.env.get("NANGO_SECRET_KEY") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const body = await req.json().catch(() => ({}));
  const params = new URLSearchParams(String(body.query ?? "").replace(/^\?/, ""));
  const shop = params.get("shop");
  if (!isShopDomain(shop)) return json({ error: "Boutique invalide." }, 400);
  if (!(await verifyLaunchQuery(params, SECRET))) return json({ error: "Signature Shopify invalide." }, 401);
  // Anti-rejeu : lien de lancement valable 10 minutes.
  const ts = Number(params.get("timestamp") ?? 0);
  if (!ts || Math.abs(Date.now() / 1000 - ts) > 600) return json({ error: "Lien expiré : relance l'installation depuis Shopify." }, 401);

  const subdomain = shop.replace(/\.myshopify\.com$/i, "");
  const r = await fetch(`${NANGO_API_URL}/connect/sessions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${NANGO_SECRET_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      end_user: { id: `shop:${shop}`, display_name: shop },
      allowed_integrations: ["shopify"],
      integrations_config_defaults: { shopify: { connection_config: { subdomain } } },
    }),
  });
  if (!r.ok) return json({ error: "Connexion momentanément indisponible.", detail: (await r.text()).slice(0, 200) }, 502);
  const data = await r.json();
  const token = data?.data?.token ?? data?.token;
  return token ? json({ token, shop }) : json({ error: "Session de connexion absente." }, 502);
});
