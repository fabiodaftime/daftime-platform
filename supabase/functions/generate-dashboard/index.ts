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
import { assess } from "../_shared/benchmarks.ts";

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

// Passe NARRATIF : l'IA n'invente AUCUNE structure ni chiffre ; elle écrit l'analyse et choisit l'ambiance visuelle.
const NARRATIVE_SYSTEM = (activity: string) => `Tu es un ANALYSTE FINANCIER SENIOR / conseiller pour ce client "${activity}". On te donne les CHIFFRES du mois et la liste des PAGES d'un rapport déjà construit. Ta mission : écrire l'ANALYSE qui donne de la valeur, et choisir l'ambiance visuelle.
- N'invente AUCUN chiffre : tu peux calculer des ratios/écarts simples à partir des valeurs fournies et les interpréter.
- SYNTHÈSE (3-5 phrases) : la lecture du mois pour un dirigeant — performance, ce qui va / ne va pas, et l'enjeu principal. Concrète, chiffrée, sans jargon.
- INSIGHTS : pour CHAQUE page (par index), 1 analyse = constat chiffré → interprétation/cause plausible → recommandation ou point de vigilance. Mobilise les standards du secteur "${activity}" (ex. e-commerce : conversion saine ~2-3 %, ROAS, poids de la pub dans le CA, taux de retour, part de nouveaux clients vs fidélisation, marge après COGS/pub/PSP).
- TONE : good (point fort), warn (dérive/risque), info (lecture neutre).
- THÈME : choisis un "mood" adapté à l'univers ${activity} (ne définis PAS de couleurs/police, elles viennent de la marque) et des icônes par KPI si utile.
Réponds UNIQUEMENT en JSON : {"theme":{"mood":"...","icons":{}},"synthese":"...","insights":[{"page":0,"title":"...","text":"...","tone":"good|warn|info"}, ...]}`;

type Row = { id?: string; label?: string; value?: unknown; unit?: string; type?: string; change_pct?: number };
const idVal = (d: { sections?: { rows?: Row[] }[] } | null | undefined): Record<string, number> => {
  const m: Record<string, number> = {};
  for (const sec of (d?.sections ?? [])) for (const r of (sec.rows ?? [])) if (typeof r.value === "number" && r.id) m[r.id] = r.value;
  return m;
};
const shortMonth = (p: string) => { try { return new Date(p).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }); } catch { return p.slice(0, 7); } };
const r2 = (n: number) => Math.round(n * 100) / 100;

// ───────────────────────────────────────────────────────────────────────────
// MOTEUR DÉTERMINISTE : on NE laisse PAS l'IA composer la structure (elle propose des graphes
// dont la donnée n'existe pas → rendu vide). On construit un dashboard RICHE et 100 % rendable
// à partir des données réelles ; l'IA n'ajoute que le NARRATIF. Un validateur supprime tout
// widget qui se rendrait à vide (mêmes conditions que le moteur de rendu).
// ───────────────────────────────────────────────────────────────────────────
type Sec = { label?: string; rows: Row[] };
type Avail = { ids: Set<string>; pos: Set<string>; change: Set<string>; brk: Set<string>; tgt: Set<string>; months: number };

function availability(sections: Sec[], months: number, breakdownKeys: string[], targetIds: string[]): Avail {
  const ids = new Set<string>(), pos = new Set<string>(), change = new Set<string>();
  for (const s of sections) for (const r of s.rows) {
    if (r.id && typeof r.value === "number") { ids.add(r.id); if ((r.value as number) > 0) pos.add(r.id); if (r.change_pct != null) change.add(r.id); }
  }
  return { ids, pos, change, brk: new Set(breakdownKeys), tgt: new Set(targetIds), months };
}

// VRAI si le widget produira un rendu non vide (miroir des conditions de dashboardRender).
function renders(w: Widget, a: Avail): boolean {
  const m = w.metrics ?? [];
  const id = (x: string) => a.ids.has(x);
  const some = (n = 1) => m.filter(id).length >= n;
  switch (w.type) {
    case "kpi_row": return (w.items?.map((i) => i.metric) ?? m).some(id);
    case "bar": return some(1);
    case "table": return some(1) || !!(w.rows && w.rows.length);
    case "donut": return m.filter((x) => a.pos.has(x)).length >= 2;
    case "funnel": return some(2);
    case "waterfall": return some(2);
    case "flow": return id("ca") && id("marge_brute") && id("ebitda");
    case "radar": return some(3) && (m.some((x) => a.tgt.has(x)) || m.some((x) => a.change.has(x)));
    case "diverging": return m.filter((x) => a.change.has(x)).length >= 2;
    case "comparison": return m.some((x) => a.change.has(x));
    case "gauge": return !!m[0] && a.tgt.has(m[0]);
    case "gauge_grid": case "bullet": case "rings": return m.some((x) => a.tgt.has(x));
    case "line": case "area": case "trend_grid": return some(1) && a.months >= 2;
    case "stacked": case "stacked_area": case "combo": return some(2) && a.months >= 2;
    case "river": return some(2) && a.months >= 3;
    case "slope": return m.filter((x) => a.change.has(x)).length >= 2;
    case "matrix": return some(2) && a.months >= 3;
    // Répartitions utilisables AUSSI à partir d'une liste de métriques (pas seulement un breakdown nommé).
    case "ranking": case "polar": case "pictorial": case "lollipop":
      return (!!w.breakdown && a.brk.has(w.breakdown)) || some(2);
    case "treemap": case "rose": case "share":
      return (!!w.breakdown && a.brk.has(w.breakdown)) || m.filter((x) => a.pos.has(x)).length >= 2;
    case "map": case "sunburst": case "histogram": case "calendar":
      return !!w.breakdown && a.brk.has(w.breakdown);
    case "callout": return !!(w.text && w.text.trim());
    default: return false;
  }
}

function buildPlan(sections: Sec[], a: Avail): DashPlan {
  const id = (x: string) => a.ids.has(x);
  const pick = (...arr: string[]) => arr.filter(id);
  const sec = (re: RegExp) => sections.find((s) => re.test(s.label ?? ""));
  const secIds = (re: RegExp) => (sec(re)?.rows.map((r) => r.id!).filter(Boolean)) ?? [];
  const W = (w: Widget) => w;
  const pages: DashPlan["pages"] = [];

  // 1) VUE D'ENSEMBLE — la photo du mois : KPIs clés + P&L (sankey/cascade) + soldes.
  const ov: Widget[] = [];
  const kpisOv = pick("ca", "resultat_net", "ebitda", "marge_brute", "cash_end", "orders", "aov", "roas").slice(0, 6);
  if (kpisOv.length) ov.push(W({ type: "kpi_row", items: kpisOv.map((m) => ({ metric: m })) }));
  if (id("ca") && id("marge_brute") && id("ebitda")) ov.push(W({ type: "flow", title: "Du chiffre d'affaires au résultat" }));
  const chain = pick("ca", "marge_brute", "ebitda", "resultat_net");
  if (chain.length >= 2) ov.push(W({ type: "waterfall", title: "Cascade du résultat", metrics: chain }));
  const soldes = pick("ca", "marge_brute", "total_opex", "ebitda", "resultat_net");
  if (soldes.length >= 2) ov.push(W({ type: "bar", title: "Principaux soldes", metrics: soldes }));
  if (ov.length >= 2) pages.push({ title: "Vue d'ensemble", widgets: ov });

  // 2) ACQUISITION & CONVERSION (e-commerce) — entonnoir + publicité.
  const acq: Widget[] = [];
  const kAcq = pick("sessions", "orders", "conversion_rate", "cac", "roas", "aov").slice(0, 6);
  if (kAcq.length) acq.push(W({ type: "kpi_row", items: kAcq.map((m) => ({ metric: m })) }));
  const fn = pick("sessions", "add_to_carts", "orders");
  if (fn.length >= 2) acq.push(W({ type: "funnel", title: "Entonnoir de conversion", metrics: fn }));
  const pub = pick("ads_total", "ads_google", "new_customers", "cac", "cpa_order");
  if (pub.length >= 2) acq.push(W({ type: "bar", title: "Acquisition & publicité", metrics: pub }));
  const trafIds = [...secIds(/trafic|conversion/i), ...secIds(/acquisition|publicit/i)];
  if (trafIds.length) acq.push(W({ type: "table", title: "Trafic, conversion & acquisition", metrics: trafIds }));
  if (acq.length >= 3) pages.push({ title: "Acquisition & conversion", widgets: acq });

  // 3) RENTABILITÉ & CHARGES — marges + structure des coûts.
  const prof: Widget[] = [];
  const kProf = pick("marge_brute", "taux_marge_brute", "ebitda", "marge_ebitda", "resultat_net", "marge_nette").slice(0, 6);
  if (kProf.length) prof.push(W({ type: "kpi_row", items: kProf.map((m) => ({ metric: m })) }));
  const charges = pick("cogs", "payment_fees", "platform_fees", "ads_total", "other_opex").filter((x) => a.pos.has(x));
  if (charges.length >= 2) prof.push(W({ type: "donut", title: "Structure des charges", metrics: charges }));
  const tauxIds = pick("taux_marge_brute", "marge_ebitda", "marge_nette");
  if (tauxIds.length >= 2) prof.push(W({ type: "bar", title: "Taux de marge (%)", metrics: tauxIds }));
  const resIds = secIds(/résultat|resultat|marge|rentab/i);
  if (resIds.length) prof.push(W({ type: "table", title: "Compte de résultat", metrics: resIds }));
  if (prof.length >= 3) pages.push({ title: "Rentabilité & charges", widgets: prof });

  // 4) COMMANDES, CLIENTS & TRÉSORERIE.
  const ops: Widget[] = [];
  const kOps = pick("orders", "units", "aov", "total_customers", "repeat_rate", "cash_end").slice(0, 6);
  if (kOps.length) ops.push(W({ type: "kpi_row", items: kOps.map((m) => ({ metric: m })) }));
  const cmd = pick("gross_sales", "refunds", "orders", "units");
  if (cmd.length >= 2) ops.push(W({ type: "bar", title: "Commandes & retours", metrics: cmd }));
  const cli = pick("new_customers", "total_customers", "returning_customers");
  if (cli.length >= 2) ops.push(W({ type: "bar", title: "Clients", metrics: cli }));
  const tre = pick("cash_start", "cash_end", "cash_variation");
  if (tre.length >= 2) ops.push(W({ type: "bar", title: "Trésorerie", metrics: tre }));
  if (ops.length >= 3) pages.push({ title: "Commandes, clients & trésorerie", widgets: ops });

  // FILET : si peu de pages e-commerce (autre métier), garantir une structure générique riche.
  if (pages.length < 2) {
    const generic: Widget[] = [];
    const allIds = [...a.ids];
    if (allIds.length) generic.push(W({ type: "kpi_row", items: allIds.slice(0, 6).map((m) => ({ metric: m })) }));
    if (chain.length >= 2) generic.push(W({ type: "waterfall", title: "Cascade du résultat", metrics: chain }));
    if (soldes.length >= 2) generic.push(W({ type: "bar", title: "Principaux soldes", metrics: soldes }));
    if (generic.length >= 2 && !pages.length) pages.push({ title: "Vue d'ensemble", widgets: generic });
    const detail: Widget[] = sections.map((s) => W({ type: "table", title: s.label, metrics: s.rows.map((r) => r.id!).filter(Boolean) })).filter((w) => (w.metrics?.length ?? 0) > 0);
    if (detail.length) pages.push({ title: "Détail", widgets: detail });
  }
  return { pages };
}

// Supprime tout widget non rendable ; garde les pages à ≥2 widgets ; reconstruit si tout s'effondre.
function validatePlan(plan: DashPlan, a: Avail, sections: Sec[]): DashPlan {
  const pages = (plan.pages ?? [])
    .map((p) => ({ ...p, widgets: (p.widgets ?? []).filter((w) => renders(w, a)) }))
    .filter((p) => p.widgets.length >= 2);
  if (!pages.length) return buildPlan(sections, a);
  return { pages, theme: plan.theme };
}

// Liste lisible des types de widgets qui afficheront des données ce mois-ci (selon la donnée réelle).
function availableTypes(a: Avail): string {
  const t = ["kpi_row", "bar", "donut", "table", "funnel", "waterfall", "callout", "treemap", "rose", "polar", "pictorial", "lollipop", "share", "ranking"];
  if (a.ids.has("ca") && a.ids.has("marge_brute") && a.ids.has("ebitda")) t.push("flow");
  if (a.months >= 2) t.push("line", "area", "stacked", "stacked_area", "combo", "trend_grid");
  if (a.months >= 3) t.push("river", "matrix");
  if (a.change.size) t.push("diverging", "comparison");
  if (a.change.size >= 2) t.push("slope");
  if (a.tgt.size) t.push("gauge", "gauge_grid", "bullet", "rings");
  if (a.change.size || a.tgt.size) t.push("radar");
  if (a.brk.size) t.push("map", "calendar", "histogram", "sunburst");
  return t.join(", ");
}

// FILET DE DENSITÉ : garantit ≥ `min` graphes (hors KPI/callout/table) par page en puisant dans
// le pool déterministe (chaque graphe n'est utilisé qu'une fois pour éviter la répétition).
function ensureDensity(plan: DashPlan, a: Avail, sections: Sec[], min = 4): DashPlan {
  const isGraph = (w: Widget) => !["kpi_row", "callout", "table"].includes(w.type);
  const sig = (w: Widget) => `${w.type}:${(w.metrics ?? []).slice().sort().join(",") || w.breakdown || ""}`;
  const pool = buildPlan(sections, a).pages.flatMap((p) => p.widgets).filter((w) => isGraph(w) && renders(w, a));
  const used = new Set<string>(plan.pages.flatMap((p) => p.widgets.map(sig)));
  const pages = plan.pages.map((p) => {
    const widgets = [...p.widgets];
    let g = widgets.filter(isGraph).length;
    for (const w of pool) {
      if (g >= min) break;
      const s = sig(w);
      if (used.has(s)) continue;
      // insère le graphe après le kpi_row si présent, sinon en tête
      const at = widgets.findIndex((x) => x.type === "kpi_row");
      widgets.splice(at >= 0 ? at + 1 : 0, 0, w);
      used.add(s); g++;
    }
    return { ...p, widgets };
  });
  return { pages, theme: plan.theme };
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
      const a = availability(sections, history.months.length, Object.keys(breakdowns ?? {}), Object.keys(targets ?? {}));
      const avTypes = availableTypes(a);
      // Diagnostic sectoriel (repères) → on l'injecte pour que l'analyse IA soit FONDÉE, pas vague.
      const diag = Object.keys(metrics).map((id) => {
        const v = assess(id, metrics[id].value, activity);
        return v ? `- ${metrics[id].label} = ${metrics[id].value}${metrics[id].unit ? " " + metrics[id].unit : ""} → ${v.level === "good" ? "BON" : v.level === "warn" ? "MOYEN" : "ALERTE"} (${v.note})` : null;
      }).filter(Boolean).join("\n");

      // 1) COMPOSITION (IA) : l'IA conçoit la structure ET l'analyse, MAIS uniquement avec les types
      //    DISPONIBLES (calculés depuis la donnée) → plus de graphe vide. Riche : ≥6 graphes/page.
      let plan: DashPlan | null = null;
      let theme: Record<string, unknown> = (prevTheme as Record<string, unknown>) ?? {};
      const composeMsg = [{ role: "user" as const, content:
        `Activité : ${activity}. Client : ${client?.name ?? ""}. Mois : ${period} (devise ${client?.currency ?? "EUR"}).\n\n` +
        `DONNÉES DISPONIBLES (par section — id, libellé, valeur, variation) :\n${metricsText}\n\n` +
        `BREAKDOWNS : ${breakdowns && Object.keys(breakdowns).length ? Object.entries(breakdowns).map(([k, v]) => `${k} — ${v.label}`).join(" ; ") : "aucun"}.\n` +
        `CIBLES : ${Object.keys(targets).length ? Object.keys(targets).join(", ") : "aucune"}.\n\n` +
        `⛔ TYPES DE GRAPHES AUTORISÉS CE MOIS (les seuls qui afficheront des données — N'EN UTILISE AUCUN AUTRE) :\n${avTypes}\n` +
        `Les répartitions (treemap, rose, polar, pictorial, lollipop, share, ranking) acceptent une LISTE DE MÉTRIQUES (champ "metrics"), pas seulement un breakdown : sers-t'en pour faire parler les ratios (AOV, ROAS, CAC, CPA, taux…) et les postes (charges, canaux).\n\n` +
        (diag ? `\n📊 DIAGNOSTIC SECTORIEL (repères marché — APPUIE-TOI DESSUS dans les callouts, cite le repère et dis si c'est bon ou problématique) :\n${diag}\n` : "") +
        `\nEXIGENCES : 3 à 4 pages à ANGLES DISTINCTS ; CHAQUE page = un kpi_row + AU MOINS 6 graphes qui afficheront vraiment des données + 1 callout d'analyse. EXPLOITE toute la richesse (unit economics, acquisition, conversion, LTV/fidélisation, rentabilité, trésorerie) — pas seulement CA/marge. Varie les types.\n` +
        (guidance ? `\nCONSIGNES CLIENT (prioritaires) :\n${guidance}\n` : "") +
        (prevTheme ? `\nTHÈME À CONSERVER : ${JSON.stringify(prevTheme)}\n` : "") +
        `\nMARQUE : ${(client as { brand?: unknown })?.brand ? JSON.stringify((client as { brand?: unknown }).brand) : "non fournie"}` }];
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 80_000);
        let raw: string;
        try { raw = (await callAnthropic({ model: MODELS.quality, system: PLAN_SYSTEM(activity), messages: composeMsg, max_tokens: 5000, temperature: 0.7, signal: ctrl.signal })).text; }
        finally { clearTimeout(timer); }
        const parsed = extractJson<DashPlan>(raw);
        if (parsed && Array.isArray(parsed.pages) && parsed.pages.length) plan = parsed;
        if (parsed?.theme && Object.keys(parsed.theme).length) theme = { ...theme, ...parsed.theme, icons: { ...(theme.icons as object ?? {}), ...((parsed.theme as { icons?: object }).icons ?? {}) } };
      } catch (e) { console.warn("compose IA KO → structure déterministe:", e instanceof Error ? e.message : String(e)); }
      if (!plan) plan = buildPlan(sections, a);

      // 2) FILETS : on supprime les widgets vides puis on garantit la densité (≥5 graphes/page) via le pool déterministe.
      plan = validatePlan(plan, a, sections);
      plan = ensureDensity(plan, a, sections, 5);
      if (!theme || !Object.keys(theme).length) theme = { mood: "vivid" };

      const html = renderDashboard(
        { client: client?.name ?? "", period, currency: client?.currency ?? "EUR", activity, brand: client?.brand as any, theme: theme as any, metrics, history, breakdowns, targets },
        plan,
      );
      const clientData = { client: client?.name ?? "", period, currency: client?.currency ?? "EUR", activity, sections, history, plan, theme, breakdowns, targets };
      const saved = await insertVersion(admin, "dashboards", { client_id, period }, {
        standardized_data_id: sd.id, html, data_json: clientData, status: "draft_ia", created_by: user.id,
      });
      await admin.from("dashboard_status_history").insert({
        dashboard_id: saved.id, from_status: null, to_status: "draft_ia", changed_by: user.id, note: "Généré (composition IA + filets anti-vide/densité)",
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
