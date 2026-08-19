// nango-connect-session — cree une session Nango Connect pour brancher une source a un client.
//
// Phase 0/1 = STAFF-CONNECTE : appele depuis le cockpit admin (requireStaff), scope au client_id
// choisi. Le front ouvre ensuite l'UI Nango avec le token renvoye (@nangohq/frontend).
// Aucun token OAuth ne transite ici : Nango gere le consentement et stocke les tokens.
//
// Secrets requis : NANGO_SECRET_KEY. Env optionnel : NANGO_API_URL (defaut api.nango.dev).

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";

const NANGO_API_URL = Deno.env.get("NANGO_API_URL") ?? "https://api.nango.dev";
const NANGO_SECRET_KEY = Deno.env.get("NANGO_SECRET_KEY") ?? "";

// provider (notre libelle) -> Integration ID (unique key) a saisir dans Nango.
// Convention : on garde l'IDENTITE -> quand tu crees l'integration dans Nango, mets le champ
// "Integration ID / unique key" a EXACTEMENT cette valeur (le PROVIDER sous-jacent, lui, est
//  choisi dans le guide : shopify=Shopify, meta=Meta Marketing API, google_ads=Google Ads,
//  tiktok=TikTok Ads). Ainsi aucun mapping a maintenir.
const NANGO_INTEGRATION: Record<string, string> = {
  shopify: "shopify",
  meta: "meta",
  google_ads: "google_ads",
  tiktok: "tiktok",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const guard = await requireStaff(req);
  if (!guard.ok) return json({ error: guard.error }, guard.status);

  if (!NANGO_SECRET_KEY) return json({ error: "NANGO_SECRET_KEY non configure" }, 500);

  let body: { client_id?: string; provider?: string };
  try { body = await req.json(); } catch { return json({ error: "JSON invalide" }, 400); }
  const { client_id, provider } = body;
  if (!client_id || !provider) return json({ error: "client_id et provider requis" }, 400);

  const integrationId = NANGO_INTEGRATION[provider];
  if (!integrationId) return json({ error: `provider inconnu: ${provider}` }, 400);

  // Nom du client (facultatif, pour l'affichage dans l'UI Nango).
  let displayName = client_id;
  const { data: client } = await guard.admin
    .from("clients").select("name").eq("id", client_id).maybeSingle();
  if (client?.name) displayName = client.name;

  // Cree une Connect Session cote Nango. end_user.id = client_id -> on retrouve le client au webhook.
  const resp = await fetch(`${NANGO_API_URL}/connect/sessions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NANGO_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      end_user: { id: client_id, display_name: displayName },
      allowed_integrations: [integrationId],
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    return json({ error: "Nango connect session a echoue", status: resp.status, detail }, 502);
  }

  const data = await resp.json();
  // Nango renvoie { data: { token, expires_at } }
  const token = data?.data?.token ?? data?.token;
  if (!token) return json({ error: "Token Nango absent de la reponse" }, 502);

  return json({ token, provider, integration_id: integrationId });
});
