// nango-webhook — recoit les webhooks Nango.
//
// Role Phase 0 : a la creation d'une connexion (type "auth", success), enregistrer/mettre a jour
// la ligne public.src_connections (client_id <- end_user.id, nango_connection_id <- connectionId).
// Les webhooks de sync ("sync") sont acquittes ; l'ingestion des enregistrements se fait via
// ingest-records (mapping par source, Phase 1).
//
// Secrets : NANGO_SECRET_KEY (sert a verifier la signature HMAC des webhooks Nango).
// ⚠️ Le format exact de signature/payload Nango doit etre confirme sur la doc Nango courante au
//    moment du branchement. Pour un premier run de debug, NANGO_WEBHOOK_INSECURE=true desactive
//    la verification (a ne jamais laisser en prod).

import { corsHeaders, json } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabaseClients.ts";

const NANGO_SECRET_KEY = Deno.env.get("NANGO_SECRET_KEY") ?? "";
const INSECURE = Deno.env.get("NANGO_WEBHOOK_INSECURE") === "true";

// integration id Nango -> notre libelle provider (inverse de nango-connect-session).
const PROVIDER_FROM_INTEGRATION: Record<string, string> = {
  "shopify": "shopify",
  "facebook-ads": "meta",
  "google-ads": "google_ads",
  "tiktok-ads": "tiktok",
};

async function verifySignature(raw: string, header: string | null): Promise<boolean> {
  if (INSECURE) return true;
  if (!header || !NANGO_SECRET_KEY) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(NANGO_SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  // Comparaison tolerante (le header peut etre prefixe selon la version Nango).
  return header === hex || header.endsWith(hex);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const raw = await req.text();
  const ok = await verifySignature(raw, req.headers.get("X-Nango-Signature"));
  if (!ok) return json({ error: "Signature invalide" }, 401);

  let evt: Record<string, unknown>;
  try { evt = JSON.parse(raw); } catch { return json({ error: "JSON invalide" }, 400); }

  // On n'agit que sur la creation de connexion reussie ; le reste est acquitte.
  const type = String(evt.type ?? "");
  const success = evt.success !== false;
  if (type !== "auth" || !success) return json({ received: true, ignored: type || "unknown" });

  const nangoConnectionId = String(evt.connectionId ?? evt.connection_id ?? "");
  const integrationId = String(evt.providerConfigKey ?? evt.provider_config_key ?? "");
  const endUser = (evt.endUser ?? evt.end_user ?? {}) as Record<string, unknown>;
  const clientId = String(endUser.endUserId ?? endUser.id ?? "");
  const provider = PROVIDER_FROM_INTEGRATION[integrationId] ?? integrationId;

  if (!clientId || !nangoConnectionId) {
    return json({ error: "client_id ou connectionId manquant dans le webhook" }, 422);
  }

  const admin = serviceClient();

  // Upsert manuel par (client_id, provider) : robuste malgre external_account_id nul a ce stade.
  // (Multi-comptes d'un meme provider = raffinement ulterieur.)
  const { data: existing } = await admin
    .from("src_connections")
    .select("id")
    .eq("client_id", clientId).eq("provider", provider)
    .maybeSingle();

  const row = {
    client_id: clientId,
    provider,
    nango_connection_id: nangoConnectionId,
    status: "active",
    last_error: null,
  };

  const q = existing
    ? admin.from("src_connections").update(row).eq("id", existing.id)
    : admin.from("src_connections").insert(row);
  const { error } = await q;
  if (error) return json({ error: error.message }, 500);

  return json({ received: true, client_id: clientId, provider, connection: existing ? "updated" : "created" });
});
