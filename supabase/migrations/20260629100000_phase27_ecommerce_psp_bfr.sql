-- Phase 27 — E-commerce : KPIs PSP (frais/payout/solde) + BFR en jours.
-- Le catalogue a déjà payment_fees, inventory_value/receivables/payables, bfr, stock_days/rotation.
-- On ajoute : section "Encaissements & PSP" + psp_payout, psp_balance (inputs extraits),
-- psp_fee_rate et bfr_days (dérivés). Idempotent (réexécutable).
update activity_types
set config = jsonb_set(
  jsonb_set(
    config,
    '{sections}',
    case when exists (select 1 from jsonb_array_elements(config->'sections') s where s->>'key' = 'psp')
      then config->'sections'
      else (config->'sections') || '[{"key":"psp","label":"Encaissements & PSP"}]'::jsonb
    end
  ),
  '{lines}',
  (
    select coalesce(jsonb_agg(l), '[]'::jsonb)
    from jsonb_array_elements(config->'lines') l
    where l->>'id' not in ('psp_payout','psp_balance','psp_fee_rate','bfr_days')
  )
  || jsonb_build_array(
    jsonb_build_object('id','psp_payout','label','Versements PSP → banque','section','psp','unit','CUR',
      'hint','Total des payouts du processeur (Stripe/Whop/PayPal) virés vers la banque sur le mois (net). MOUVEMENT INTERNE — ce n''est PAS le CA.'),
    jsonb_build_object('id','psp_balance','label','Solde PSP (fin de mois)','section','psp','unit','CUR',
      'hint','Argent détenu par le processeur en fin de mois (disponible + en attente / in transit), pas encore versé.'),
    jsonb_build_object('id','psp_fee_rate','label','Taux de frais PSP','section','psp','unit','%',
      'formula','payment_fees / ca * 100'),
    jsonb_build_object('id','bfr_days','label','BFR en jours de CA','section','cash','unit','j',
      'formula','present(bfr) ? bfr / ca * 30 : null')
  )
)
where slug = 'ecommerce';
