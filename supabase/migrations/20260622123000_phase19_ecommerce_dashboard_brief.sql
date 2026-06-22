-- Phase 19 — Brief de dashboard e-commerce (incontournables par page) qui guide la composition
-- du plan par l'IA. Stocké dans activity_types.config.dashboard, éditable.

UPDATE public.activity_types SET config = jsonb_set(config, '{dashboard}', $br$
{
  "guidelines": "Dashboard e-commerce : visuel, synthétique, multi-pages. Mets en avant en Vue d'ensemble : chiffre d'affaires, marge brute, EBITDA, résultat net, trésorerie. Privilégie ROAS, CAC, taux de conversion, panier moyen, LTV/CAC quand disponibles. Adapte les pages aux données réellement présentes.",
  "pages": [
    { "title": "Vue d'ensemble", "must": ["ca", "marge_brute", "ebitda", "resultat_net", "cash_end"], "ideas": "KPIs clés avec évolution, tendance CA/marge/EBITDA, un callout de lecture du mois." },
    { "title": "Analyse CA & marges", "must": ["ca", "marge_brute", "taux_marge_brute", "aov"], "ideas": "Tendance du CA, panier moyen (AOV), taux de marge brute, remboursements/retours." },
    { "title": "Acquisition & conversion", "must": ["ads_total", "cac", "roas", "conversion_rate"], "ideas": "ROAS et CAC, dépense publicitaire, taux de conversion, CPM/CPC/CTR, sessions." },
    { "title": "Charges & rentabilité", "must": ["total_opex", "ebitda", "marge_ebitda"], "ideas": "Répartition des charges (donut : pub, logistique, salaires, frais), EBITDA, ratios de marge." },
    { "title": "Clients & valeur", "must": ["ltv", "ltv_cac", "repeat_rate"], "ideas": "LTV et LTV/CAC, taux de réachat, fréquence d'achat, nouveaux vs récurrents." },
    { "title": "Trésorerie & stock", "must": ["cash_end", "cash_variation", "bfr"], "ideas": "Tendance de trésorerie, variation, BFR, rotation et jours de stock." }
  ]
}
$br$::jsonb) WHERE slug = 'ecommerce';
