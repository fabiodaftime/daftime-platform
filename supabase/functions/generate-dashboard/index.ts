// ③ generate-dashboard — génère un dashboard HTML autonome (Chart.js) à partir des
// données standardisées courantes d'un client/mois. Statut initial: draft_ia.
//
// Body: { client_id: uuid, period: "YYYY-MM-01", standardized_data_id?: uuid }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { callAnthropic, stripCodeFences, MODELS } from "../_shared/anthropic.ts";
import { insertVersion } from "../_shared/versioning.ts";
import { injectDashboardData } from "../_shared/dashboardHtml.ts";

const SYSTEM = `Tu génères un DASHBOARD financier mensuel : un fichier HTML autonome, responsive, sobre et professionnel.

DONNÉES (RÈGLE ANTI-INVENTION) :
- Les données du mois sont disponibles dans la variable globale window.DASHBOARD_DATA (injectée séparément, NE la déclare PAS toi-même). Forme : { client, period, currency, sections: [ { label, rows: [ { label, value, unit, type? } ] } ] } ("type":"total" = ligne de total à mettre en évidence).
- NE CODE EN DUR AUCUN chiffre : tout nombre affiché (tableaux, KPI, graphiques) DOIT être lu depuis window.DASHBOARD_DATA. Si une valeur est absente, ne l'affiche pas (ou "n/d").

RENDU :
- Affiche chaque section en tableau lisible (Libellé / Valeur), lignes "total" mises en évidence.
- Cartes KPI pour les chiffres clés présents (CA, marge brute, EBITDA, taux de marge, CAC, ROAS, taux de conversion, LTV/CAC…).
- Graphiques via Chart.js (CDN https://cdn.jsdelivr.net/npm/chart.js), construits depuis window.DASHBOARD_DATA ; les valeurs restent lisibles même si Chart.js ne charge pas.
- Une courte section "Analyse du mois" : 2 à 4 points FACTUELS basés UNIQUEMENT sur les chiffres fournis (aucune invention, aucune spéculation).
- CHARTE : applique les tokens de design fournis (couleurs en variables CSS dans :root, polices). Sinon style sobre par défaut.

Réponds UNIQUEMENT avec le document HTML COMPLET (de <!doctype html> à </html>), SANS JSON ni texte autour.`;

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

    const { data: client } = await admin.from("clients").select("name, currency, brand").eq("id", client_id).maybeSingle();

    // Porte de confiance : pour les données pilotées par template, exiger la validation.
    const meta = (sd.data as { meta?: { template?: string; validated?: boolean } })?.meta;
    if (meta?.template && !meta?.validated) {
      return json({ error: "Validez d'abord les données (cockpit → Valider) avant de générer le dashboard." }, 409);
    }

    // Données client-facing : on retire les champs internes (flags, confiance, provenance, id…).
    const sections = (((sd.data as { sections?: unknown[] })?.sections ?? []) as Record<string, unknown>[]).map((s) => ({
      label: s.label,
      rows: ((s.rows ?? []) as Record<string, unknown>[]).map((r) => ({ label: r.label, value: r.value, unit: r.unit, ...(r.type === "total" ? { type: "total" } : {}) })),
    }));
    const clientData = { client: client?.name ?? "", period, currency: client?.currency ?? "EUR", sections };

    const userContent =
      `Client : ${client?.name ?? client_id} — Devise : ${client?.currency ?? "?"} — Mois : ${period}\n\n` +
      `CHARTE GRAPHIQUE (tokens de design à appliquer):\n${JSON.stringify(client?.brand ?? {}, null, 2)}\n\n` +
      `DONNÉES (pour rédiger l'analyse ; à l'exécution elles seront dans window.DASHBOARD_DATA) :\n${JSON.stringify(clientData, null, 2)}`;

    const { text: out, usage } = await callAnthropic({
      model: MODELS.fast, // Sonnet : rapide et fiable (Opus dépasse la limite de durée des edge functions sur un gros HTML)
      system: SYSTEM,
      messages: [{ role: "user", content: userContent }],
      max_tokens: 16000,
    });
    let html = stripCodeFences(out);
    if (html.length < 50 || !html.includes("<")) return json({ error: "le modèle n'a pas renvoyé de HTML valide" }, 502);
    if (!html.includes("DASHBOARD_DATA")) return json({ error: "le modèle n'a pas utilisé les données injectées (DASHBOARD_DATA)" }, 502);

    // Anti-hallucination : on injecte NOUS-MÊMES les données validées ; le HTML les lit, ne les réinvente pas.
    html = injectDashboardData(html, clientData);

    const saved = await insertVersion(admin, "dashboards", { client_id, period }, {
      standardized_data_id: sd.id,
      html,
      data_json: { sections },
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
