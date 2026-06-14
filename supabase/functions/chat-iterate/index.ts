// ④ chat-iterate — affine un dashboard existant selon une instruction en langage naturel.
// Enregistre le résultat comme NOUVELLE version du dashboard (même statut).
//
// Body: { dashboard_id: uuid, message: string, history?: {role, content}[] }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { callAnthropic, extractJson, MODELS, type AnthropicMessage } from "../_shared/anthropic.ts";
import { insertVersion } from "../_shared/versioning.ts";

const SYSTEM = `Tu modifies un dashboard financier HTML existant selon l'instruction de l'utilisateur.
Tu reçois le HTML actuel et les données (DASHBOARD_DATA). Applique la demande en gardant un HTML autonome valide (Chart.js via CDN).
RÈGLES :
- N'invente aucun chiffre ; ne modifie les données que si l'utilisateur le demande explicitement.
- Réponds UNIQUEMENT avec un objet JSON valide : { "html": "...", "data_json": { ... }, "summary": "résumé des changements" }`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const guard = await requireStaff(req);
    if (!guard.ok) return json({ error: guard.error }, guard.status);
    const { admin, user } = guard;

    const body = await req.json().catch(() => ({}));
    const dashboard_id: string | undefined = body.dashboard_id;
    const message: string | undefined = body.message;
    const history: AnthropicMessage[] = Array.isArray(body.history) ? body.history : [];
    if (!dashboard_id || !message) return json({ error: "dashboard_id et message requis" }, 400);

    const { data: dash } = await admin.from("dashboards").select("*").eq("id", dashboard_id).maybeSingle();
    if (!dash) return json({ error: "dashboard introuvable" }, 404);

    const messages: AnthropicMessage[] = [
      ...history,
      {
        role: "user",
        content:
          `HTML ACTUEL:\n${dash.html ?? ""}\n\n` +
          `DONNÉES ACTUELLES:\n${JSON.stringify(dash.data_json ?? {}, null, 2)}\n\n` +
          `INSTRUCTION:\n${message}`,
      },
    ];

    const { text: out, usage } = await callAnthropic({
      model: MODELS.quality,
      system: SYSTEM,
      messages,
      max_tokens: 16000,
    });
    const parsed = extractJson<{ html?: string; data_json?: unknown; summary?: string }>(out);

    const saved = await insertVersion(admin, "dashboards", { client_id: dash.client_id, period: dash.period }, {
      standardized_data_id: dash.standardized_data_id,
      html: parsed.html ?? dash.html,
      data_json: parsed.data_json ?? dash.data_json,
      status: dash.status,
      created_by: user.id,
    });

    return json({ ok: true, dashboard: saved, summary: parsed.summary ?? "", usage });
  } catch (e) {
    console.error("chat-iterate:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
