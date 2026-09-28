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
import { renderDashboardWithFx, type DashPlan, type Metric, type Widget } from "../_shared/dashboardRender.ts";
import { assess } from "../_shared/benchmarks.ts";
import type { Bridge } from "../_shared/marginBridge.ts";
import { prepareReport } from "../_shared/reportData.ts";
import { availableExtras, buildReportPlan, hasCascade, tailorFromText, type Tailoring } from "../_shared/reportPlan.ts";
import { numbersPreserved } from "../_shared/monthPoints.ts";
import type { CashForecast } from "../_shared/cashForecast.ts";

// DOCTRINE (docs/Doctrine_Pilotage_Econamy_Daftime.md) — fait autorité sur toute convention générale.
const DOCTRINE = `DOCTRINE DAFTIME (prime sur tes habitudes d'analyste) :
- Cascade CM1 → CM2 → CM3 au cœur (CM1 = CA − marchandises ; CM2 = CM1 − logistique − frais de paiement ; CM3 = CM2 − pub). Ne raisonne pas en « marge brute / EBITDA » quand la cascade est fournie.
- Marge d'abord : le CA n'est jamais l'axe de jugement ; toute conclusion part de la marge réelle.
- La pub se juge contre le POINT MORT DU SHOP (breakeven_roas = 1 / CM2, fourni), jamais contre une norme externe (« ROAS de 3 », « conversion de 2 % »…).
- Ordre de raisonnement : (1) le shop gagne-t-il et où ? (2) l'acquisition est-elle rentable ? (3) vitesse de croissance ? (4) quoi regarder ce mois-ci ? — jamais la croissance avant (1) et (2).
- Double lecture : engagement (« je gagne de l'argent ? ») ET trésorerie (« je tiens ? »).
- Ton : tutoiement, langage e-commerce ; jargon comptable proscrit (pas de BFR, DSO, DIO, DPO, CCC) ; distingue fait / hypothèse / recommandation.`;
// Filet anti-jargon sur tout texte du livrable (titres de pages/graphes, callouts, points) — l'IA l'oublie parfois.
const JARGON: [RegExp, string][] = [
  [/\bBFR\b/g, "argent immobilisé"], [/\bDSO\b/g, "délai d'encaissement"], [/\bDPO\b/g, "délai de paiement fournisseurs"],
  [/\bDIO\b/g, "jours de stock"], [/\bCCC\b/g, "cycle de cash"],
];
const dejargon = (s?: string) => (s ? JARGON.reduce((t, [re, rep]) => t.replace(re, rep), s) : s);

const PLAN_SYSTEM = (activity: string) => `Tu es un ANALYSTE FINANCIER SENIOR et le CONSEILLER de ce client "${activity}". Tu ne « poses pas des graphes » : tu produis un RAPPORT MENSUEL qui RACONTE UNE HISTOIRE — où en est l'entreprise ce mois-ci, ce qui va, ce qui ne va pas, et quoi faire. Le dashboard est livré à un dirigeant qui paie pour du CONSEIL, pas pour une galerie de graphiques.

POSTURE & EXIGENCE D'ANALYSE :
- RAISONNE D'ABORD comme un analyste : lis les chiffres et leurs variations, repère les 3-4 faits marquants du mois (forces, dérives, risques), déduis des causes plausibles à partir des données (ex. « marge brute en hausse alors que le CA stagne → meilleur mix produit »), et formule des RECOMMANDATIONS concrètes.
- Le NARRATIF est OBLIGATOIRE (c'est ce qui manque le plus) :
  · La page « Vue d'ensemble » s'ouvre par un callout de SYNTHÈSE (3-5 phrases) : la lecture du mois en langage dirigeant.
  · CHAQUE page contient au moins 1 callout d'analyse : constat chiffré → interprétation → reco ou point de vigilance (tone good/warn/info).
  · Les callouts citent des chiffres RÉELS (fournis) mais tu PEUX et DOIS interpréter et conseiller. Tu n'inventes jamais un chiffre ; tu as le droit de raisonner dessus.
- Mobilise ta connaissance du SECTEUR "${activity}" : KPIs qui comptent vraiment, pièges classiques. Pour de l'E-COMMERCE : cascade CM1 → CM2 → CM3, MER face au point mort pub (1/CM2), CM2 par commande, panier moyen, taux de retour, saisonnalité.

${DOCTRINE}
- Les « 3 points du mois » et le « pont d'écarts » sont insérés automatiquement en tête de la 1re page : ne les recopie pas, appuie tes callouts dessus.

ANTI-RÉPÉTITION (problème n°1 à éviter) :
- INTERDIT d'avoir deux pages qui se ressemblent. Chaque page a un ANGLE UNIQUE et un titre qui le dit. NE crée PAS une page par poste comptable (pas de « page CA » + « page Charges » + « page Marge » qui réaffichent les mêmes bar/donut/table). Ces postes se LISENT ENSEMBLE.
- Un même couple (type de graphe + donnée) n'apparaît qu'UNE fois dans tout le dashboard. Sur l'ensemble, n'emploie pas le même TYPE de graphe plus de 2 fois.
- Structure RECOMMANDÉE (adapte au métier, ne copie pas bêtement) :
  · « Vue d'ensemble » : synthèse + KPIs clés + 1 graphe fort de tendance/structure + objectifs.
  · E-commerce → « Acquisition & conversion » (funnel, sessions/pays, panier), « Ventes & produits » (top produits, mix, saisonnalité jour), « Rentabilité » (P&L flow/waterfall, marge, structure des charges), « Trésorerie & objectifs » (cash, jauges vs cibles).
  · Autres activités → décline des angles équivalents (acquisition/activité, production/livraison, rentabilité, trésorerie).
- Si les données sont pauvres, fais MOINS de pages mais COHÉRENTES — jamais du remplissage répétitif.

LISIBILITÉ AVANT TOUT — choisis le graphe le PLUS CLAIR selon la forme de la donnée (jamais un type « pour faire joli ») :
- breakdown PAR PAYS → map, sinon ranking.
- breakdown MULTI-COLONNES (channel_performance, category_performance…) → matrix_table (OBLIGATOIRE : ne jamais montrer un CA par canal/catégorie sans sa marge).
- breakdown PRODUITS / CATÉGORIES (mono-valeur) → treemap, share ou ranking.
- breakdown JOURNALIER (daily_sales) → calendar ou area.
- historique ≥3 mois → line, area, stacked_area, combo (barres+courbe), stacked, matrix.
- comparaison de postes / structure → bar, donut, share.
- chaîne P&L (CA→marge→EBITDA→résultat) → flow (sankey) OU waterfall — UNE SEULE fois dans TOUT le dashboard.
- indicateur vs CIBLE → gauge — AU PLUS 1 à 2 jauges dans TOUT le dashboard.

COHÉRENCE (évite les graphes illisibles / trompeurs) :
- Ne mélange JAMAIS des MONTANTS (€) et des POURCENTAGES/ratios (×) dans un même bar/donut/line — les échelles se cognent et le graphe ment.
- Un bar/donut = des grandeurs COMPARABLES (même unité, même ordre de grandeur).
- PEU de graphes forts et clairs > beaucoup de graphes variés. Ne répète pas la même donnée sous 3 formes.

DENSITÉ : chaque page = un kpi_row (si pertinent) + 2 à 4 graphes CLAIRS + 1-2 callouts d'analyse. Dashboard de 2 à 4 pages distinctes. JAMAIS une page à 1 seul graphe.
DONNÉE COURTE (historique < 3 mois) : n'utilise PAS les graphes temporels (line/area/combo/matrix/stacked/stacked_area) — ils seraient vides. Construis avec les graphes « instantané » : bar, donut, treemap, share, ranking, map, gauge, waterfall, flow, funnel, calendar, matrix_table. Décline des ANGLES différents, pas la même donnée répétée.
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
- {"type":"scorecard","title":"Diagnostic du mois"} // bloc santé : compte les indicateurs sains/à surveiller/en alerte + points forts & vigilances (selon les repères). Idéal en tête de la vue d'ensemble (auto-inséré si tu l'oublies).

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
- {"type":"matrix_table","title":"...","breakdown":"clé","sort_by":"colonne?","highlight":"best|worst|both?","total_row":true} // TABLEAU MULTI-COLONNES d'un breakdown À COLONNES (ex. channel_performance, category_performance) : 1 ligne par canal/catégorie, colonnes CA / commission / taux / marge. ⚠️ OBLIGATOIRE quand un breakdown multi-colonnes existe : ne JAMAIS présenter un CA par canal/catégorie sans sa marge. (Valeurs négatives affichées en rouge.)
- {"type":"scatter","title":"...","breakdown":"clé"} // NUAGE de points volume (CA) vs marge % d'un breakdown À COLONNES — repère d'un coup d'œil les gros volumes à FAIBLE marge (points sous 0 en rouge). Idéal en complément du matrix_table.
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
- INSIGHTS : pour CHAQUE page (par index), 1 analyse = constat chiffré → interprétation/cause plausible → recommandation ou point de vigilance.
${DOCTRINE}
- TONE : good (point fort), warn (dérive/risque), info (lecture neutre).
- THÈME : choisis un "mood" adapté à l'univers ${activity} (ne définis PAS de couleurs/police, elles viennent de la marque) et des icônes par KPI si utile.
Réponds UNIQUEMENT en JSON : {"theme":{"mood":"...","icons":{}},"synthese":"...","insights":[{"page":0,"title":"...","text":"...","tone":"good|warn|info"}, ...]}`;

type Row = { id?: string; label?: string; value?: unknown; unit?: string; type?: string; change_pct?: number };
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
    case "matrix_table": case "scatter":
      return !!w.breakdown && a.brk.has(w.breakdown);
    case "callout": return !!(w.text && w.text.trim());
    case "points": case "bridge": case "cash_forecast": return true; // insérés par le code seulement s'ils existent (vide sinon)
    case "scorecard": return true; // s'auto-valide au rendu (vide si < 3 verdicts)
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
  // Doctrine : la marge (CM3 / CM2) et la pub face à son point mort d'abord ; le CA n'est qu'un repère.
  const kpisOv = pick("cm3", "cm3_rate", "cm2_rate", "mer", "breakeven_roas", "cash_end", "ca", "resultat_net", "ebitda", "marge_brute").slice(0, 6);
  if (kpisOv.length) ov.push(W({ type: "kpi_row", items: kpisOv.map((m) => ({ metric: m })) }));
  if (id("ca") && id("marge_brute") && id("ebitda")) ov.push(W({ type: "flow", title: "Du chiffre d'affaires au résultat" }));
  const cmChain = pick("ca", "cm1", "cm2", "cm3");
  const chain = cmChain.length >= 3 ? cmChain : pick("ca", "marge_brute", "ebitda", "resultat_net");
  if (chain.length >= 2) ov.push(W({ type: "waterfall", title: cmChain.length >= 3 ? "Cascade de marges (CM1 → CM3)" : "Cascade du résultat", metrics: chain }));
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

  // 4) COMMANDES & CLIENTS.
  const ops: Widget[] = [];
  const kOps = pick("orders", "units", "aov", "total_customers", "repeat_rate", "new_customer_share").slice(0, 6);
  if (kOps.length) ops.push(W({ type: "kpi_row", items: kOps.map((m) => ({ metric: m })) }));
  const cmd = pick("gross_sales", "refunds", "orders", "units");
  if (cmd.length >= 2) ops.push(W({ type: "bar", title: "Commandes & retours", metrics: cmd }));
  const cli = pick("new_customers", "total_customers", "returning_customers");
  if (cli.length >= 2) ops.push(W({ type: "bar", title: "Clients", metrics: cli }));
  const opsTable = [...secIds(/commande|retour/i), ...secIds(/client|valeur|ltv/i)];
  if (opsTable.length) ops.push(W({ type: "table", title: "Commandes & clients", metrics: opsTable }));
  if (ops.length >= 3) pages.push({ title: "Commandes & clients", widgets: ops });

  // 5) TRÉSORERIE & ENCAISSEMENTS (jargon BFR proscrit côté client).
  const fin: Widget[] = [];
  const kFin = pick("cash_end", "cash_variation", "tresorerie_nette", "psp_balance", "psp_fee_rate", "psp_payout").slice(0, 6);
  if (kFin.length) fin.push(W({ type: "kpi_row", items: kFin.map((m) => ({ metric: m })) }));
  const fees = pick("payment_fees", "platform_fees").filter((x) => a.pos.has(x));
  if (fees.length >= 2) fin.push(W({ type: "treemap", title: "Frais (PSP & plateforme)", metrics: fees }));
  const tre = pick("cash_start", "cash_end", "cash_variation");
  if (tre.length >= 2) fin.push(W({ type: "bar", title: "Trésorerie", metrics: tre }));
  const pspBar = pick("psp_payout", "psp_balance", "payment_fees");
  if (pspBar.length >= 2) fin.push(W({ type: "bar", title: "Encaissements PSP", metrics: pspBar }));
  const bfrComp = pick("inventory_value", "receivables", "payables");
  if (bfrComp.length >= 2) fin.push(W({ type: "bar", title: "Argent immobilisé (stock, à encaisser, à payer)", metrics: bfrComp }));
  const finTable = [...secIds(/tr[eé]sor|cash/i), ...secIds(/psp|encaiss/i)];
  if (finTable.length) fin.push(W({ type: "table", title: "Trésorerie & encaissements", metrics: finTable }));
  if (fin.length >= 2) pages.push({ title: "Trésorerie & encaissements", widgets: fin });

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
function availableTypes(a: Avail, hasVerdicts = false, hasMatrix = false): string {
  // Palette RESSERRÉE à des graphes lisibles et « business ». On a retiré les types gadgets
  // (rose, polar, pictorial, lollipop, radar, sunburst, river, slope, diverging, histogram,
  //  gauge_grid/bullet/rings) qui rendaient les dashboards illisibles et incohérents.
  const t = ["kpi_row", "bar", "donut", "table", "funnel", "waterfall", "callout", "share", "ranking", "treemap"];
  if (hasVerdicts) t.push("scorecard");
  if (a.ids.has("ca") && a.ids.has("marge_brute") && a.ids.has("ebitda")) t.push("flow");
  if (a.months >= 2) t.push("line", "area", "stacked", "stacked_area", "combo", "trend_grid");
  if (a.months >= 3) t.push("matrix");
  if (a.change.size) t.push("comparison");
  if (a.tgt.size) t.push("gauge"); // au plus 1-2 jauges (voir PLAN_SYSTEM)
  if (a.brk.size) t.push("map", "calendar");
  if (hasMatrix) t.push("matrix_table", "scatter"); // seulement si un breakdown À COLONNES existe (rétrocompat : clients sans → prompt inchangé)
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

// Widgets OBLIGATOIRES (config client `forced_widgets`) : garantit leur présence dans le plan,
// UNIQUEMENT s'ils sont rendables ce mois-ci (données présentes) — jamais de widget vide.
// Dédup par signature (type + metrics/breakdown) : si l'IA l'a déjà mis, on ne double pas.
function ensureForced(plan: DashPlan, forced: Widget[], a: Avail): DashPlan {
  if (!forced?.length || !plan.pages?.length) return plan;
  const sig = (w: Widget) => `${w.type}:${(w.metrics ?? []).slice().sort().join(",") || w.breakdown || ""}`;
  const pages = plan.pages.map((p) => ({ ...p, widgets: [...(p.widgets ?? [])] }));
  const present = new Set(pages.flatMap((p) => p.widgets.map(sig)));
  for (const w of forced) {
    if (!w?.type || !renders(w, a) || present.has(sig(w))) continue;
    const at = pages[0].widgets.findIndex((x) => x.type === "kpi_row"); // après le kpi_row si présent
    pages[0].widgets.splice(at >= 0 ? at + 1 : 0, 0, w);
    present.add(sig(w));
  }
  return { ...plan, pages };
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
      .select("name, currency, brand, dashboard_guidance, benchmarks, forced_widgets, activity_types:activity_type_id(slug, config)").eq("id", client_id).maybeSingle();
    const clientBench = ((client as { benchmarks?: Record<string, unknown> } | null)?.benchmarks ?? {}) as Record<string, import("../_shared/benchmarks.ts").BenchOverride>;

    const meta = (sd.data as { meta?: { template?: string; validated?: boolean; validation?: { ok?: boolean; blocking?: string[] } } })?.meta;
    if (meta?.template && !meta?.validated) {
      return json({ error: "Validez d'abord les données (cockpit → Valider) avant de générer le dashboard." }, 409);
    }
    // Validation automatique bloquante : champ clé manquant ou incohérence → pas de génération.
    if (meta?.validation && meta.validation.ok === false) {
      return json({ error: `Données incomplètes/incohérentes — dashboard bloqué : ${(meta.validation.blocking ?? []).join(" · ")}` }, 409);
    }

    // DONNÉES DU LIVRABLE (module partagé _shared/reportData.ts, identique au banc de rendu local).
    const { data: hist } = await admin.from("standardized_data").select("period, data")
      .eq("client_id", client_id).eq("is_current", true).lt("period", period).order("period", { ascending: false }).limit(5);
    const { data: ctxRow } = await admin.from("contexts").select("data").eq("client_id", client_id).eq("is_current", true).maybeSingle();
    const objectives = ((ctxRow?.data as { objectives?: Record<string, number> } | null)?.objectives) ?? {};
    const rep = prepareReport({ period: period!, currency: (client as { currency?: string } | null)?.currency ?? "EUR",
      activityConfig: (client as { activity_types?: { config?: unknown } } | null)?.activity_types?.config, sdData: sd.data, history: (hist ?? []) as { period: string; data: unknown }[], objectives });
    const { sections, metrics, history, breakdowns, targets, bridgePrev, bridgeAvg, mainBridge, pointFacts, cashForecast, paymentLevers } = rep;
    const series = history.series;
    const fmtE = (x: number) => Math.round(x).toLocaleString("fr-FR");
    const bridgeText = (b: Bridge | null) => b ? `${b.level.toUpperCase()} ${fmtE(b.from)} (${b.base}) → ${fmtE(b.to)} ce mois (${b.delta >= 0 ? "+" : ""}${fmtE(b.delta)}) : ${b.effects.map((e) => `${e.label} ${e.value >= 0 ? "+" : ""}${fmtE(e.value)}`).join(" ; ")}${b.missing ? ` [${b.missing}]` : ""}` : "";

    // CONTINUITÉ : plan du mois précédent (forme à conserver) + consignes durables (retours de call).
    const { data: prevDash } = await admin.from("dashboards").select("period, data_json")
      .eq("client_id", client_id).eq("is_current", true).lt("period", period).order("period", { ascending: false }).limit(1).maybeSingle();
    const prevPlan = (prevDash?.data_json as { plan?: DashPlan } | null)?.plan ?? null;
    const prevTheme = (prevDash?.data_json as { theme?: unknown } | null)?.theme ?? null;
    const guidance = ((client as { dashboard_guidance?: string } | null)?.dashboard_guidance ?? "").trim();
    // CONTEXTE DU DOSSIER (résumé + champs structurés : objectifs, vigilance, saisonnalité…) — nourrit l'adaptation et les lectures.
    const ctxD = (ctxRow?.data ?? {}) as { summary?: unknown; fields?: unknown };
    const ctxText = [typeof ctxD.summary === "string" ? ctxD.summary.slice(0, 2500) : "",
      ctxD.fields && typeof ctxD.fields === "object" ? JSON.stringify(ctxD.fields).slice(0, 3500) : ""].filter(Boolean).join("\n");

    // Graphiques OBLIGATOIRES du client (config `forced_widgets`) — nettoyés en Widget[] sûrs.
    const forcedRaw = ((client as { forced_widgets?: unknown } | null)?.forced_widgets ?? []) as Array<Record<string, unknown>>;
    const forcedWidgets: Widget[] = Array.isArray(forcedRaw)
      ? forcedRaw.filter((w) => w && typeof w.type === "string").map((w) => ({
          type: w.type as Widget["type"],
          title: typeof w.title === "string" && w.title.trim() ? (w.title as string) : undefined,
          breakdown: typeof w.breakdown === "string" ? (w.breakdown as string) : undefined,
          metrics: Array.isArray(w.metrics) ? (w.metrics as unknown[]).filter((x) => typeof x === "string") as string[] : undefined,
          line: typeof w.line === "string" ? (w.line as string) : undefined,
        }))
      : [];

    const labelOf = history.labels;

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
      const doctrinal = hasCascade(rep);
      const a = availability(sections, history.months.length, Object.keys(breakdowns ?? {}), Object.keys(targets ?? {}));
      // Diagnostic sectoriel (repères) → on l'injecte pour que l'analyse IA soit FONDÉE, pas vague.
      const diagLines = Object.keys(metrics).map((id) => {
        const v = assess(id, metrics[id].value, activity, clientBench);
        return v ? `- ${metrics[id].label} = ${metrics[id].value}${metrics[id].unit ? " " + metrics[id].unit : ""} → ${v.level === "good" ? "BON" : v.level === "warn" ? "MOYEN" : "ALERTE"} (${v.note})` : null;
      }).filter(Boolean) as string[];
      const diag = diagLines.join("\n");
      const hasVerdicts = diagLines.length >= 3;
      // matrix_table n'est proposé au LLM que si un breakdown À COLONNES existe → clients sans : prompt identique.
      const hasColBk = !!breakdowns && Object.values(breakdowns).some((b) => Array.isArray((b as { columns?: unknown[] })?.columns) && (((b as { columns?: unknown[] }).columns as unknown[]).length > 0));
      const avTypes = availableTypes(a, hasVerdicts, hasColBk);

      // 1) COMPOSITION (IA) : l'IA conçoit la structure ET l'analyse, MAIS uniquement avec les types
      //    DISPONIBLES (calculés depuis la donnée) → plus de graphe vide. Riche : ≥6 graphes/page.
      // ADAPTATION AU DOSSIER (livrable doctrinal) : indicateurs de tête + blocs optionnels choisis d'après les
      // consignes et le contexte, UNIQUEMENT parmi ce qui a de la donnée ; demandes non servies notées pour l'équipe.
      let tailoring: Tailoring & { unmet?: { demande: string; raison: string }[]; source: string } = { source: "aucune" };
      if (doctrinal && (guidance || ctxText)) {
        const kw = tailorFromText(guidance, rep);
        tailoring = { ...kw, source: "mots-clés" };
        const extras = availableExtras(rep);
        try {
          const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 30_000);
          let raw: string;
          try {
            raw = (await callAnthropic({ model: MODELS.quality, max_tokens: 900, signal: ctrl.signal,
              system: `${DOCTRINE}\nTu ADAPTES un rapport mensuel à structure fixe aux demandes d'un client. Tu choisis : (1) jusqu'à 5 indicateurs de tête (ids EXACTS de la liste), les plus demandés d'abord, en gardant la marge après pub et la trésorerie si possible ; (2) les blocs optionnels utiles (ids EXACTS de la liste) ; (3) les demandes du client que les données ne permettent PAS encore de servir (demande courte + raison factuelle : donnée absente, source à brancher…). N'invente aucun id. Réponds UNIQUEMENT en JSON : {"kpis":["…"],"extras":["…"],"unmet":[{"demande":"…","raison":"…"}]}`,
              messages: [{ role: "user", content: `CONSIGNES DU CONSEILLER :\n${guidance.slice(0, 4000) || "—"}\n\nCONTEXTE DU DOSSIER :\n${ctxText || "—"}\n\nINDICATEURS DISPONIBLES (id — libellé) :\n${Object.entries(metrics).map(([id, m]) => `${id} — ${m.label}`).join("\n")}\n\nBLOCS OPTIONNELS DISPONIBLES :\n${extras.map((x) => `${x.id} — ${x.label}`).join("\n") || "aucun"}\n\nDÉJÀ PRÉSENT PAR DÉFAUT : 3 points du mois, cascade CA → CM1 → CM2 → CM3, pont d'écarts, pub vs point mort, nouveaux vs récurrents, produits, retours, pays, trésorerie à 13 semaines.` }] })).text;
          } finally { clearTimeout(timer); }
          const ia = extractJson<{ kpis?: unknown[]; extras?: unknown[]; unmet?: { demande?: unknown; raison?: unknown }[] }>(raw);
          const kpis = (ia.kpis ?? []).filter((x): x is string => typeof x === "string" && !!metrics[x]).slice(0, 5);
          const ex = (ia.extras ?? []).filter((x): x is string => typeof x === "string" && extras.some((e) => e.id === x));
          const unmet = (ia.unmet ?? []).filter((u) => typeof u?.demande === "string" && u.demande.trim())
            .slice(0, 8).map((u) => ({ demande: String(u.demande).slice(0, 200), raison: String(u.raison ?? "").slice(0, 200) }));
          tailoring = { kpis: kpis.length ? kpis : kw.kpis, extras: [...new Set([...ex, ...(kw.extras ?? [])])], unmet, source: "ia" };
        } catch (e) { console.warn("adaptation IA ignorée (repli mots-clés)", e instanceof Error ? e.message : String(e)); }
      }
      let plan: DashPlan | null = doctrinal ? buildReportPlan(rep, forcedWidgets, tailoring) : null;
      // Thème : le système « rapport » (clair, marque) s'applique à tous ; seules les icônes viennent de l'IA.
      let theme: Record<string, unknown> = {};
      const composeMsg = [{ role: "user" as const, content:
        `Activité : ${activity}. Client : ${client?.name ?? ""}. Mois : ${period} (devise ${client?.currency ?? "EUR"}).\n\n` +
        `DONNÉES DISPONIBLES (par section — id, libellé, valeur, variation) :\n${metricsText}\n\n` +
        `BREAKDOWNS : ${breakdowns && Object.keys(breakdowns).length ? Object.entries(breakdowns).map(([k, v]) => `${k} — ${v.label}`).join(" ; ") : "aucun"}.\n` +
        `CIBLES : ${Object.keys(targets).length ? Object.keys(targets).join(", ") : "aucune"}.\n\n` +
        `⛔ TYPES DE GRAPHES AUTORISÉS CE MOIS (les seuls qui afficheront des données — N'EN UTILISE AUCUN AUTRE) :\n${avTypes}\n` +
        `Les répartitions (treemap, rose, polar, pictorial, lollipop, share, ranking) acceptent une LISTE DE MÉTRIQUES (champ "metrics"), pas seulement un breakdown : sers-t'en pour faire parler les ratios (AOV, ROAS, CAC, CPA, taux…) et les postes (charges, canaux).\n\n` +
        (diag ? `\n📊 DIAGNOSTIC SECTORIEL (repères marché — APPUIE-TOI DESSUS dans les callouts, cite le repère et dis si c'est bon ou problématique) :\n${diag}\n` : "") +
        (mainBridge ? `\n🔎 PONT D'ÉCARTS (calcul exact — explique POURQUOI la marge a bougé, cite ces effets) :\n${bridgeText(bridgePrev)}${bridgeAvg ? `\nvs moyenne 3 mois : ${bridgeText(bridgeAvg)}` : ""}\n` : "") +
        (pointFacts.length ? `\n📌 LES 3 POINTS DU MOIS (déjà affichés en tête — tes callouts doivent les étayer, pas les contredire) :\n${pointFacts.map((p, i) => `${i + 1}. ${p.text}`).join("\n")}\n` : "") +
        `\nEXIGENCES : 3 à 4 pages à ANGLES DISTINCTS ; CHAQUE page = un kpi_row + AU MOINS 6 graphes qui afficheront vraiment des données + 1 callout d'analyse. EXPLOITE toute la richesse (unit economics, acquisition, conversion, LTV/fidélisation, rentabilité, trésorerie) — pas seulement CA/marge. Varie les types.\n` +
        (guidance ? `\nCONSIGNES CLIENT (prioritaires) :\n${guidance}\n` : "") +
        (forcedWidgets.length ? `\nGRAPHIQUES OBLIGATOIRES (à INCLURE impérativement, bien intégrés dans les pages) :\n${forcedWidgets.map((w) => `- ${w.type}${w.breakdown ? ` (breakdown: ${w.breakdown})` : w.metrics?.length ? ` (metrics: ${w.metrics.join(", ")})` : ""}${w.title ? ` — « ${w.title} »` : ""}`).join("\n")}\n` : "") +
        (prevTheme ? `\nTHÈME À CONSERVER : ${JSON.stringify(prevTheme)}\n` : "") +
        `\nMARQUE : ${(client as { brand?: unknown })?.brand ? JSON.stringify((client as { brand?: unknown }).brand) : "non fournie"}` }];
      if (!doctrinal) try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 80_000);
        let raw: string;
        try { raw = (await callAnthropic({ model: MODELS.quality, system: PLAN_SYSTEM(activity), messages: composeMsg, max_tokens: 5000, temperature: 0.7, signal: ctrl.signal })).text; }
        finally { clearTimeout(timer); }
        const parsed = extractJson<DashPlan>(raw);
        if (parsed && Array.isArray(parsed.pages) && parsed.pages.length) plan = parsed;
        if ((parsed?.theme as { icons?: object } | undefined)?.icons) theme = { icons: (parsed!.theme as { icons?: object }).icons };
      } catch (e) { console.warn("compose IA KO → structure déterministe:", e instanceof Error ? e.message : String(e)); }
      if (!plan) plan = buildPlan(sections, a);

      // 2) FILETS (composition libre uniquement) : widgets vides supprimés, densité garantie.
      if (!doctrinal) {
      plan = validatePlan(plan, a, sections);
      plan = ensureDensity(plan, a, sections, 3);
      // Diagnostic du mois : on le place en tête de la 1re page (après le kpi_row) s'il n'y est pas déjà.
      if (hasVerdicts && plan.pages[0] && !plan.pages.some((p) => p.widgets.some((w) => w.type === "scorecard"))) {
        const at = plan.pages[0].widgets.findIndex((w) => w.type === "kpi_row");
        plan.pages[0].widgets.splice(at >= 0 ? at + 1 : 0, 0, { type: "scorecard", title: "Diagnostic du mois" } as Widget);
      }
      // Widgets OBLIGATOIRES du client — garantis en dernier (après validate/densité/scorecard).
      plan = ensureForced(plan, forcedWidgets, a);
      }

      // LIVRABLE CENTRAL : les 3 points du mois en tête de la 1re page, puis le pont d'écarts.
      // Reformulation IA (ton de la doctrine) sous garde-fou : un point dont un chiffre change garde le fait brut.
      let points = pointFacts;
      if (pointFacts.length) {
        try {
          const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 25_000);
          let raw: string;
          try {
            raw = (await callAnthropic({ model: MODELS.fast, max_tokens: 800, signal: ctrl.signal,
              system: `${DOCTRINE}\nTu reformules les « 3 points du mois » d'un conseiller e-commerce : UNE ligne chacun (30 mots max), tutoiement, direct, concret. Tu ne changes, n'ajoutes ni n'arrondis AUCUN chiffre (recopie-les à l'identique) et tu gardes l'ordre. Tu gardes le vocabulaire (MER reste MER, jamais « ROAS » ; CM1/CM2/CM3 restent tels quels). Tu n'ajoutes AUCUNE recommandation ni conclusion absente du fait : c'est un constat, le conseiller recommandera. Réponds UNIQUEMENT en JSON : {"points":["…","…","…"]}`,
              messages: [{ role: "user", content: pointFacts.map((p, i) => `${i + 1}. ${p.text}`).join("\n") }] })).text;
          } finally { clearTimeout(timer); }
          const out = extractJson<{ points?: string[] }>(raw).points ?? [];
          points = pointFacts.map((p, i) => (typeof out[i] === "string" && out[i].trim() && numbersPreserved(p.text, out[i]) ? { ...p, text: out[i].trim() } : p));
        } catch (e) { console.warn("3 points : reformulation IA ignorée", e instanceof Error ? e.message : String(e)); }
      }
      points = points.map((p) => ({ ...p, text: dejargon(p.text)! }));
      if (doctrinal) {
        const readable = plan.pages.map((pg, i) => ({ i, title: pg.title })).filter((x) => x.title !== "Les chiffres");
        try {
          const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 60_000);
          let raw: string;
          try {
            raw = (await callAnthropic({ model: MODELS.quality, max_tokens: 1500, signal: ctrl.signal,
              system: `${DOCTRINE}\nTu écris la LECTURE de chaque page d'un rapport mensuel e-commerce (le rapport, ses graphes et « les 3 points du mois » existent déjà). Pour chaque page : 2 à 3 phrases, tutoiement, concret — le constat chiffré le plus important de la page, sa cause probable, et quoi regarder. N'invente AUCUN chiffre (uniquement ceux fournis), ne répète pas les 3 points mot pour mot. Réponds UNIQUEMENT en JSON : {"insights":[{"page":0,"text":"…","tone":"good|warn|info"}]}`,
              messages: [{ role: "user", content: `Client : ${client?.name ?? ""} — ${period}\nPAGES : ${readable.map((x) => `${x.i}. ${x.title}`).join(" · ")}\n\nCHIFFRES :\n${metricsText}\n\nPONT D'ÉCARTS : ${bridgeText(mainBridge) || "—"}\nLES 3 POINTS : ${points.map((x) => x.text).join(" | ")}${cashForecast ? `\nTRÉSORERIE 13 SEMAINES : point bas ${fmtE(cashForecast.low.balance)} le ${cashForecast.low.date}${cashForecast.below_zero ? ` (sous zéro le ${cashForecast.below_zero})` : ""}` : ""}${guidance ? `\n\nCONSIGNES DU CONSEILLER (à respecter : angles, indicateurs et vocabulaire demandés) :\n${guidance.slice(0, 4000)}` : ""}${ctxText ? `\n\nCONTEXTE DU DOSSIER (enjeux, objectifs, points de vigilance — relie tes lectures à ces enjeux) :\n${ctxText}` : ""}${cashForecast?.oneoffs?.length ? `\nSORTIES PONCTUELLES NON RECONDUITES dans la projection : ${cashForecast.oneoffs.map((o) => `${o.counterparty} ${fmtE(o.amount)}`).join(", ")}` : ""}${paymentLevers ? `
ARGENT AVANCÉ CE MOIS (fait) ET LEVIERS DE DÉCALAGE (hypothèse : +30 j de délai obtenus) : ${paymentLevers.items.map((i) => `${i.label} ${fmtE(i.monthly)} (${i.how} ; levier : ${i.lever})`).join(" ; ")} — gain total une fois ${fmtE(paymentLevers.total)}${paymentLevers.scenario ? `, point bas projeté ${fmtE(paymentLevers.scenario.low.balance)} le ${paymentLevers.scenario.low.date}` : ""}` : ""}${cashForecast?.plan ? `\nSCÉNARIO « ${cashForecast.plan.label} » : point bas ${fmtE(cashForecast.plan.low.balance)} le ${cashForecast.plan.low.date}` : ""}` }] })).text;
          } finally { clearTimeout(timer); }
          const ins = extractJson<{ insights?: { page: number; text: string; tone?: string }[] }>(raw).insights ?? [];
          for (const x of ins) {
            const pg = plan.pages[x.page]; if (!pg || !x.text?.trim() || pg.title === "Les chiffres") continue;
            pg.widgets.push({ type: "callout", title: "Lecture", text: dejargon(x.text.trim())!, tone: (["good", "warn", "info"].includes(String(x.tone)) ? x.tone : "info") as Widget["tone"] });
          }
        } catch (e) { console.warn("lectures IA ignorées", e instanceof Error ? e.message : String(e)); }
      }
      for (const p of plan.pages) {
        p.title = dejargon(p.title) ?? p.title;
        p.widgets = p.widgets.map((w) => ({ ...w, ...(w.title ? { title: dejargon(w.title) } : {}), ...(w.text ? { text: dejargon(w.text) } : {}) }));
      }
      if (plan.pages[0] && !doctrinal) {
        for (const p of plan.pages) p.widgets = p.widgets.filter((w) => w.type !== "points" && w.type !== "bridge" && w.type !== "cash_forecast");
        const w0 = plan.pages[0].widgets;
        if (mainBridge) { const at = w0.findIndex((x) => x.type === "kpi_row"); w0.splice(at >= 0 ? at + 1 : 0, 0, { type: "bridge" } as Widget); }
        if (points.length) w0.unshift({ type: "points", title: "Les 3 points du mois" } as Widget);
        // Double lecture : la trésorerie à 13 semaines va sur la page trésorerie si elle existe, sinon en 1re page.
        if (cashForecast) { const tp = plan.pages.find((p) => /tr[ée]so|cash/i.test(p.title)) ?? plan.pages[0]; const at = tp.widgets.findIndex((x) => x.type === "kpi_row"); tp.widgets.splice(at >= 0 ? at + 1 : 0, 0, { type: "cash_forecast" } as Widget); }
      }

      const html = await renderDashboardWithFx(
        { client: client?.name ?? "", period, currency: client?.currency ?? "EUR", activity, benchmarks: clientBench, brand: client?.brand as any, theme: theme as any, metrics, history, breakdowns, targets, bridge: mainBridge, points, cashForecast, paymentLevers },
        plan,
      );
      const clientData = { client: client?.name ?? "", period, currency: client?.currency ?? "EUR", activity, benchmarks: clientBench, sections, history, plan, theme, breakdowns, targets,
        points, bridge: { vs_prev: bridgePrev, vs_avg3: bridgeAvg }, cash_forecast: cashForecast, payment_levers: paymentLevers, tailoring: { kpis: tailoring.kpis, extras: tailoring.extras } };
      const saved = await insertVersion(admin, "dashboards", { client_id, period }, {
        standardized_data_id: sd.id, html, data_json: clientData, status: "draft_ia", created_by: user.id,
      });
      // Adaptation au dossier (dont les demandes NON servies) : note ÉQUIPE dans le contexte du dossier —
      // jamais dans data_json, que l'espace client peut lire.
      if (tailoring.source !== "aucune") {
        try {
          const { data: cr } = await admin.from("contexts").select("id, data").eq("client_id", client_id).eq("is_current", true).maybeSingle();
          if (cr) {
            const cd = (cr.data ?? {}) as Record<string, unknown>;
            const dt = { ...((cd.dashboard_tailoring as Record<string, unknown>) ?? {}), [period!]: { ...tailoring, at: new Date().toISOString() } };
            await admin.from("contexts").update({ data: { ...cd, dashboard_tailoring: dt } }).eq("id", cr.id);
          }
        } catch (e) { console.warn("note d'adaptation non enregistrée", e instanceof Error ? e.message : String(e)); }
      }
      await admin.from("dashboard_status_history").insert({
        dashboard_id: saved.id, from_status: null, to_status: "draft_ia", changed_by: user.id, note: doctrinal ? "Généré (rapport doctrinal, textes IA)" : "Généré (composition IA + filets anti-vide/densité)",
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
