// ③ generate-dashboard — génère un dashboard HTML autonome (Chart.js) à partir des
// données standardisées courantes d'un client/mois. Statut initial: draft_ia.
//
// Body: { client_id: uuid, period: "YYYY-MM-01", standardized_data_id?: uuid }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { callAnthropic, extractJson, MODELS } from "../_shared/anthropic.ts";
import { insertVersion } from "../_shared/versioning.ts";

const SYSTEM = `Tu génères un DASHBOARD financier mensuel sous forme d'un fichier HTML autonome.
EXIGENCES :
- HTML complet et valide (<!doctype html> ... </html>), responsive, sobre et professionnel.
- Graphiques via Chart.js chargé par CDN (https://cdn.jsdelivr.net/npm/chart.js).
- SÉPARE les données du rendu : déclare "const DASHBOARD_DATA = ...;" puis construis le DOM/charts à partir de cette constante.
- N'invente aucun chiffre : utilise STRICTEMENT les données fournies. Si une métrique manque, ne l'affiche pas (ou indique "n/d").
- Réponds UNIQUEMENT avec un objet JSON valide : { "html": "<!doctype html>...", "data_json": { ... } }
  où data_json est l'objet injecté dans DASHBOARD_DATA.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const guard = await requireStaff(req);
    if (!guard.ok) return json({ error: guard.error }, guard.status);
    const { admin, user } = guard;

    const body = await req.json().catch(() => ({}));
    const client_id: string | undefined = body.client_id;
    const period: string | undefined = body.period;
    if (!client_id || !period) return json({ error: "client_id et period (YYYY-MM-01) requis" }, 400);

    const sdQuery = admin.from("standardized_data").select("*").eq("client_id", client_id).eq("period", period);
    const { data: sd } = body.standardized_data_id
      ? await admin.from("standardized_data").select("*").eq("id", body.standardized_data_id).maybeSingle()
      : await sdQuery.eq("is_current", true).maybeSingle();
    if (!sd) return json({ error: "aucune donnée standardisée pour ce client/mois (lance d'abord standardize-data)" }, 404);

    const { data: client } = await admin.from("clients").select("name, currency").eq("id", client_id).maybeSingle();

    const userContent =
      `Client : ${client?.name ?? client_id} — Devise : ${client?.currency ?? "?"} — Mois : ${period}\n\n` +
      `DONNÉES STANDARDISÉES (source de vérité):\n${JSON.stringify(sd.data, null, 2)}`;

    const { text: out, usage } = await callAnthropic({
      model: MODELS.quality,
      system: SYSTEM,
      messages: [{ role: "user", content: userContent }],
      max_tokens: 16000,
    });
    const parsed = extractJson<{ html?: string; data_json?: unknown }>(out);
    if (!parsed.html) return json({ error: "le modèle n'a pas renvoyé de HTML" }, 502);

    const saved = await insertVersion(admin, "dashboards", { client_id, period }, {
      standardized_data_id: sd.id,
      html: parsed.html,
      data_json: parsed.data_json ?? {},
      status: "draft_ia",
      created_by: user.id,
    });

    await admin.from("dashboard_status_history").insert({
      dashboard_id: saved.id,
      from_status: null,
      to_status: "draft_ia",
      changed_by: user.id,
      note: "Généré par l'IA",
    });

    return json({ ok: true, dashboard: saved, usage });
  } catch (e) {
    console.error("generate-dashboard:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
