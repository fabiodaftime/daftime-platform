-- Phase 30 — Graphiques obligatoires par client.
-- Liste de widgets à TOUJOURS inclure dans le dashboard généré (survit aux régénérations).
-- Additif sur la table plateforme `clients` (aucun impact Lovable).
alter table public.clients
  add column if not exists forced_widgets jsonb not null default '[]'::jsonb;

comment on column public.clients.forced_widgets is
  'Widgets a toujours inclure dans le dashboard genere : liste de {type, title?, breakdown?, metrics?}.';
