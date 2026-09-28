-- Phase 42 — Test de base de l'acquisition (doctrine §4.2) : CM2 par commande ÷ CAC nouveau client.
--   > 1 : rentable dès la 1re commande ; 0,7–1 : perte à la 1re commande, récupérable seulement avec un réachat
--   prouvé (cohortes) + payback court ; < 0,7 : stop, réparer l'économie unitaire d'abord.
-- Additif et idempotent : n'ajoute la ligne que si elle est absente (catalogues e-commerce et marketplace).

do $$
declare
  line jsonb := $l${"id":"first_order_ratio","label":"Rentable à la 1re commande ? (CM2 par commande ÷ CAC nouveau client)","section":"cascade","unit":"x","formula":"cac > 0 ? cm2_per_order / cac : null","note":"> 1 : rentable dès la 1re commande · 0,7–1 : seulement avec réachat prouvé · < 0,7 : stop"}$l$::jsonb;
  s text;
begin
  foreach s in array array['ecommerce', 'ecommerce_marketplace'] loop
    update public.activity_types a set config = jsonb_set(a.config, '{lines}', (a.config->'lines') || jsonb_build_array(line))
    where a.slug = s and a.config ? 'lines'
      and not exists (select 1 from jsonb_array_elements(a.config->'lines') l where l->>'id' = 'first_order_ratio');
  end loop;
end $$;
