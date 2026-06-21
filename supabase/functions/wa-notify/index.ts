// wa-notify — notifie sur WhatsApp le conseiller rattaché au client, à chaque message
// envoyé par le client. Sens : app → WhatsApp. Appelé par le front juste après l'insert.
//
// Body: { message_id: uuid }
// Secrets requis : TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM (ex 'whatsapp:+14155238886')

import { corsHeaders, json } from "../_shared/cors.ts";
import { serviceClient, userClient } from "../_shared/supabaseClients.ts";

const SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const FROM = Deno.env.get("TWILIO_WHATSAPP_FROM");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Not authenticated" }, 401);
    const { data: u } = await userClient(authHeader).auth.getUser();
    if (!u?.user) return json({ error: "Not authenticated" }, 401);

    const { message_id } = await req.json().catch(() => ({}));
    if (!message_id) return json({ error: "message_id requis" }, 400);

    const admin = serviceClient();
    const { data: msg } = await admin.from("messages")
      .select("id, client_id, body, sender_kind, sender_id").eq("id", message_id).maybeSingle();
    if (!msg) return json({ error: "message introuvable" }, 404);
    if (msg.sender_kind !== "client") return json({ ok: true, skipped: "not a client message" });
    if (msg.sender_id !== u.user.id) return json({ error: "forbidden" }, 403);

    const { data: client } = await admin.from("clients").select("id, name, advisor_id").eq("id", msg.client_id).maybeSingle();
    if (!client?.advisor_id) return json({ ok: true, skipped: "no advisor" });
    const { data: advisor } = await admin.from("advisors").select("id, name, whatsapp").eq("id", client.advisor_id).maybeSingle();
    if (!advisor?.whatsapp) return json({ ok: true, skipped: "no whatsapp" });

    if (!SID || !TOKEN || !FROM) return json({ ok: false, skipped: "twilio non configuré" });

    const to = `whatsapp:${advisor.whatsapp.replace(/[^0-9+]/g, "")}`;
    const text = `💬 Nouveau message de ${client.name} (espace Daftime) :\n\n"${msg.body}"\n\n↩️ Répondez en *citant* ce message pour lui répondre directement.`;

    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${SID}:${TOKEN}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: FROM, To: to, Body: text }).toString(),
    });
    const out = await resp.json();
    if (!resp.ok) { console.error("twilio send:", out); return json({ error: "Twilio: " + (out.message ?? resp.status) }, 502); }

    await admin.from("wa_links").insert({ provider_msg_id: out.sid, client_id: client.id, advisor_id: advisor.id });
    return json({ ok: true, sid: out.sid });
  } catch (e) {
    console.error("wa-notify:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
