-- Phase 28 — E-commerce : trésorerie nette + variation de stock (impact résultat).
-- tresorerie_nette = cash + créances − dettes (seulement si données de bilan présentes).
-- stock_variation = stock fin − début sur le mois : un stock qui MONTE améliore le résultat. Idempotent.
update activity_types
set config = jsonb_set(
  config,
  '{lines}',
  (
    select coalesce(jsonb_agg(l), '[]'::jsonb)
    from jsonb_array_elements(config->'lines') l
    where l->>'id' not in ('tresorerie_nette','stock_variation')
  )
  || jsonb_build_array(
    jsonb_build_object('id','stock_variation','label','Variation de stock','section','pnl','unit','CUR',
      'hint','Stock fin − stock début sur le mois. Un stock qui MONTE améliore le résultat comptable (coût des ventes plus bas) ; un stock qui BAISSE le dégrade. Sert à expliquer un écart résultat/trésorerie.'),
    jsonb_build_object('id','tresorerie_nette','label','Trésorerie nette','section','cash','unit','CUR',
      'formula','(present(receivables) || present(payables)) ? cash_end + coalesce(receivables, 0) - coalesce(payables, 0) : null')
  )
)
where slug = 'ecommerce';
