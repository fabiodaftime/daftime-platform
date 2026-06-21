-- Phase 18 — Documents recommandés à fournir, par activité (rangés dans activity_types.config.documents,
-- éditables depuis l'éditeur de catalogue, affichés dans l'espace client).

UPDATE public.activity_types SET config = jsonb_set(coalesce(config, '{}'::jsonb), '{documents}', $doc$
["Relevé bancaire du mois", "Export des ventes (Shopify, Stripe…)", "Factures fournisseurs", "Justificatifs de dépenses (pub, logistique…)", "Rapport publicitaire (Meta, Google…)", "État du stock"]
$doc$::jsonb) WHERE slug = 'ecommerce';

UPDATE public.activity_types SET config = jsonb_set(coalesce(config, '{}'::jsonb), '{documents}', $doc$
["Relevé bancaire du mois", "État des honoraires / commissions encaissés", "Liste des transactions du mois", "Mandats signés", "Relevé des rétrocessions agents", "Factures de charges (marketing, loyer…)"]
$doc$::jsonb) WHERE slug = 'immo_agence';

UPDATE public.activity_types SET config = jsonb_set(coalesce(config, '{}'::jsonb), '{documents}', $doc$
["Relevé bancaire du mois", "Factures émises (honoraires)", "Suivi du temps / jours facturés", "Factures de sous-traitance", "Justificatifs de dépenses"]
$doc$::jsonb) WHERE slug = 'services';

UPDATE public.activity_types SET config = jsonb_set(coalesce(config, '{}'::jsonb), '{documents}', $doc$
["Relevé bancaire du mois", "Z de caisse / export TPE", "Factures fournisseurs (matières)", "Journal de paie", "Factures de charges (loyer, énergie)", "État des nuitées (si hôtellerie)"]
$doc$::jsonb) WHERE slug = 'restaurant';

UPDATE public.activity_types SET config = jsonb_set(coalesce(config, '{}'::jsonb), '{documents}', $doc$
["Relevé bancaire du mois", "Factures émises", "Liste des sessions & participants", "Factures des intervenants", "Justificatifs de dépenses"]
$doc$::jsonb) WHERE slug = 'coach';

UPDATE public.activity_types SET config = jsonb_set(coalesce(config, '{}'::jsonb), '{documents}', $doc$
["Relevés bancaires (holding & filiales)", "Tableaux de remontées des filiales (dividendes)", "Conventions / management fees", "Tableau de la dette (échéancier)", "États financiers des filiales"]
$doc$::jsonb) WHERE slug = 'holding';

UPDATE public.activity_types SET config = jsonb_set(coalesce(config, '{}'::jsonb), '{documents}', $doc$
["Relevé bancaire du mois", "Export MRR / abonnements (Stripe, billing…)", "Factures d'infrastructure (hosting)", "Factures Sales & Marketing", "Rapport clients / churn"]
$doc$::jsonb) WHERE slug = 'saas';

UPDATE public.activity_types SET config = jsonb_set(coalesce(config, '{}'::jsonb), '{documents}', $doc$
["Relevé bancaire du mois", "Suivi de trésorerie / burn", "Export des revenus (si applicable)", "Tableau des effectifs & dépenses", "Métriques produit (utilisateurs, MRR)"]
$doc$::jsonb) WHERE slug = 'startup';

UPDATE public.activity_types SET config = jsonb_set(coalesce(config, '{}'::jsonb), '{documents}', $doc$
["Relevé bancaire du mois", "Factures émises (honoraires + média)", "Relevé des achats média", "Factures freelances / sous-traitance", "Suivi du temps / projets"]
$doc$::jsonb) WHERE slug = 'agence_media';
