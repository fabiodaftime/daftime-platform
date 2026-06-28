// ③ generate-dashboard — dashboard MULTI-PAGES à partir de la data VALIDÉE.
// (1) le code calcule variations + tendances ; (2) l'IA COMPOSE un PLAN (pages/widgets, libre,
// guidé par le brief de l'activité) ; (3) le code REND le HTML (charte, graphes, chiffres validés).
// Aucun chiffre inventé : le rendu et les graphes utilisent la data ; l'IA ne fait que composer.
//
// Body: { client_id, period: "YYYY-MM-01", standardized_data_id? }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { callAnthropic, extractJson, MODELS } from "../_shared/anthropic.ts";
import { insertVersion } from "../_shared/versioning.ts";
import { renderDashboard, type DashPlan, type Metric } from "../_shared/dashboardRender.ts";

const PLAN_SYSTEM = (activity: string) => `Tu COMPOSES le plan d'un dashboard financier mensuel pour un client "${activity}". Tu choisis LIBREMENT les pages et widgets les plus PERTINENTS au vu des données RÉELLES et du métier — adapté à l'entreprise, pas générique.

RÈGLES :
- N'invente AUCUN chiffre. Les widgets ne portent que des RÉFÉRENCES d'indicateurs (ids fournis). Les textes "callout" ne citent QUE des chiffres/variations fournis — aucune invention, et AUCUNE recommandation (sauf demande explicite).
- N'utilise QUE des ids présents dans la liste fournie. Pas de widget qui resterait vide.
- PLUSIEURS pages (onglets) : une « Vue d'ensemble » puis des pages d'analyse thématiques adaptées au métier. Respecte les incontournables du BRIEF.
- CONTINUITÉ : si une STRUCTURE du mois précédent est fournie, GARDE la même forme générale (mêmes pages/onglets, mêmes types de graphes) — on veut un suivi cohérent d'un mois à l'autre. Adapte seulement les chiffres et l'analyse au mois courant, et APPLIQUE les CONSIGNES fournies (elles priment). Ne change la structure que si une consigne le demande.
- Chaque page : un kpi_row en tête si pertinent ; des graphes VARIÉS et bien choisis (line = tendance, bar = comparaison/structure, donut = répartition) ; des tables de détail ; des callouts d'analyse (lecture du mois, constats chiffrés, points de vigilance).

WIDGETS (JSON) :
- {"type":"kpi_row","items":[{"metric":"id"}, ...]}                  // 3 à 6 KPIs clés
- {"type":"line","title":"...","metrics":["id", ...]}               // tendance (nécessite un historique)
- {"type":"bar","title":"...","metrics":["id", ...]}                // comparaison / structure (valeurs négatives en rouge)
- {"type":"donut","title":"...","metrics":["id", ...]}             // répartition (≥ 2 ids positifs)
- {"type":"table","title":"...","metrics":["id", ...]}             // détail (libellé / valeur / évolution)
- {"type":"callout","title":"...","text":"...","tone":"info|warn|good"}

Réponds UNIQUEMENT en JSON : {"pages":[{"title":"...","widgets":[ ... ]}]}`;

type Row = { id?: string; label?: string; value?: unknown; unit?: string; type?: string; change_pct?: number };
const idVal = (d: { sections?: { rows?: Row[] }[] } | null | undefined): Record<string, number> => {
  const m: Record<string, number> = {};
  for (const sec of (d?.sections ?? [])) for (const r of (sec.rows ?? [])) if (typeof r.value === "number" && r.id) m[r.id] = r.value;
  return m;
};
const shortMonth = (p: string) => { try { return new Date(p).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }); } catch { return p.slice(0, 7); } };
const r2 = (n: number) => Math.round(n * 100) / 100;

function defaultPlan(sections: { label?: string; rows: Row[] }[], hasHistory: boolean): DashPlan {
  const totals = sections.flatMap((s) => s.rows.filter((r) => r.type === "total" || r.id === "ca").map((r) => r.id!)).filter(Boolean);
  const pages: DashPlan["pages"] = [{
    title: "Vue d'ensemble",
    widgets: [
      { type: "kpi_row", items: totals.slice(0, 6).map((id) => ({ metric: id })) },
      ...(hasHistory ? [{ type: "line" as const, title: "Tendance des principaux soldes", metrics: totals.slice(0, 3) }] : []),
    ],
  }];
  for (const s of sections) pages.push({ title: s.label ?? "Détail", widgets: [{ type: "table", title: s.label, metrics: s.rows.map((r) => r.id!).filter(Boolean) }] });
  return { pages };
}

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

    const { data: sd } = body.standardized_data_id
      ? await admin.from("standardized_data").select("*").eq("id", body.standardized_data_id).maybeSingle()
      : await admin.from("standardized_data").select("*").eq("client_id", client_id).eq("period", period).eq("is_current", true).maybeSingle();
    if (!sd) return json({ error: "aucune donnée standardisée pour ce client/mois (lance d'abord standardize-data)" }, 404);

    const { data: client } = await admin.from("clients")
      .select("name, currency, brand, dashboard_guidance, activity_types:activity_type_id(slug, config)").eq("id", client_id).maybeSingle();

    const meta = (sd.data as { meta?: { template?: string; validated?: boolean; validation?: { ok?: boolean; blocking?: string[] } } })?.meta;
    if (meta?.template && !meta?.validated) {
      return json({ error: "Validez d'abord les données (cockpit → Valider) avant de générer le dashboard." }, 409);
    }
    // Validation automatique bloquante : champ clé manquant ou incohérence → pas de génération.
    if (meta?.validation && meta.validation.ok === false) {
      return json({ error: `Données incomplètes/incohérentes — dashboard bloqué : ${(meta.validation.blocking ?? []).join(" · ")}` }, 409);
    }

    // Historique (variations + tendances).
    const { data: hist } = await admin.from("standardized_data").select("period, data")
      .eq("client_id", client_id).eq("is_current", true).lt("period", period).order("period", { ascending: false }).limit(5);
    const monthsRaw = [...((hist as { period: string; data: unknown }[]) ?? [])].reverse()
      .map((h) => ({ period: h.period, map: idVal(h.data as any) }));
    monthsRaw.push({ period: period!, map: idVal(sd.data as any) });
    const prevMap = monthsRaw.length >= 2 ? monthsRaw[monthsRaw.length - 2].map : {};

    // CONTINUITÉ : plan du mois précédent (forme à conserver) + consignes durables (retours de call).
    const { data: prevDash } = await admin.from("dashboards").select("period, data_json")
      .eq("client_id", client_id).eq("is_current", true).lt("period", period).order("period", { ascending: false }).limit(1).maybeSingle();
    const prevPlan = (prevDash?.data_json as { plan?: DashPlan } | null)?.plan ?? null;
    const guidance = ((client as { dashboard_guidance?: string } | null)?.dashboard_guidance ?? "").trim();

    const sections = (((sd.data as { sections?: unknown[] })?.sections ?? []) as { label?: string; rows?: Row[] }[]).map((s) => ({
      label: s.label,
      rows: (s.rows ?? []).map((r) => {
        const row: Row = { id: r.id, label: r.label, value: r.value, unit: r.unit, ...(r.type === "total" ? { type: "total" } : {}) };
        const pv = r.id ? prevMap[r.id] : undefined;
        if (typeof r.value === "number" && typeof pv === "number" && pv !== 0) row.change_pct = Math.round(((r.value - pv) / Math.abs(pv)) * 1000) / 10;
        return row;
      }),
    }));

    // Tendances : totaux + CA/MRR.
    const trend: { id: string; label: string }[] = [];
    const seen = new Set<string>();
    for (const s of sections) for (const r of s.rows) {
      if (r.id && !seen.has(r.id) && (r.type === "total" || r.id === "ca" || r.id === "mrr")) { seen.add(r.id); trend.push({ id: r.id, label: r.label ?? r.id }); }
    }
    const series: Record<string, (number | null)[]> = {};
    for (const t of trend) series[t.id] = monthsRaw.map((m) => (typeof m.map[t.id] === "number" ? m.map[t.id] : null));
    const history = { months: monthsRaw.map((m) => shortMonth(m.period)), series, labels: Object.fromEntries(trend.map((t) => [t.id, t.label])) };

    // Carte des indicateurs (pour le rendu).
    const metrics: Record<string, Metric> = {};
    for (const s of sections) for (const r of s.rows) {
      if (typeof r.value === "number" && r.id) metrics[r.id] = { value: r.value, label: r.label ?? r.id, unit: r.unit ?? "", change_pct: r.change_pct ?? null };
    }

    const activity = (client as { activity_types?: { slug?: string } })?.activity_types?.slug ?? "inconnu";
    const brief = (client as { activity_types?: { config?: { dashboard?: unknown } } })?.activity_types?.config?.dashboard;

    // Texte des données dispo + brief pour le plan.
    const metricsText = sections.map((s) =>
      `[${s.label}]\n` + s.rows.filter((r) => typeof r.value === "number").map((r) =>
        `- ${r.id} (${r.label}): ${r.value}${r.unit ? " " + r.unit : ""}` + (r.change_pct != null ? ` (${(r.change_pct as number) >= 0 ? "+" : ""}${r.change_pct}% vs M-1)` : "")).join("\n")).join("\n");
    const trendText = Object.keys(series).map((id) => `${id} (${history.labels[id]})`).join(", ") || "aucune";
    const briefText = brief ? JSON.stringify(brief) : "Compose une « Vue d'ensemble » puis des pages d'analyse pertinentes selon les données.";

    const planMsg = [{ role: "user" as const, content:
      `Activité : ${activity}. Client : ${client?.name ?? ""}. Mois : ${period} (devise ${client?.currency ?? "EUR"}).\n\n` +
      `DONNÉES DISPONIBLES (id, libellé, valeur, évolution) :\n${metricsText}\n\n` +
      `HISTORIQUE : ${history.months.length} mois (${history.months.join(", ")}). Tendances possibles sur : ${trendText}.\n\n` +
      `BRIEF MÉTIER :\n${briefText}` +
      (prevPlan ? `\n\nSTRUCTURE DU MOIS PRÉCÉDENT — à CONSERVER dans sa forme générale (mêmes pages/onglets, mêmes types de graphes), en adaptant les chiffres et l'analyse au mois courant :\n${JSON.stringify(prevPlan)}` : "") +
      (guidance ? `\n\nCONSIGNES DURABLES (issues des calls client — à APPLIQUER en priorité) :\n${guidance}` : "") }];

    // Passe IA : composer le plan (Opus, relais Sonnet si timeout).
    let plan: DashPlan | null = null;
    try {
      let raw: string;
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 90_000);
        try { raw = (await callAnthropic({ model: MODELS.quality, system: PLAN_SYSTEM(activity), messages: planMsg, max_tokens: 4000, signal: ctrl.signal })).text; }
        finally { clearTimeout(timer); }
      } catch (e) {
        console.warn("plan Opus KO/timeout → relais Sonnet:", e instanceof Error ? e.message : String(e));
        raw = (await callAnthropic({ model: MODELS.fast, system: PLAN_SYSTEM(activity), messages: planMsg, max_tokens: 4000 })).text;
      }
      plan = extractJson<DashPlan>(raw);
    } catch (e) { console.error("plan:", e); }
    if (!plan || !Array.isArray(plan.pages) || !plan.pages.length) plan = defaultPlan(sections, history.months.length > 1);

    const html = renderDashboard(
      { client: client?.name ?? "", period, currency: client?.currency ?? "EUR", brand: client?.brand as any, metrics, history },
      plan,
    );

    // On sauvegarde le PLAN dans data_json → il sert de base de forme au mois suivant.
    const clientData = { client: client?.name ?? "", period, currency: client?.currency ?? "EUR", sections, history, plan };
    const saved = await insertVersion(admin, "dashboards", { client_id, period }, {
      standardized_data_id: sd.id, html, data_json: clientData, status: "draft_ia", created_by: user.id,
    });
    await admin.from("dashboard_status_history").insert({
      dashboard_id: saved.id, from_status: null, to_status: "draft_ia", changed_by: user.id, note: "Généré par l'IA (plan + rendu)",
    });

    return json({ ok: true, dashboard: saved });
  } catch (e) {
    console.error("generate-dashboard:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
