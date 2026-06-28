-- phase25 : ajoute une page "Géographie & produits" au brief e-commerce (classements par pays + top produits).
-- Idempotent-ish : n'ajoute la page que si elle n'existe pas déjà.
update activity_types
set config = jsonb_set(config, '{dashboard,pages}',
  (config->'dashboard'->'pages') || $j$[
    { "title": "Géographie & produits", "must": ["ca"],
      "ideas": "Une CARTE (widget map) des ventes ou sessions par pays (breakdown sales_by_country ou sessions_by_country) + des classements (ranking) top produits et top pays + un callout de lecture géographique." }
  ]$j$::jsonb)
where slug='ecommerce'
  and not (config->'dashboard'->'pages' @> '[{"title":"Géographie & produits"}]'::jsonb);
