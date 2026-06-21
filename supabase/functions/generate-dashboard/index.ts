// ③ generate-dashboard — dashboard HTML autonome à partir de la data VALIDÉE du mois.
// Deux passes : (1) le CODE calcule les variations vs mois précédents + séries de tendance ;
// (2) une passe IA produit une LECTURE/analyse ancrée (sans recommandations) ; (3) l'IA rend le HTML.
// Les chiffres sont injectés (anti-hallucination). Statut initial : draft_ia.
//
// Body: { client_id, period: "YYYY-MM-01", standardized_data_id? }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { callAnthropic, stripCodeFences, extractJson, MODELS } from "../_shared/anthropic.ts";
import { insertVersion } from "../_shared/versioning.ts";
import { injectDashboardData } from "../_shared/dashboardHtml.ts";

const ANALYSIS_SYSTEM = `Tu es analyste financier. À partir des CHIFFRES et VARIATIONS fournis (et uniquement eux), rédige une LECTURE du mois claire et professionnelle.
RÈGLES STRICTES :
- Base-toi UNIQUEMENT sur les chiffres et variations donnés. N'invente aucun chiffre, ne spécule pas, ne projette pas.
- Donne une lecture et une analyse : ce qui progresse, ce qui se dégrade, les points de vigilance. Cite des chiffres/variations concrets.
- NE DONNE AUCUNE recommandation, conseil ni plan d'action.
- Concis, factuel, en français.
Réponds UNIQUEMENT en JSON : { "lecture": "2 à 4 phrases de synthèse", "points": ["constat chiffré", "..."], "vigilance": ["point d'attention", "..."] }`;

const SYSTEM = `Tu génères un DASHBOARD financier mensuel : un fichier HTML autonome, responsive, sobre et PROFESSIONNEL. Suis STRICTEMENT les règles ci-dessous — elles s'appliquent à TOUS les dashboards (cohérence).

DONNÉES (anti-invention) :
- Tout est dans window.DASHBOARD_DATA (injectée séparément — NE la déclare PAS, NE code EN DUR AUCUN chiffre, lis tout depuis cette variable). Forme :
  { client, period, currency,
    sections:[{label, rows:[{label, value, unit, type?, change?, change_pct?}]}],   // type:"total" = total ; change_pct = évolution vs mois précédent (%)
    history:{months:[...], series:{id:[valeurs/mois]}, labels:{id:libellé}},          // tendance multi-mois
    analysis:{lecture, points:[...], vigilance:[...]} }                                // analyse déjà rédigée
- N'affiche JAMAIS une valeur absente (ni un 0 inventé). Une section sans aucune donnée : ne l'affiche pas.

STRUCTURE (obligatoire, dans cet ordre) :
1. En-tête : nom du client (titre), mois en toutes lettres, devise — sobre.
2. Bandeau KPI : 3 à 6 cartes des chiffres CLÉS présents (priorité : CA/honoraires, marge brute, EBITDA, résultat net, trésorerie, + 1-2 KPIs métier). Chaque carte : libellé court, grand nombre formaté, et l'évolution change_pct (▲ vert si ≥0, ▼ rouge sinon). Jamais plus de 6 cartes.
3. Tendance : si history.months a ≥ 2 mois, UN graphe en ligne des principaux totaux (history.series + labels). Sinon, l'omettre. Chart.js via CDN https://cdn.jsdelivr.net/npm/chart.js. Les valeurs restent lisibles même sans Chart.js.
4. Sections détaillées : une carte par section, tableau Libellé / Valeur / Évolution. Lignes type:"total" en gras + léger fond. Colonne évolution = change_pct (▲/▼) si présent.
5. « Lecture du mois » : analysis.lecture en intro, puis analysis.points en liste à puces, et s'il y en a, analysis.vigilance sous un sous-titre « Points de vigilance ». N'AJOUTE AUCUNE recommandation au-delà de ce texte.

STYLE (sobre, pro) :
- Contenu centré, largeur max ~960px, marges et espacements réguliers et aérés.
- Cartes : coins arrondis (~12px), fine bordure, fond clair, ombre TRÈS légère. PAS de dégradés, d'effets criards, ni d'emojis décoratifs.
- Couleurs : utilise les tokens de charte fournis (variables CSS dans :root : primaire, accent, fond). À défaut : fond blanc, texte gris foncé, primaire bleu-nuit sobre. Vert/rouge UNIQUEMENT pour les variations.
- Typographie : hiérarchie claire (titre > sections > libellés) ; police de la charte si fournie, sinon system-ui ; nombres en chiffres tabulaires, alignés à droite dans les tableaux.
- FORMAT DES NOMBRES (impératif) : formate via Intl.NumberFormat('fr-FR') — séparateur de milliers, 0 décimale pour les montants, 1 décimale pour les %, suffixe l'unité (devise, %, x, j). Jamais de nombre brut non formaté.
- Responsive : grille de cartes qui passe à 1 colonne sur mobile.

Réponds UNIQUEMENT avec le document HTML COMPLET (de <!doctype html> à </html>), SANS JSON ni texte autour.`;

type Row = { id?: string; label?: string; value?: unknown; unit?: string; type?: string };
const idVal = (d: { sections?: { rows?: Row[] }[] } | null | undefined): Record<string, number> => {
  const m: Record<string, number> = {};
  for (const sec of (d?.sections ?? [])) for (const r of (sec.rows ?? [])) {
    if (typeof r.value === "number" && r.id) m[r.id] = r.value;
  }
  return m;
};
const shortMonth = (p: string) => { try { return new Date(p).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }); } catch { return p.slice(0, 7); } };
const r2 = (n: number) => Math.round(n * 100) / 100;

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

    const { data: client } = await admin.from("clients").select("name, currency, brand").eq("id", client_id).maybeSingle();

    // Porte de confiance : data pilotée par template => exiger la validation.
    const meta = (sd.data as { meta?: { template?: string; validated?: boolean } })?.meta;
    if (meta?.template && !meta?.validated) {
      return json({ error: "Validez d'abord les données (cockpit → Valider) avant de générer le dashboard." }, 409);
    }

    // Historique : mois précédents validés (pour variations + tendance).
    const { data: hist } = await admin.from("standardized_data").select("period, data")
      .eq("client_id", client_id).eq("is_current", true).lt("period", period)
      .order("period", { ascending: false }).limit(5);

    const months = [...((hist as { period: string; data: unknown }[]) ?? [])].reverse()
      .map((h) => ({ period: h.period, map: idVal(h.data as any) }));
    months.push({ period: period!, map: idVal(sd.data as any) });
    const prevMap = months.length >= 2 ? months[months.length - 2].map : {};

    // Sections client-facing enrichies de la variation vs M-1.
    const sections = (((sd.data as { sections?: unknown[] })?.sections ?? []) as { label?: string; rows?: Row[] }[]).map((s) => ({
      label: s.label,
      rows: (s.rows ?? []).map((r) => {
        const row: Record<string, unknown> = { id: r.id, label: r.label, value: r.value, unit: r.unit, ...(r.type === "total" ? { type: "total" } : {}) };
        const pv = r.id ? prevMap[r.id] : undefined;
        if (typeof r.value === "number" && typeof pv === "number") {
          row.change = r2(r.value - pv);
          if (pv !== 0) row.change_pct = Math.round(((r.value - pv) / Math.abs(pv)) * 1000) / 10;
        }
        return row;
      }),
    }));

    // Séries de tendance pour les totaux (et le CA).
    const trend: { id: string; label: string }[] = [];
    const seen = new Set<string>();
    for (const s of sections) for (const r of s.rows) {
      const id = r.id as string | undefined;
      if (id && !seen.has(id) && (r.type === "total" || id === "ca" || id === "mrr")) { seen.add(id); trend.push({ id, label: (r.label as string) ?? id }); }
    }
    const series: Record<string, (number | null)[]> = {};
    for (const t of trend) series[t.id] = months.map((m) => (typeof m.map[t.id] === "number" ? m.map[t.id] : null));
    const history = { months: months.map((m) => shortMonth(m.period)), series, labels: Object.fromEntries(trend.map((t) => [t.id, t.label])) };

    // ── Passe 1 : analyse (lecture du mois, sans recommandations) ──
    const figuresText = sections.map((s) =>
      `[${s.label}]\n` + s.rows.filter((r) => typeof r.value === "number").map((r) =>
        `- ${r.label}: ${r.value} ${r.unit ?? ""}` + (r.change_pct != null ? ` (${(r.change_pct as number) >= 0 ? "+" : ""}${r.change_pct}% vs M-1)` : "")).join("\n")
    ).join("\n");
    const trendText = history.months.length > 1
      ? `\n\nTendance (${history.months.join(", ")}) :\n` + trend.map((t) => `- ${t.label}: ${series[t.id].map((v) => (v == null ? "n/d" : v)).join(" → ")}`).join("\n")
      : "";

    // Génération (analyse + rendu Opus + sauvegarde). Exécutée en tâche de fond pour ne pas
    // bloquer la réponse (Opus dépasse souvent la durée d'une requête edge).
    const work = async () => {
      let analysis: { lecture?: string; points?: string[]; vigilance?: string[] } = { lecture: "", points: [], vigilance: [] };
      try {
        const res = await callAnthropic({
          model: MODELS.quality,
          system: ANALYSIS_SYSTEM,
          messages: [{ role: "user", content: `Client ${client?.name ?? ""} — ${period} (devise ${client?.currency ?? "EUR"}).\n\n${figuresText}${trendText}` }],
          max_tokens: 1500,
        });
        analysis = extractJson(res.text);
      } catch (e) { console.error("analysis:", e); }

      const clientData = { client: client?.name ?? "", period, currency: client?.currency ?? "EUR", sections, history, analysis };

      const userContent =
        `Client : ${client?.name ?? client_id} — Devise : ${client?.currency ?? "?"} — Mois : ${period}\n\n` +
        `CHARTE GRAPHIQUE (tokens de design à appliquer):\n${JSON.stringify(client?.brand ?? {}, null, 2)}\n\n` +
        `DONNÉES (à l'exécution dans window.DASHBOARD_DATA) :\n${JSON.stringify(clientData, null, 2)}`;

      // Rendu : Opus (qualité) avec budget de temps ; si dépassement/erreur → relais Sonnet (toujours produire un dashboard).
      const messages = [{ role: "user", content: userContent }];
      let out: string;
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 100_000); // ~100s pour Opus avant relais
        try {
          out = (await callAnthropic({ model: MODELS.quality, system: SYSTEM, messages, max_tokens: 14000, signal: ctrl.signal })).text;
        } finally { clearTimeout(timer); }
      } catch (e) {
        console.warn("Opus render KO/timeout → relais Sonnet:", e instanceof Error ? e.message : String(e));
        out = (await callAnthropic({ model: MODELS.fast, system: SYSTEM, messages, max_tokens: 14000 })).text;
      }
      let html = stripCodeFences(out);
      if (html.length < 50 || !html.includes("<") || !html.includes("DASHBOARD_DATA")) { console.error("generate: HTML invalide/sans DASHBOARD_DATA"); return; }
      html = injectDashboardData(html, clientData);

      const saved = await insertVersion(admin, "dashboards", { client_id, period }, {
        standardized_data_id: sd.id, html, data_json: clientData, status: "draft_ia", created_by: user.id,
      });
      await admin.from("dashboard_status_history").insert({
        dashboard_id: saved.id, from_status: null, to_status: "draft_ia", changed_by: user.id, note: "Généré par l'IA (Opus)",
      });
    };

    const ER = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime;
    if (ER && typeof ER.waitUntil === "function") {
      ER.waitUntil(work());
      return json({ ok: true, status: "generating" }, 202);
    }
    await work();
    return json({ ok: true, status: "done" });
  } catch (e) {
    console.error("generate-dashboard:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
