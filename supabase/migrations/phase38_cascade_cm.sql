-- Phase 38 — Cascade de marges CM1 → CM2 → CM3 + point mort publicitaire (doctrine, section cascade).
-- Le catalogue e-commerce raisonnait en marge brute / EBITDA ; la doctrine met la cascade au cœur :
--   CM1 = CA net − coût des marchandises ;
--   CM2 = CM1 − logistique & expédition − frais de paiement (− commissions marketplaces) ; les
--         remboursements sont DÉJÀ déduits du CA net (Shopify « Net sales ») → pas de double déduction ;
--   CM3 = CM2 − dépense publicitaire totale ;
--   point mort pub = 1 / CM2 (ROAS minimum), recalculé chaque mois, jamais une norme externe.
-- CM2 n'est calculée que si la logistique est connue (sinon elle serait surestimée en silence).
-- Additif et idempotent : n'ajoute que les lignes absentes ; section « cascade » placée en tête.

do $$
declare
  base jsonb := $l$[
    {"id":"cm1","label":"CM1 — marge produit","section":"cascade","unit":"CUR","total":true,"formula":"ca - cogs","note":"CA net − coût des marchandises"},
    {"id":"cm2","label":"CM2 — marge après opérations","section":"cascade","unit":"CUR","total":true,"formula":"present(shipping_cost) ? cm1 - shipping_cost - coalesce(payment_fees, 0) : null","note":"CM1 − logistique & expédition − frais de paiement (retours déjà déduits du CA net)"},
    {"id":"cm3","label":"CM3 — marge après acquisition","section":"cascade","unit":"CUR","total":true,"formula":"cm2 - ads_total","note":"CM2 − dépense publicitaire totale"},
    {"id":"cm1_rate","label":"CM1 en % du CA","section":"cascade","unit":"%","formula":"cm1 / ca * 100"},
    {"id":"cm2_rate","label":"CM2 en % du CA","section":"cascade","unit":"%","formula":"cm2 / ca * 100"},
    {"id":"cm3_rate","label":"CM3 en % du CA","section":"cascade","unit":"%","formula":"cm3 / ca * 100"},
    {"id":"cm2_per_order","label":"CM2 par commande","section":"cascade","unit":"CUR","formula":"cm2 / orders"},
    {"id":"breakeven_roas","label":"Point mort pub (ROAS minimum = 1 / CM2)","section":"cascade","unit":"x","formula":"cm2 > 0 ? ca / cm2 : null"},
    {"id":"mer","label":"MER (CA / pub totale)","section":"cascade","unit":"x","formula":"ca / ads_total"},
    {"id":"ads_headroom","label":"Marge de sécurité pub vs point mort","section":"cascade","unit":"%","formula":"breakeven_roas > 0 ? (mer / breakeven_roas - 1) * 100 : null"}
  ]$l$::jsonb;
  mkt jsonb;
  s text;
  lines jsonb;
begin
  -- Marketplaces : les commissions font partie des coûts opérationnels (CM2).
  mkt := (select jsonb_agg(case when e->>'id' = 'cm2'
            then jsonb_set(jsonb_set(e, '{formula}', to_jsonb('present(shipping_cost) ? cm1 - shipping_cost - coalesce(payment_fees, 0) - coalesce(marketplace_fees, 0) : null'::text)),
                           '{note}', to_jsonb('CM1 − logistique − frais de paiement − commissions marketplaces'::text))
            else e end) from jsonb_array_elements(base) e);
  foreach s in array array['ecommerce', 'ecommerce_marketplace'] loop
    lines := case when s = 'ecommerce_marketplace' then mkt else base end;
    update public.activity_types a set config = jsonb_set(jsonb_set(a.config,
        '{sections}', case when exists (select 1 from jsonb_array_elements(a.config->'sections') x where x->>'key' = 'cascade')
                           then a.config->'sections'
                           else jsonb_build_array(jsonb_build_object('key', 'cascade', 'label', 'Cascade de marges')) || (a.config->'sections') end),
        '{lines}', (a.config->'lines') || coalesce((select jsonb_agg(n) from jsonb_array_elements(lines) n
                     where not exists (select 1 from jsonb_array_elements(a.config->'lines') l where l->>'id' = n->>'id')), '[]'::jsonb))
    where a.slug = s and a.config ? 'lines';
  end loop;
end $$;
