-- Phase 43 — Cohortes et marge à 60 jours (doctrine §4.3–4.5). Entrées posées par le moteur (commandes du 3PL,
-- dernière cohorte dont la fenêtre de 60 jours est complète, échanges de taille exclus) ; valeur client EN MARGE.
-- Additif et idempotent (catalogues e-commerce et marketplace).

do $$
declare
  add jsonb := $l$[
    {"id":"repeat_60d","label":"Réachat à 60 jours (dernière cohorte complète)","section":"cascade","unit":"%","note":"Part des nouveaux clients qui recommandent sous 60 jours, hors échanges de taille"},
    {"id":"orders_60d","label":"Commandes par client sur 60 jours","section":"cascade","unit":""},
    {"id":"margin_60d","label":"Marge par client sur 60 jours (CM2)","section":"cascade","unit":"CUR","formula":"orders_60d * cm2_per_order","note":"Valeur client en marge, jamais en CA"},
    {"id":"margin_60d_cac","label":"Marge 60 jours ÷ CAC nouveau client","section":"cascade","unit":"x","formula":"cac > 0 ? margin_60d / cac : null","note":"≥ 1 : l'acquisition se rembourse en 60 jours"}
  ]$l$::jsonb;
  s text;
begin
  foreach s in array array['ecommerce', 'ecommerce_marketplace'] loop
    update public.activity_types a set config = jsonb_set(a.config, '{lines}', (a.config->'lines') || coalesce((select jsonb_agg(n) from jsonb_array_elements(add) n
      where not exists (select 1 from jsonb_array_elements(a.config->'lines') l where l->>'id' = n->>'id')), '[]'::jsonb))
    where a.slug = s and a.config ? 'lines';
  end loop;
end $$;
