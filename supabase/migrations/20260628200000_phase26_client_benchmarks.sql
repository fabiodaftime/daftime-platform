-- Phase 26 — Repères/benchmarks PERSONNALISABLES par client.
-- Permet d'ajuster, par client, les seuils des verdicts (bon/moyen/alerte) affichés sur les KPIs
-- et utilisés dans l'analyse IA. Forme : { "<metric_id>": { good, warn, dir, ref, off } }.
alter table public.clients
  add column if not exists benchmarks jsonb not null default '{}'::jsonb;

comment on column public.clients.benchmarks is
  'Surcharges des repères sectoriels par indicateur : {"roas":{"good":2,"warn":1.5,"dir":"high","ref":"…","off":false}}. Fusionne avec les défauts du secteur.';
