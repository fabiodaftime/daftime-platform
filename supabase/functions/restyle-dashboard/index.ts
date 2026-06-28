// restyle-dashboard — ajuste le THÈME VISUEL d'un dashboard par chat (couleurs, fond, icônes,
// mood…), SANS toucher aux chiffres ni à la structure. Re-rend et enregistre une nouvelle version.
//
// Body: { dashboard_id: uuid, message: string, history?: {role,content}[] }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { callAnthropic, extractJson, MODELS, type AnthropicMessage } from "../_shared/anthropic.ts";
import { insertVersion } from "../_shared/versioning.ts";
import { renderDashboard, type Metric } from "../_shared/dashboardRender.ts";
import { type Theme } from "../_shared/dashboardTheme.ts";

const SYSTEM = `Tu ajustes le THÈME VISUEL d'un dashboard financier selon l'instruction de l'utilisateur.
Tu ne touches NI aux chiffres NI à la structure (pages/widgets) — uniquement l'esthétique.
Champs du thème :
- mood (preset complet) : vivid | aurora | ocean | sunset | forest | noir | neon | royal | slate | corporate | pastel | editorial | glass | minimal | dark
- primary, accent : couleurs hex
- palette : tableau de 3 à 6 couleurs hex (graphes), harmonisées
- background : "soft" | "plain" | "gradient" | "dark" | "mesh" | "glass"
- header : "gradient" | "solid" | "dark" | "minimal" | "band"
- kpi : "icon" | "accent" | "gradient" | "plain" | "glass"
- googleFont : Inter | Sora | Manrope | Plus Jakarta Sans | DM Sans | Space Grotesk | Fraunces
- radius : nombre, density : "comfortable" | "compact"
- chart : style des graphes { area (aire sous les courbes), smooth (lissage), grid (grille visible), barRadius (arrondi barres), glow (halo/relief), lineWidth } — ex. « graphes plus épurés » → {area:false,grid:false,glow:false} ; « plus de relief » → {glow:true,area:true}
- icons : map { id_metrique: nom } parmi : banknote, shopping-bag, shopping-cart, receipt, activity, target, trending-up, megaphone, star, wallet, percent, bar-chart, users, rotate, package, globe, zap, trophy, heart, circle
RÈGLE COULEURS/POLICE : les couleurs (primary/accent/palette) et la police (font/googleFont) viennent de la MARQUE (site). Ne les change QUE si l'utilisateur le demande EXPLICITEMENT (ex. « mets du rouge », « police plus moderne »). Une demande d'ambiance/mood ou de fond NE doit PAS modifier les couleurs ni la police — laisse ces champs vides dans ta réponse pour qu'ils restent ceux de la marque.
Si l'utilisateur évoque une ambiance (« plus luxe », « plus sombre », « plus fun »), change seulement le "mood"/background/header/kpi. Renvoie le thème mis à jour (reprends les valeurs actuelles non modifiées).
Réponds UNIQUEMENT en JSON : { "theme": { ... }, "summary": "ce qui a changé en une phrase" }`;

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
    if (!dashboard_id || !message.trim()) return json({ error: "dashboard_id et message requis" }, 400);

    const { data: dash } = await admin.from("dashboards").select("*").eq("id", dashboard_id).maybeSingle();
    if (!dash) return json({ error: "dashboard introuvable" }, 404);
    const dataJson = ((dash as any).data_json ?? {}) as {
      client?: string; period?: string; currency?: string; sections?: any[]; history?: any; plan?: { pages?: any[] }; theme?: Theme; breakdowns?: any;
    };
    if (!dataJson.plan?.pages?.length) return json({ error: "ce dashboard n'a pas de plan ré-affichable (régénérez-le d'abord)" }, 409);

    const { data: client } = await admin.from("clients").select("name, currency, brand").eq("id", (dash as any).client_id).maybeSingle();

    const currentTheme = dataJson.theme ?? {};
    const metrics = idVal(dataJson.sections ?? []);
    const ids = Object.keys(metrics);

    const msg = [{ role: "user", content: `Thème actuel :\n${JSON.stringify(currentTheme)}\n\nMétriques disponibles (ids) : ${ids.join(", ")}\n\nInstruction : ${message}` } as AnthropicMessage];
    const res = await callAnthropic({ model: MODELS.fast, system: SYSTEM, messages: msg, max_tokens: 1200 });
    const parsed = extractJson<{ theme?: Theme; summary?: string }>(res.text);
    const theme: Theme = { ...currentTheme, ...(parsed.theme ?? {}), icons: { ...(currentTheme.icons ?? {}), ...((parsed.theme ?? {}).icons ?? {}) } };

    const html = renderDashboard(
      { client: dataJson.client ?? client?.name ?? "", period: dataJson.period ?? (dash as any).period, currency: dataJson.currency ?? client?.currency ?? "EUR",
        brand: client?.brand as any, theme, metrics, history: dataJson.history ?? { months: [], series: {}, labels: {} }, breakdowns: dataJson.breakdowns },
      { pages: dataJson.plan!.pages as any, theme },
    );

    const saved = await insertVersion(admin, "dashboards", { client_id: (dash as any).client_id, period: (dash as any).period }, {
      standardized_data_id: (dash as any).standardized_data_id ?? null,
      html, data_json: { ...dataJson, theme }, status: (dash as any).status ?? "draft_ia", created_by: user.id,
    });

    return json({ ok: true, dashboard: saved, summary: parsed.summary ?? "Thème mis à jour." });
  } catch (e) {
    console.error("restyle-dashboard:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
