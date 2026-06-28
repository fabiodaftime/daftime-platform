-- phase24 : brief de dashboard e-commerce inspiré de Shopify Analytics
-- (Vue d'ensemble orientée commerce + entonnoir de conversion). Idempotent (remplace config.dashboard).
update activity_types set config = jsonb_set(config, '{dashboard}', $br$
{
  "pages": [
    { "title": "Vue d'ensemble", "must": ["ca", "orders", "aov", "conversion_rate", "sessions"],
      "ideas": "Style Shopify Analytics : tuiles KPIs en tête (CA, commandes, panier moyen, taux de conversion, sessions, ROAS) avec variation vs M-1 ; un grand graphe 'CA dans le temps' (line) ; un entonnoir de conversion (funnel : sessions -> ajouts panier -> commandes) ; un callout de lecture du mois." },
    { "title": "Acquisition & conversion", "must": ["sessions", "add_to_carts", "orders", "conversion_rate", "roas", "cac"],
      "ideas": "Entonnoir funnel (sessions, add_to_carts, orders) + taux de conversion ; ROAS et CAC ; dépense pub (donut Meta/Google) ; CTR/CPC/CPM ; coût par commande." },
    { "title": "CA & marges", "must": ["ca", "marge_brute", "taux_marge_brute", "aov", "refund_rate"],
      "ideas": "Tendance du CA (line), panier moyen, marge brute et taux, remboursements/retours." },
    { "title": "Charges & rentabilité", "must": ["total_opex", "ebitda", "marge_ebitda", "resultat_net"],
      "ideas": "Répartition des charges (donut : pub, logistique, paiement, salaires, autres), EBITDA, marges, résultat net." },
    { "title": "Clients & valeur", "must": ["ltv", "ltv_cac", "repeat_rate", "new_customer_share"],
      "ideas": "LTV et LTV/CAC, taux de réachat, fréquence d'achat, part nouveaux vs récurrents, payback CAC." },
    { "title": "Trésorerie & stock", "must": ["cash_end", "cash_variation", "bfr", "stock_days"],
      "ideas": "Tendance de trésorerie, variation, BFR, rotation et jours de stock, valeur du stock." }
  ],
  "guidelines": "Dashboard e-commerce INSPIRÉ de Shopify Analytics. Vue d'ensemble orientée COMMERCE en tête : tuiles KPIs (CA, commandes, panier moyen, taux de conversion, sessions, ROAS) avec variation vs M-1, un grand graphe 'CA dans le temps' (line) et un ENTONNOIR de conversion (funnel : sessions -> ajouts panier -> commandes). Ensuite les pages d'analyse. Utilise : funnel pour les étapes décroissantes ordonnées ; kpi_row avec variation pour les tuiles ; line pour les tendances ; donut pour les répartitions de charges ; table pour le détail. Synthétique, visuel, lisible. Adapte les pages aux données réellement présentes (n'inclure une page que si ses données existent)."
}
$br$::jsonb) where slug='ecommerce';
