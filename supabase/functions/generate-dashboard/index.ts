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
import { renderDashboard, type DashPlan, type Metric, type Widget } from "../_shared/dashboardRender.ts";

const PLAN_SYSTEM = (activity: string) => `Tu es un ANALYSTE FINANCIER SENIOR et le CONSEILLER de ce client "${activity}". Tu ne « poses pas des graphes » : tu produis un RAPPORT MENSUEL qui RACONTE UNE HISTOIRE — où en est l'entreprise ce mois-ci, ce qui va, ce qui ne va pas, et quoi faire. Le dashboard est livré à un dirigeant qui paie pour du CONSEIL, pas pour une galerie de graphiques.

POSTURE & EXIGENCE D'ANALYSE :
- RAISONNE D'ABORD comme un analyste : lis les chiffres et leurs variations, repère les 3-4 faits marquants du mois (forces, dérives, risques), déduis des causes plausibles à partir des données (ex. « marge brute en hausse alors que le CA stagne → meilleur mix produit »), et formule des RECOMMANDATIONS concrètes.
- Le NARRATIF est OBLIGATOIRE (c'est ce qui manque le plus) :
  · La page « Vue d'ensemble » s'ouvre par un callout de SYNTHÈSE (3-5 phrases) : la lecture du mois en langage dirigeant.
  · CHAQUE page contient au moins 1 callout d'analyse : constat chiffré → interprétation → reco ou point de vigilance (tone good/warn/info).
  · Les callouts citent des chiffres RÉELS (fournis) mais tu PEUX et DOIS interpréter et conseiller. Tu n'inventes jamais un chiffre ; tu as le droit de raisonner dessus.
- Mobilise ta connaissance du SECTEUR "${activity}" : KPIs qui comptent vraiment, ordres de grandeur sains, pièges classiques. Pour de l'E-COMMERCE p.ex. : taux de conversion (sessions→commandes), panier moyen, coût d'acquisition vs panier, taux de retour, poids de la pub dans le CA, marge après COGS+logistique+PSP, saisonnalité.

ANTI-RÉPÉTITION (problème n°1 à éviter) :
- INTERDIT d'avoir deux pages qui se ressemblent. Chaque page a un ANGLE UNIQUE et un titre qui le dit. NE crée PAS une page par poste comptable (pas de « page CA » + « page Charges » + « page Marge » qui réaffichent les mêmes bar/donut/table). Ces postes se LISENT ENSEMBLE.
- Un même couple (type de graphe + donnée) n'apparaît qu'UNE fois dans tout le dashboard. Sur l'ensemble, n'emploie pas le même TYPE de graphe plus de 2 fois.
- Structure RECOMMANDÉE (adapte au métier, ne copie pas bêtement) :
  · « Vue d'ensemble » : synthèse + KPIs clés + 1 graphe fort de tendance/structure + objectifs.
  · E-commerce → « Acquisition & conversion » (funnel, sessions/pays, panier), « Ventes & produits » (top produits, mix, saisonnalité jour), « Rentabilité » (P&L flow/waterfall, marge, structure des charges), « Trésorerie & objectifs » (cash, jauges vs cibles).
  · Autres activités → décline des angles équivalents (acquisition/activité, production/livraison, rentabilité, trésorerie).
- Si les données sont pauvres, fais MOINS de pages mais COHÉRENTES — jamais du remplissage répétitif.

VARIÉTÉ & CHOIX DU GRAPHE selon la FORME de la donnée :
- breakdown PAR PAYS → map, puis varie avec rose / polar / ranking.
- breakdown PRODUITS / CATÉGORIES → treemap, pictorial, lollipop, share, sunburst (si libellés « Parent / Enfant »), ranking.
- breakdown JOURNALIER (daily_sales) → calendar, histogram, area.
- plusieurs KPIs d'un coup → radar, trend_grid, bullet/rings (si cibles), diverging.
- historique ≥3 mois → area, stacked_area, river, combo (barres+courbe), slope, matrix, stacked, line.
- chaîne P&L (CA→marge→EBITDA→résultat) → flow (sankey) ou waterfall (cascade) — une seule fois.
- indicateur vs CIBLE → gauge, gauge_grid, bullet, rings.
- DIRECTIVE DE VARIÉTÉ esthétique fournie dans le message : privilégie cette famille ce coup-ci, sans sacrifier la pertinence.

DENSITÉ : chaque page = un kpi_row (si pertinent) + 3 à 6 graphes VARIÉS + 1-2 callouts d'analyse. Dashboard de 2 à 4 pages distinctes. JAMAIS une page à 1 seul graphe.
Le rendu est une grille 3 colonnes : juxtapose des graphes complémentaires (ex. funnel + share + gauge_grid).
DONNÉE COURTE (historique < 3 mois) : n'utilise PAS les graphes temporels (line/area/river/combo/slope/matrix/stacked/stacked_area) — ils seraient vides. Construis avec les graphes « instantané » : bar, donut, rose, polar, treemap, pictorial, lollipop, share, ranking, map, gauge, gauge_grid, bullet, rings, radar, diverging, waterfall, flow, funnel, histogram, calendar. Mais décline des ANGLES différents, pas la même donnée répétée.
N'invente AUCUN chiffre. N'utilise QUE des ids/breakdowns/cibles fournis. Pas de widget qui resterait vide.
CONTINUITÉ : si une STRUCTURE du mois précédent est fournie, garde la même ossature (mêmes pages, mêmes grands choix) ; APPLIQUE les CONSIGNES (prioritaires). Sinon tu es libre.

WIDGETS (JSON) :
- {"type":"kpi_row","items":[{"metric":"id"}, ...]}                  // 3 à 6 KPIs clés
- {"type":"line","title":"...","metrics":["id", ...]}               // tendance (nécessite un historique)
- {"type":"bar","title":"...","metrics":["id", ...]}                // comparaison / structure (valeurs négatives en rouge)
- {"type":"donut","title":"...","metrics":["id", ...]}             // répartition (≥ 2 ids positifs)
- {"type":"table","title":"...","metrics":["id", ...]}             // détail (libellé / valeur / évolution)
- {"type":"funnel","title":"...","metrics":["id", ...]}            // entonnoir (style Shopify) : étapes décroissantes ordonnées (ex. sessions → ajouts panier → commandes) + taux de passage
- {"type":"ranking","title":"...","breakdown":"clé"}              // classement (barres horizontales) d'un BREAKDOWN fourni (ex. sales_by_country, sessions_by_country, top_products)
- {"type":"map","title":"...","breakdown":"clé"}                  // CARTE choroplèthe (monde, intensité par valeur) — idéale pour un breakdown PAR PAYS (sales_by_country / sessions_by_country)
- {"type":"gauge","title":"...","metrics":["id"]}                 // jauge d'objectif : un indicateur vs sa cible (UNIQUEMENT si une cible existe pour cet id, voir CIBLES)
- {"type":"stacked","title":"...","metrics":["id", ...]}          // barres empilées dans le temps (ex. répartition des charges par mois) — nécessite l'historique (≥2 mois)
- {"type":"flow","title":"..."}                                   // sankey du CA au résultat (CA → marge brute/COGS → EBITDA/charges)
- {"type":"radar","title":"...","metrics":["id", ...]}            // profil radar multi-indicateurs (≥3 ids) — ce mois vs M-1 (force/faiblesse en un coup d'œil)
- {"type":"treemap","title":"...","breakdown":"clé"}             // treemap d'un BREAKDOWN (poids relatif des catégories, ex. top_products) — surface ∝ valeur
- {"type":"calendar","title":"...","breakdown":"clé"}            // calendrier-heatmap d'un BREAKDOWN journalier (ex. daily_sales) — intensité par jour du mois
- {"type":"callout","title":"...","text":"...","tone":"info|warn|good"} // ANALYSE/CONSEIL : constat chiffré → interprétation → reco. good=point fort, warn=vigilance/dérive, info=lecture neutre. EN METTRE sur chaque page.

BIBLIOTHÈQUE PREMIUM ÉTENDUE (à EXPLOITER pour sortir du trio line/bar/donut — choisis selon la forme de la donnée ; 2 à 4 graphes forts et VARIÉS par page, sans répéter un type) :
Séries temporelles (nécessitent l'historique) :
- {"type":"area","title":"...","metrics":["id"(,…)]}            // courbe avec aire (1 à 4 ids) — tendance élégante
- {"type":"stacked_area","title":"...","metrics":["id", ...]}    // aires empilées — composition qui évolue dans le temps (≥2 ids)
- {"type":"river","title":"...","metrics":["id", ...]}           // stream graph fluide (≥2 ids, ≥3 mois) — flux/composition organique
- {"type":"combo","title":"...","metrics":["id"(bar)],"line":"id"} // barres + COURBE sur 2e axe (ex. CA en barres + marge % en courbe)
- {"type":"slope","title":"...","metrics":["id", ...]}           // pentes M-1→ce mois en base 100 (≥2 ids avec variation) — qui progresse/recule
- {"type":"matrix","title":"...","metrics":["id", ...]}          // carte de chaleur indicateurs × mois (≥2 ids, ≥3 mois)
Répartitions (BREAKDOWN) :
- {"type":"rose","title":"...","breakdown":"clé"}                // camembert de Nightingale (rayon ∝ valeur) — répartition stylée
- {"type":"polar","title":"...","breakdown":"clé"}               // barres radiales — classement circulaire premium
- {"type":"sunburst","title":"...","breakdown":"clé"}            // anneaux hiérarchiques — idéal si labels « Parent / Enfant »
- {"type":"pictorial","title":"...","breakdown":"clé"}           // barres-pictogrammes — très visuel (e-commerce)
- {"type":"lollipop","title":"...","breakdown":"clé"}            // bâtons-points — classement épuré (alternative à ranking)
- {"type":"share","title":"...","breakdown":"clé"}               // barre 100% — part de chaque poste dans le total
- {"type":"histogram","title":"...","breakdown":"clé"}           // distribution (ex. daily_sales) — dispersion des valeurs
Objectifs & variations (KPIs) :
- {"type":"bullet","title":"...","metrics":["id", ...]}          // barres d'objectif compactes vs cible (ids AVEC cible)
- {"type":"rings","title":"...","metrics":["id", ...]}           // anneaux de progression concentriques vs cibles (1-4 ids avec cible)
- {"type":"gauge_grid","title":"...","metrics":["id", ...]}      // plusieurs petites jauges côte à côte (ids avec cible)
- {"type":"diverging","title":"...","metrics":["id", ...]}       // variations vs M-1 en barres divergentes ± (vert/rouge)
- {"type":"comparison","title":"...","metrics":["id", ...]}      // barres groupées « M-1 vs ce mois »
- {"type":"trend_grid","title":"...","metrics":["id", ...]}      // grille de mini-tendances (sparklines) — synthèse de plusieurs KPIs

THÈME VISUEL — choisis le "mood" (TRAITEMENT visuel) adapté à l'UNIVERS du client. IMPORTANT : les COULEURS et la POLICE viennent AUTOMATIQUEMENT de la marque/du site — ne les définis PAS (pas de primary/accent/palette/font). Le mood ne change que le style (fond, en-tête, tuiles), pas les couleurs.
- mood : vivid | aurora | ocean | sunset | forest | noir | neon | royal | slate | corporate | pastel | editorial | glass | minimal | dark
  Exemples : sport/streetwear → vivid/aurora ; food/artisan → sunset/forest ; luxe/bijoux → noir/royal ; SaaS/tech → glass/neon ; finance/cabinet → slate/corporate ; cosmétique/bien-être → pastel ; média → editorial.
- icons : map { id_metrique: nom } parmi banknote, shopping-bag, shopping-cart, receipt, activity, target, trending-up, megaphone, star, wallet, percent, bar-chart, users, rotate, package, globe, zap, trophy, heart
Si un THÈME du mois précédent est fourni, GARDE-le (cohérence), sauf consigne contraire.

Réponds UNIQUEMENT en JSON : {"pages":[{"title":"...","widgets":[ ... ]}], "theme":{ "mood":"...", "icons":{ } }}
Rappel final : pages à ANGLES DISTINCTS, narratif (callouts d'analyse) sur chaque page, synthèse en ouverture, recommandations concrètes. Un dirigeant doit COMPRENDRE son mois en lisant ce rapport.`;

// 2e passe : un « directeur de l'analyse » durcit le plan (anti-répétition, narratif, cohérence).
const REVIEW_SYSTEM = (activity: string) => `Tu es le DIRECTEUR DE L'ANALYSE. On te soumet un PLAN de dashboard "${activity}" déjà composé par un analyste junior, avec les données disponibles. Ta mission : le RENDRE EXCELLENT en le RÉ-ÉCRIVANT. Sois exigeant et CORRIGE :
1. RÉPÉTITION (défaut le plus grave) : supprime ou FUSIONNE les pages qui se ressemblent (ex. « CA » + « Charges » + « Marge » qui montrent les mêmes graphes). Chaque page restante doit avoir un ANGLE clairement différent et un titre qui le dit. Un même couple (graphe+donnée) n'apparaît qu'une fois. Pas le même type de graphe > 2 fois au total.
2. NARRATIF : garantis une SYNTHÈSE (callout) en ouverture de la 1re page, et AU MOINS un callout d'analyse (constat chiffré → interprétation → reco/vigilance) sur CHAQUE page. Enrichis ou ajoute-les si absents — interprète les chiffres, conseille, sans inventer de chiffre.
3. PERTINENCE MÉTIER : ordonne les pages comme un vrai rapport ${activity} (vue d'ensemble → acquisition/activité → produits/ventes → rentabilité → trésorerie/objectifs selon ce qui existe). Mets en avant les KPIs qui comptent pour ce secteur.
4. VARIÉTÉ & VALIDITÉ : graphes variés et adaptés à la forme de la donnée ; n'utilise QUE des ids/breakdowns/cibles de la liste VALIDE fournie ; supprime tout widget qui resterait vide ; 3-6 graphes + kpi_row + callout(s) par page ; 2 à 4 pages.
Conserve le THÈME tel quel (ne touche pas aux couleurs/police). Renvoie le PLAN AMÉLIORÉ, MÊME FORMAT, UNIQUEMENT en JSON : {"pages":[{"title":"...","widgets":[ ... ]}]}. Si le plan est déjà excellent, renvoie-le quasi inchangé.`;

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
  const withChange = sections.flatMap((s) => s.rows.filter((r) => r.change_pct != null && r.id).map((r) => r.id!));
  const overview: Widget[] = [{ type: "kpi_row", items: totals.slice(0, 6).map((id) => ({ metric: id })) }];
  if (hasHistory) overview.push({ type: "line", title: "Tendance des principaux soldes", metrics: totals.slice(0, 4) });
  if (totals.length >= 2) overview.push({ type: "bar", title: "Principaux soldes", metrics: totals.slice(0, 6) });
  if (withChange.length >= 2) overview.push({ type: "diverging", title: "Variations vs M-1", metrics: withChange.slice(0, 8) });
  if (totals.length >= 3) overview.push({ type: "radar", title: "Profil financier", metrics: totals.slice(0, 6) });
  const pages: DashPlan["pages"] = [{ title: "Vue d'ensemble", widgets: overview }];
  // Rentabilité : sankey/cascade P&L + structure des charges (sans dupliquer la vue d'ensemble).
  const profit: Widget[] = [{ type: "flow", title: "Du chiffre d'affaires au résultat" }];
  if (totals.length >= 2) profit.push({ type: "waterfall", title: "Cascade du résultat", metrics: totals.slice(0, 5) });
  const charges = sections.find((s) => /charge|opex|exploit/i.test(s.label ?? ""));
  if (charges) {
    const cids = charges.rows.filter((r) => typeof r.value === "number" && (r.value as number) > 0 && r.id).map((r) => r.id!);
    if (cids.length >= 2) profit.push({ type: "donut", title: "Structure des charges", metrics: cids.slice(0, 6) });
  }
  if (profit.length >= 2) pages.push({ title: "Rentabilité", widgets: profit });
  // Une SEULE page de détail comptable : une table par section (données différentes, pas de répétition de graphes).
  const detail: Widget[] = sections.map((s) => ({ type: "table" as const, title: s.label, metrics: s.rows.map((r) => r.id!).filter(Boolean) })).filter((w) => w.metrics.length);
  if (detail.length) pages.push({ title: "Détail comptable", widgets: detail });
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
    const prevTheme = (prevDash?.data_json as { theme?: unknown } | null)?.theme ?? null;
    const guidance = ((client as { dashboard_guidance?: string } | null)?.dashboard_guidance ?? "").trim();

    const breakdowns = (sd.data as { breakdowns?: Record<string, { label: string; rows: { label: string; value: number; unit?: string }[] }> })?.breakdowns;
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
    // Séries pour TOUS les indicateurs présents (permet courbes ET barres empilées sur n'importe quel poste).
    const labelOf: Record<string, string> = {};
    for (const s of sections) for (const r of s.rows) if (r.id) labelOf[r.id] = r.label ?? r.id;
    const series: Record<string, (number | null)[]> = {};
    for (const id of Object.keys(labelOf)) {
      const arr = monthsRaw.map((m) => (typeof m.map[id] === "number" ? m.map[id] : null));
      if (arr.some((x) => x != null)) series[id] = arr;
    }
    const history = { months: monthsRaw.map((m) => shortMonth(m.period)), series, labels: labelOf };

    // Objectifs (contexte) → cibles des jauges ; à défaut, le mois précédent sert de référence.
    const { data: ctxRow } = await admin.from("contexts").select("data").eq("client_id", client_id).eq("is_current", true).maybeSingle();
    const objectives = ((ctxRow?.data as { objectives?: Record<string, number> } | null)?.objectives) ?? {};
    const targets: Record<string, number> = {};
    for (const id of Object.keys(labelOf)) { const t = objectives[id] ?? (typeof prevMap[id] === "number" ? prevMap[id] : undefined); if (typeof t === "number" && isFinite(t) && t > 0) targets[id] = t; }

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

    // Directive de VARIÉTÉ : tourne à chaque génération pour que régénérer explore d'autres graphes premium.
    const VARIETY_FAMILIES = [
      "ORGANIQUE & FLUIDE — privilégie area, river (stream), rose, sunburst, treemap : des formes douces et enveloppantes.",
      "STRUCTURÉ & ANALYTIQUE — privilégie matrix (heatmap), stacked_area, combo (barres+courbe), stacked, table riche : une lecture rigoureuse.",
      "EDITORIAL & VISUEL — privilégie pictorial, lollipop, share (barre 100%), treemap, ranking : un rendu magazine, très visuel.",
      "PERFORMANCE & OBJECTIFS — privilégie slope, diverging, bullet, rings, gauge_grid, radar : centré sur progression et atteinte des cibles.",
      "GÉO & RÉPARTITION — privilégie map, polar, rose, donut, share : met l'accent sur les répartitions (pays, canaux, produits).",
      "DYNAMIQUE TEMPORELLE — privilégie line, area, combo, calendar, histogram, slope : raconte l'évolution dans le temps.",
    ];
    const variety = VARIETY_FAMILIES[Math.floor(Math.random() * VARIETY_FAMILIES.length)];

    const planMsg = [{ role: "user" as const, content:
      `Activité : ${activity}. Client : ${client?.name ?? ""}. Mois : ${period} (devise ${client?.currency ?? "EUR"}).\n\n` +
      `DONNÉES DISPONIBLES (id, libellé, valeur, évolution) :\n${metricsText}\n\n` +
      `HISTORIQUE : ${history.months.length} mois (${history.months.join(", ")}). Tendances possibles sur : ${trendText}.\n\n` +
      `BREAKDOWNS (alimentent map/ranking/treemap/rose/polar/sunburst/pictorial/lollipop/share/histogram/calendar) : ${breakdowns && Object.keys(breakdowns).length ? Object.entries(breakdowns).map(([k, v]) => `${k} — ${v.label}`).join(" ; ") : "aucun"}.\n` +
      `CIBLES (alimentent gauge/gauge_grid/bullet/rings) : ${Object.keys(targets).length ? Object.keys(targets).join(", ") : "aucune"}.\n\n` +
      `BRIEF MÉTIER :\n${briefText}\n\n` +
      `DIRECTIVE DE VARIÉTÉ (oriente TES choix de graphes CETTE génération, sans sacrifier la pertinence) : ${variety}` +
      `\n\nMARQUE (couleurs/charte si dispo) : ${(client as { brand?: unknown })?.brand ? JSON.stringify((client as { brand?: unknown }).brand) : "non fournie — choisis une palette adaptée au secteur"}` +
      (prevTheme ? `\n\nTHÈME DU MOIS PRÉCÉDENT — à CONSERVER (cohérence visuelle dans le temps) sauf consigne contraire :\n${JSON.stringify(prevTheme)}` : "") +
      (prevPlan ? `\n\nSTRUCTURE DU MOIS PRÉCÉDENT — à CONSERVER dans sa forme générale (mêmes pages/onglets, mêmes types de graphes), en adaptant les chiffres et l'analyse au mois courant :\n${JSON.stringify(prevPlan)}` : "") +
      (guidance ? `\n\nCONSIGNES DURABLES (issues des calls client — à APPLIQUER en priorité) :\n${guidance}` : "") }];

    // Travail LOURD (2 passes IA + rendu + sauvegarde) — exécuté en TÂCHE DE FOND pour ne pas
    // dépasser le délai de la passerelle. La fonction répond tout de suite ; le cockpit recharge
    // dès que la nouvelle version apparaît en base.
    const produce = async () => {
      // Passe IA : composer le plan (Opus, relais Sonnet si timeout).
      let plan: DashPlan | null = null;
      try {
        let raw: string;
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 80_000);
          try { raw = (await callAnthropic({ model: MODELS.quality, system: PLAN_SYSTEM(activity), messages: planMsg, max_tokens: 4000, temperature: 0.9, signal: ctrl.signal })).text; }
          finally { clearTimeout(timer); }
        } catch (e) {
          console.warn("plan Opus KO/timeout → relais Sonnet:", e instanceof Error ? e.message : String(e));
          raw = (await callAnthropic({ model: MODELS.fast, system: PLAN_SYSTEM(activity), messages: planMsg, max_tokens: 4000, temperature: 0.9 })).text;
        }
        plan = extractJson<DashPlan>(raw);
      } catch (e) { console.error("plan:", e); }
      if (!plan || !Array.isArray(plan.pages) || !plan.pages.length) plan = defaultPlan(sections, history.months.length > 1);

      // 2e passe — RELECTURE : un « directeur de l'analyse » durcit le plan (anti-répétition, narratif, cohérence).
      try {
        const validIds = Object.keys(metrics);
        const reviewMsg = [{ role: "user" as const, content:
          `Activité : ${activity}. Mois : ${period}.\n\n` +
          `IDS VALIDES (métriques) : ${validIds.join(", ") || "aucun"}.\n` +
          `BREAKDOWNS VALIDES : ${breakdowns && Object.keys(breakdowns).length ? Object.keys(breakdowns).join(", ") : "aucun"}.\n` +
          `CIBLES VALIDES : ${Object.keys(targets).length ? Object.keys(targets).join(", ") : "aucune"}.\n` +
          `HISTORIQUE : ${history.months.length} mois.\n\n` +
          `DONNÉES (id, valeur, variation) :\n${metricsText}\n\n` +
          `PLAN À RELIRE ET AMÉLIORER :\n${JSON.stringify({ pages: plan.pages })}` }];
        const ctrl2 = new AbortController();
        const timer2 = setTimeout(() => ctrl2.abort(), 45_000);
        let reviewRaw: string;
        try { reviewRaw = (await callAnthropic({ model: MODELS.fast, system: REVIEW_SYSTEM(activity), messages: reviewMsg, max_tokens: 4000, temperature: 0.3, signal: ctrl2.signal })).text; }
        finally { clearTimeout(timer2); }
        const reviewed = extractJson<DashPlan>(reviewRaw);
        if (reviewed && Array.isArray(reviewed.pages) && reviewed.pages.length) {
          plan = { pages: reviewed.pages, theme: plan.theme };
        }
      } catch (e) { console.warn("relecture KO (on garde le plan initial):", e instanceof Error ? e.message : String(e)); }

      const theme = (plan.theme && Object.keys(plan.theme).length) ? plan.theme : (prevTheme ?? {});
      const html = renderDashboard(
        { client: client?.name ?? "", period, currency: client?.currency ?? "EUR", brand: client?.brand as any, theme: theme as any, metrics, history, breakdowns, targets },
        plan,
      );
      const clientData = { client: client?.name ?? "", period, currency: client?.currency ?? "EUR", sections, history, plan, theme, breakdowns, targets };
      const saved = await insertVersion(admin, "dashboards", { client_id, period }, {
        standardized_data_id: sd.id, html, data_json: clientData, status: "draft_ia", created_by: user.id,
      });
      await admin.from("dashboard_status_history").insert({
        dashboard_id: saved.id, from_status: null, to_status: "draft_ia", changed_by: user.id, note: "Généré par l'IA (plan + rendu)",
      });
      return saved;
    };

    const ER = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime;
    if (ER && typeof ER.waitUntil === "function") {
      ER.waitUntil(produce().catch((e) => console.error("generate-dashboard (fond):", e)));
      return json({ status: "processing" });
    }
    const saved = await produce(); // fallback (dev local sans EdgeRuntime) : synchrone
    return json({ ok: true, dashboard: saved });
  } catch (e) {
    console.error("generate-dashboard:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
