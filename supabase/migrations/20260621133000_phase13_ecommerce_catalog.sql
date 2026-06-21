-- Phase 13 — Catalogue d'indicateurs e-commerce déplacé en base (activity_types.config),
-- éditable depuis la plateforme. Formules en texte évaluées par le moteur (_shared/expr.ts).

UPDATE public.activity_types SET config = $cat$
{
  "slug": "ecommerce",
  "sections": [
    { "key": "pnl", "label": "Compte de résultat" },
    { "key": "rentabilite", "label": "Marges & rentabilité" },
    { "key": "orders", "label": "Commandes & retours" },
    { "key": "marketing", "label": "Acquisition & publicité" },
    { "key": "traffic", "label": "Trafic & conversion" },
    { "key": "customers", "label": "Clients & valeur (LTV)" },
    { "key": "cash", "label": "Trésorerie & stock" }
  ],
  "lines": [
    { "id": "ca", "label": "Chiffre d'affaires net", "section": "pnl", "unit": "CUR", "core": true, "hint": "Ventes nettes du mois (hors taxes, après remboursements)" },
    { "id": "cogs", "label": "Coût des marchandises vendues (COGS)", "section": "pnl", "unit": "CUR", "core": true, "hint": "Coût d'achat des produits vendus" },
    { "id": "marge_brute", "label": "Marge brute", "section": "pnl", "unit": "CUR", "total": true, "note": "CA − COGS", "formula": "ca - cogs" },
    { "id": "shipping_cost", "label": "Logistique & expédition", "section": "pnl", "unit": "CUR", "hint": "Préparation, transport, retours" },
    { "id": "payment_fees", "label": "Frais de paiement", "section": "pnl", "unit": "CUR", "hint": "Commissions Stripe/PayPal/CB" },
    { "id": "platform_fees", "label": "Frais de plateforme", "section": "pnl", "unit": "CUR", "hint": "Abonnements Shopify/outils" },
    { "id": "ads_total", "label": "Dépense publicitaire totale", "section": "pnl", "unit": "CUR", "core": true, "hint": "Total média tous canaux" },
    { "id": "payroll", "label": "Salaires & charges", "section": "pnl", "unit": "CUR", "hint": "Masse salariale chargée" },
    { "id": "other_opex", "label": "Autres charges d'exploitation", "section": "pnl", "unit": "CUR", "hint": "Honoraires, outils, divers" },
    { "id": "total_opex", "label": "Total charges d'exploitation", "section": "pnl", "unit": "CUR", "total": true, "note": "Somme des charges présentes", "formula": "sum(ads_total, platform_fees, shipping_cost, payment_fees, payroll, other_opex)" },
    { "id": "ebitda", "label": "EBITDA", "section": "pnl", "unit": "CUR", "total": true, "note": "Marge brute − total charges", "formula": "marge_brute - total_opex" },
    { "id": "da", "label": "Amortissements & dépréciations", "section": "pnl", "unit": "CUR", "hint": "Si disponible" },
    { "id": "resultat_exploitation", "label": "Résultat d'exploitation", "section": "pnl", "unit": "CUR", "total": true, "note": "EBITDA − amortissements", "formula": "ebitda - da" },
    { "id": "financial_result", "label": "Résultat financier", "section": "pnl", "unit": "CUR", "hint": "Intérêts, change (si dispo)" },
    { "id": "taxes", "label": "Impôts sur le résultat", "section": "pnl", "unit": "CUR", "hint": "Si disponible" },
    { "id": "resultat_net", "label": "Résultat net", "section": "pnl", "unit": "CUR", "total": true, "note": "Rés. exploitation (ou EBITDA) + financier − impôts, si données disponibles", "formula": "(present(da) || present(financial_result) || present(taxes)) ? (coalesce(resultat_exploitation, ebitda) + coalesce(financial_result, 0) - coalesce(taxes, 0)) : null" },

    { "id": "taux_marge_brute", "label": "Taux de marge brute", "section": "rentabilite", "unit": "%", "note": "Marge brute ÷ CA", "formula": "marge_brute / ca * 100" },
    { "id": "marge_ebitda", "label": "Marge d'EBITDA", "section": "rentabilite", "unit": "%", "note": "EBITDA ÷ CA", "formula": "ebitda / ca * 100" },
    { "id": "marge_nette", "label": "Marge nette", "section": "rentabilite", "unit": "%", "note": "Résultat net ÷ CA", "formula": "resultat_net / ca * 100" },

    { "id": "gross_sales", "label": "CA brut (avant remboursements)", "section": "orders", "unit": "CUR", "hint": "Ventes brutes" },
    { "id": "refunds", "label": "Remboursements & retours", "section": "orders", "unit": "CUR", "hint": "Montant remboursé" },
    { "id": "refund_rate", "label": "Taux de remboursement", "section": "orders", "unit": "%", "note": "Remboursements ÷ CA brut", "formula": "refunds / gross_sales * 100" },
    { "id": "orders", "label": "Nombre de commandes", "section": "orders", "unit": "", "core": true, "hint": "Commandes livrées" },
    { "id": "units", "label": "Articles vendus", "section": "orders", "unit": "", "hint": "Unités vendues" },
    { "id": "aov", "label": "Panier moyen (AOV)", "section": "orders", "unit": "CUR", "note": "CA ÷ commandes", "formula": "ca / orders" },
    { "id": "units_per_order", "label": "Articles par commande", "section": "orders", "unit": "", "note": "Articles ÷ commandes", "formula": "units / orders" },

    { "id": "ads_meta", "label": "Dépense pub Meta", "section": "marketing", "unit": "CUR", "hint": "Si détaillé" },
    { "id": "ads_google", "label": "Dépense pub Google", "section": "marketing", "unit": "CUR", "hint": "Si détaillé" },
    { "id": "new_customers", "label": "Nouveaux clients", "section": "marketing", "unit": "", "hint": "1re commande" },
    { "id": "cac", "label": "Coût d'acquisition (CAC)", "section": "marketing", "unit": "CUR", "note": "Pub ÷ nouveaux clients", "formula": "ads_total / new_customers" },
    { "id": "roas", "label": "ROAS (blended)", "section": "marketing", "unit": "x", "note": "CA ÷ dépense pub", "formula": "ca / ads_total" },
    { "id": "cpa_order", "label": "Coût par commande", "section": "marketing", "unit": "CUR", "note": "Pub ÷ commandes", "formula": "ads_total / orders" },
    { "id": "impressions", "label": "Impressions pub", "section": "marketing", "unit": "", "hint": "Si dispo" },
    { "id": "clicks", "label": "Clics pub", "section": "marketing", "unit": "", "hint": "Si dispo" },
    { "id": "cpm", "label": "CPM", "section": "marketing", "unit": "CUR", "note": "Pub ÷ impressions × 1000", "formula": "ads_total / impressions * 1000" },
    { "id": "cpc", "label": "CPC", "section": "marketing", "unit": "CUR", "note": "Pub ÷ clics", "formula": "ads_total / clicks" },
    { "id": "ctr", "label": "CTR", "section": "marketing", "unit": "%", "note": "Clics ÷ impressions", "formula": "clicks / impressions * 100" },

    { "id": "sessions", "label": "Sessions / visites", "section": "traffic", "unit": "", "hint": "Visites du site (analytics)" },
    { "id": "add_to_carts", "label": "Ajouts au panier", "section": "traffic", "unit": "", "hint": "Si dispo" },
    { "id": "conversion_rate", "label": "Taux de conversion", "section": "traffic", "unit": "%", "note": "Commandes ÷ sessions", "formula": "orders / sessions * 100" },
    { "id": "add_to_cart_rate", "label": "Taux d'ajout au panier", "section": "traffic", "unit": "%", "note": "Ajouts ÷ sessions", "formula": "add_to_carts / sessions * 100" },

    { "id": "returning_customers", "label": "Clients récurrents", "section": "customers", "unit": "", "hint": "Déjà clients" },
    { "id": "total_customers", "label": "Clients actifs", "section": "customers", "unit": "", "hint": "Ayant commandé ce mois" },
    { "id": "avg_lifespan_months", "label": "Durée de vie client (mois)", "section": "customers", "unit": "", "hint": "Estimation si connue" },
    { "id": "new_customer_share", "label": "Part de nouveaux clients", "section": "customers", "unit": "%", "note": "Nouveaux ÷ actifs", "formula": "new_customers / total_customers * 100" },
    { "id": "repeat_rate", "label": "Taux de réachat", "section": "customers", "unit": "%", "note": "Récurrents ÷ actifs", "formula": "returning_customers / total_customers * 100" },
    { "id": "purchase_frequency", "label": "Fréquence d'achat", "section": "customers", "unit": "", "note": "Commandes ÷ clients actifs", "formula": "orders / total_customers" },
    { "id": "ltv", "label": "LTV (valeur vie client)", "section": "customers", "unit": "CUR", "note": "AOV × marge brute % × fréquence × durée de vie", "formula": "aov * (taux_marge_brute / 100) * purchase_frequency * avg_lifespan_months" },
    { "id": "ltv_cac", "label": "LTV / CAC", "section": "customers", "unit": "x", "note": "LTV ÷ CAC", "formula": "ltv / cac" },
    { "id": "payback_cac", "label": "Payback CAC (mois)", "section": "customers", "unit": "", "note": "CAC ÷ (marge brute ÷ clients actifs)", "formula": "cac / (marge_brute / total_customers)" },

    { "id": "cash_start", "label": "Trésorerie début de mois", "section": "cash", "unit": "CUR", "hint": "Solde au 1er" },
    { "id": "cash_end", "label": "Trésorerie fin de mois", "section": "cash", "unit": "CUR", "core": true, "hint": "Solde en fin de mois" },
    { "id": "cash_variation", "label": "Variation de trésorerie", "section": "cash", "unit": "CUR", "total": true, "note": "Fin − début", "formula": "cash_end - cash_start" },
    { "id": "inventory_value", "label": "Valeur du stock", "section": "cash", "unit": "CUR", "hint": "Stock valorisé" },
    { "id": "receivables", "label": "Créances clients", "section": "cash", "unit": "CUR", "hint": "Si dispo" },
    { "id": "payables", "label": "Dettes fournisseurs", "section": "cash", "unit": "CUR", "hint": "Si dispo" },
    { "id": "bfr", "label": "BFR", "section": "cash", "unit": "CUR", "note": "Créances + stock − dettes", "formula": "(present(receivables) || present(inventory_value) || present(payables)) ? (coalesce(receivables, 0) + coalesce(inventory_value, 0) - coalesce(payables, 0)) : null" },
    { "id": "stock_days", "label": "Jours de stock", "section": "cash", "unit": "j", "note": "Stock ÷ COGS × 30", "formula": "inventory_value / cogs * 30" },
    { "id": "stock_rotation", "label": "Rotation du stock", "section": "cash", "unit": "x", "note": "COGS ÷ stock", "formula": "cogs / inventory_value" }
  ],
  "checks": [
    { "id": "ca_present", "label": "Le chiffre d'affaires est manquant ou nul.", "severity": "error", "expr": "present(ca) && ca > 0" },
    { "id": "cogs_le_ca", "label": "Le COGS dépasse le chiffre d'affaires — à vérifier.", "severity": "warn", "expr": "!present(cogs) || !present(ca) || cogs <= ca" },
    { "id": "opex_positive", "label": "Une charge est négative — à vérifier.", "severity": "warn", "expr": "(!present(cogs) || cogs >= 0) && (!present(shipping_cost) || shipping_cost >= 0) && (!present(payment_fees) || payment_fees >= 0) && (!present(platform_fees) || platform_fees >= 0) && (!present(ads_total) || ads_total >= 0) && (!present(payroll) || payroll >= 0) && (!present(other_opex) || other_opex >= 0)" },
    { "id": "ebitda_plausible", "label": "Marge d'EBITDA hors plage plausible (±100% du CA).", "severity": "warn", "expr": "!present(ebitda) || !present(ca) || ca == 0 || abs(ebitda / ca) <= 1" },
    { "id": "conversion_max", "label": "Taux de conversion > 100% — incohérent.", "severity": "warn", "expr": "!present(conversion_rate) || conversion_rate <= 100" },
    { "id": "refund_max", "label": "Taux de remboursement > 100% — incohérent.", "severity": "warn", "expr": "!present(refund_rate) || refund_rate <= 100" },
    { "id": "orders_le_sessions", "label": "Plus de commandes que de sessions — à vérifier.", "severity": "warn", "expr": "!present(orders) || !present(sessions) || orders <= sessions" }
  ]
}
$cat$::jsonb
WHERE slug = 'ecommerce';
