-- phase25 : ajoute une page "Géographie & produits" au brief e-commerce (classements par pays + top produits).
-- Idempotent-ish : n'ajoute la page que si elle n'existe pas déjà.
update activity_types
set config = jsonb_set(config, '{dashboard,pages}',
  (config->'dashboard'->'pages') || $j$[
    { "title": "Géographie & produits", "must": ["ca"],
      "ideas": "Classements (widget ranking) : ventes par pays (breakdown sales_by_country), sessions par pays (sessions_by_country), top produits (top_products). Mets 2-3 ranking + un callout de lecture géographique." }
  ]$j$::jsonb)
where slug='ecommerce'
  and not (config->'dashboard'->'pages' @> '[{"title":"Géographie & produits"}]'::jsonb);
