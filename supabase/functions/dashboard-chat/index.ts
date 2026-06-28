// dashboard-chat — assistant CONVERSATIONNEL du dashboard. Selon la demande :
//   • RÉPOND à une question sur les chiffres (lecture, écarts, ratios) — sans rien inventer ;
//   • MODIFIE le dashboard (ajoute/retire/réordonne des widgets, change titres/pages, ajuste le thème),
//     puis re-rend et enregistre une nouvelle version.
//
// Body: { dashboard_id: uuid, message: string, history?: {role,content}[] }
// Réponse: { action:'answer', answer } | { action:'edit', dashboard, summary }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { callAnthropic, extractJson, MODELS, type AnthropicMessage } from "../_shared/anthropic.ts";
import { insertVersion } from "../_shared/versioning.ts";
import { renderDashboard, type Metric, type DashPlan } from "../_shared/dashboardRender.ts";
import { type Theme } from "../_shared/dashboardTheme.ts";

const SYSTEM = `Tu es l'assistant d'un DASHBOARD FINANCIER déjà généré pour un client. Tu fais DEUX choses selon la demande :

1) RÉPONDRE à une question sur les chiffres (lecture du mois, écart vs M-1, ratio, "pourquoi", "combien", "quelle marge", etc.).
   - Utilise UNIQUEMENT les données fournies (métriques, variations, breakdowns). N'INVENTE AUCUN chiffre.
   - Tu peux calculer des ratios/écarts simples à partir des valeurs fournies. Réponse claire, concise, en français, avec les chiffres cités.
   - Si l'info n'est pas dans les données, dis-le honnêtement.

2) MODIFIER le dashboard quand on te le demande (présentation, structure, contenu) :
   - ajouter / retirer / réordonner des widgets, renommer des titres, créer/supprimer/renommer des pages, mettre un KPI en avant, changer un type de graphe, ajuster le thème (mood, fond, en-tête, icônes).
   - Tu RENVOIES alors le PLAN COMPLET mis à jour (toutes les pages/widgets, pas seulement le changement) pour qu'il soit ré-affiché.
   - N'utilise QUE des ids de métriques / clés de breakdowns / ids de cibles fournis. Pas de widget qui resterait vide.
   - COULEURS & POLICE : elles viennent de la marque — ne les change QUE si on le demande explicitement.

WIDGETS DISPONIBLES :
- kpi_row {items:[{metric:id}]} · line/area/stacked/stacked_area/river/combo{metrics,line}/slope/matrix {metrics} (séries temporelles, besoin d'historique ≥2-3 mois)
- bar/donut/radar/diverging/comparison/bullet/rings/gauge_grid/gauge/trend_grid/waterfall {metrics} · funnel {metrics ordonnés}
- ranking/map/treemap/rose/polar/sunburst/pictorial/lollipop/share/histogram/calendar {breakdown:clé}
- table {metrics} · callout {text,tone:info|warn|good} · flow (sankey P&L)
Règle : 4 à 8 graphes variés par page ; si historique < 3 mois, évite les graphes temporels.

THÈME : mood ∈ vivid|aurora|ocean|sunset|forest|noir|neon|royal|slate|corporate|pastel|editorial|glass|minimal|dark ; background soft|plain|gradient|dark|mesh|glass ; header gradient|solid|dark|minimal|band ; kpi icon|accent|gradient|plain|glass ; icons {id:nom}.

RÉPONDS UNIQUEMENT EN JSON :
- Question → {"action":"answer","answer":"…"}
- Modification → {"action":"edit","plan":{"pages":[{"title":"…","widgets":[…]}]},"theme":{…optionnel…},"summary":"ce qui a changé en une phrase"}
Si la demande mélange question + modif, choisis "edit" et résume aussi la réponse dans "summary".`;

const idVal = (sections: { rows?: { id?: string; label?: string; value?: unknown; unit?: string; change_pct?: number }[] }[]): Record<string, Metric> => {
  const m: Record<string, Metric> = {};
  for (const s of sections ?? []) for (const r of s.rows ?? []) if (typeof r.value === "number" && r.id) m[r.id] = { value: r.value, label: r.label ?? r.id, unit: r.unit ?? "", change_pct: r.change_pct ?? null };
  return m;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const guard = await requireStaff(req);
    if (!guard.ok) return json({ error: guard.error }, guard.status);
    const { admin, user } = guard;

    const body = await req.json().catch(() => ({}));
    const dashboard_id: string | undefined = body.dashboard_id;
    const message: string = (body.message ?? "").toString();
    const history: AnthropicMessage[] = Array.isArray(body.history) ? body.history.slice(-6) : [];
    if (!dashboard_id || !message.trim()) return json({ error: "dashboard_id et message requis" }, 400);

    const { data: dash } = await admin.from("dashboards").select("*").eq("id", dashboard_id).maybeSingle();
    if (!dash) return json({ error: "dashboard introuvable" }, 404);
    const dj = ((dash as any).data_json ?? {}) as {
      client?: string; period?: string; currency?: string; sections?: any[]; history?: any; plan?: DashPlan; theme?: Theme; breakdowns?: Record<string, { label: string; rows: unknown[] }>; targets?: Record<string, number>;
    };

    const { data: client } = await admin.from("clients").select("name, currency, brand").eq("id", (dash as any).client_id).maybeSingle();

    const metrics = idVal(dj.sections ?? []);
    const metricsText = Object.entries(metrics).map(([id, m]) =>
      `- ${id} (${m.label}) : ${m.value}${m.unit ? " " + m.unit : ""}${m.change_pct != null ? ` (${m.change_pct >= 0 ? "+" : ""}${m.change_pct}% vs M-1)` : ""}`).join("\n");
    const bkText = dj.breakdowns && Object.keys(dj.breakdowns).length ? Object.entries(dj.breakdowns).map(([k, v]) => `${k} — ${v.label}`).join(" ; ") : "aucun";
    const tgText = dj.targets && Object.keys(dj.targets).length ? Object.keys(dj.targets).join(", ") : "aucune";
    const monthsText = (dj.history?.months ?? []).join(", ") || "aucun";

    const ctxMsg = `Client : ${dj.client ?? client?.name ?? ""}. Mois : ${dj.period ?? (dash as any).period} (devise ${dj.currency ?? client?.currency ?? "EUR"}).\n\n` +
      `MÉTRIQUES (id, libellé, valeur, variation) :\n${metricsText || "—"}\n\n` +
      `BREAKDOWNS (clés) : ${bkText}\n` +
      `CIBLES : ${tgText}\n` +
      `HISTORIQUE (mois) : ${monthsText}\n\n` +
      `PLAN ACTUEL (à reprendre/ajuster en cas de modification) :\n${JSON.stringify(dj.plan ?? { pages: [] })}\n\n` +
      `THÈME ACTUEL : ${JSON.stringify(dj.theme ?? {})}\n\n` +
      `DEMANDE : ${message}`;

    const msgs: AnthropicMessage[] = [...history, { role: "user", content: ctxMsg }];
    const res = await callAnthropic({ model: MODELS.quality, system: SYSTEM, messages: msgs, max_tokens: 4000, temperature: 0.4 });
    const parsed = extractJson<{ action?: string; answer?: string; plan?: DashPlan; theme?: Theme; summary?: string }>(res.text);

    // Mode RÉPONSE (par défaut) : pas de nouvelle version.
    if (parsed.action !== "edit" || !parsed.plan?.pages?.length) {
      return json({ action: "answer", answer: parsed.answer ?? parsed.summary ?? "Je n'ai pas de réponse à partir des données disponibles." });
    }

    // Mode MODIFICATION : on re-rend avec le nouveau plan (+ thème éventuel) et on enregistre une version.
    const theme: Theme = { ...(dj.theme ?? {}), ...(parsed.theme ?? {}), icons: { ...((dj.theme ?? {}).icons ?? {}), ...((parsed.theme ?? {}).icons ?? {}) } };
    const html = renderDashboard(
      { client: dj.client ?? client?.name ?? "", period: dj.period ?? (dash as any).period, currency: dj.currency ?? client?.currency ?? "EUR",
        brand: client?.brand as any, theme, metrics, history: dj.history ?? { months: [], series: {}, labels: {} }, breakdowns: dj.breakdowns as any, targets: dj.targets },
      { pages: parsed.plan.pages as any, theme },
    );

    const saved = await insertVersion(admin, "dashboards", { client_id: (dash as any).client_id, period: (dash as any).period }, {
      standardized_data_id: (dash as any).standardized_data_id ?? null,
      html, data_json: { ...dj, plan: parsed.plan, theme }, status: (dash as any).status ?? "draft_ia", created_by: user.id,
    });

    return json({ action: "edit", dashboard: saved, summary: parsed.summary ?? "Dashboard mis à jour." });
  } catch (e) {
    console.error("dashboard-chat:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
