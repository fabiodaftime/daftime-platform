-- Phase 31 — Onboarding shop : paramètres + coûts HORS-EXPORT.
-- C'est ce qui débloque la doctrine (cascade CM1→CM2→CM3, breakevens, 13 semaines).
-- Additif sur la table plateforme `clients` (aucun impact Lovable).
alter table public.clients
  add column if not exists shop_profile jsonb not null default '{}'::jsonb,
  add column if not exists cost_params  jsonb not null default '{}'::jsonb;

comment on column public.clients.shop_profile is
  'Profil shop : {model: dropshipping|dtc_brand|large_catalog, repeat_model: one_shot|repeat, founder_profile, north_star} — conditionne les benchmarks et le cadre d''analyse doctrine.';
comment on column public.clients.cost_params is
  'Coûts hors-export : {sku_costs[{sku,product_cost,packaging,inbound_transport,duties}], fulfillment{shipping_cost_model,pick_pack_per_order,threepl_grid}, acquisition_overheads{agency_fees,creative,attribution_tools,influence}, supplier_terms{dpo_days,deposit_schedule}, vat{regime,rate,due_dates}, inventory{source,reorder_lead_days}} — alimentent la cascade.';
