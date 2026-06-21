// ④ chat-iterate — affine un dashboard existant selon une instruction en langage naturel.
// Enregistre le résultat comme NOUVELLE version du dashboard (même statut).
//
// Body: { dashboard_id: uuid, message: string, history?: {role, content}[] }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { callAnthropic, stripCodeFences, MODELS, type AnthropicMessage } from "../_shared/anthropic.ts";
import { insertVersion } from "../_shared/versioning.ts";
import { injectDashboardData } from "../_shared/dashboardHtml.ts";

const SYSTEM = `Tu modifies un dashboard financier HTML existant selon l'instruction de l'utilisateur.
Les chiffres sont dans la variable globale window.DASHBOARD_DATA (injectée séparément, NE la déclare PAS toi-même). NE CODE EN DUR AUCUN chiffre : lis tout depuis window.DASHBOARD_DATA.
RÈGLES :
- Applique la demande en gardant un HTML autonome valide (Chart.js via CDN).
- N'invente aucun chiffre et n'altère pas les valeurs.
- Réponds UNIQUEMENT avec le document HTML COMPLET mis à jour (de <!doctype html> à </html>), SANS JSON ni texte autour.`;

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

    const { data: client } = await admin.from("clients").select("brand").eq("id", dash.client_id).maybeSingle();

    const messages: AnthropicMessage[] = [
      ...history,
      {
        role: "user",
        content:
          `CHARTE GRAPHIQUE (à respecter):\n${JSON.stringify(client?.brand ?? {}, null, 2)}\n\n` +
          `HTML ACTUEL:\n${dash.html ?? ""}\n\n` +
          `DONNÉES ACTUELLES:\n${JSON.stringify(dash.data_json ?? {}, null, 2)}\n\n` +
          `INSTRUCTION:\n${message}`,
      },
    ];

    const { text: out, usage } = await callAnthropic({
      model: MODELS.fast, // Sonnet : rapide et fiable pour régénérer le HTML dans la limite de durée
      system: SYSTEM,
      messages,
      max_tokens: 16000,
    });
    const html = injectDashboardData(stripCodeFences(out), dash.data_json ?? {});
    if (html.length < 50 || !html.includes("<")) return json({ error: "réponse HTML invalide" }, 502);

    const saved = await insertVersion(admin, "dashboards", { client_id: dash.client_id, period: dash.period }, {
      standardized_data_id: dash.standardized_data_id,
      html,
      data_json: dash.data_json ?? {},
      status: dash.status,
      created_by: user.id,
    });

    return json({ ok: true, dashboard: saved, summary: "Dashboard mis à jour.", usage });
  } catch (e) {
    console.error("chat-iterate:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
