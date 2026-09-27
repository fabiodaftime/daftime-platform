-- Phase 40 — App Shopify PUBLIQUE : installation depuis Shopify + conformité RGPD.
--  - src_pending_connections : boutique installée depuis Shopify (lien d'installation / fiche d'app) mais
--    pas encore rattachée à un dossier → le staff la rattache depuis le cockpit (→ src_connections).
--  - std_compliance_log : journal des webhooks de conformité Shopify (demande de données, effacement
--    client, effacement boutique) et de l'action menée — preuve de traitement sous 30 jours.
-- Additif (préfixes src_ / std_ : backend partagé avec la prod Lovable).

create table if not exists public.src_pending_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  shop text,
  nango_connection_id text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.std_compliance_log (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  shop text,
  payload jsonb,            -- identifiants seulement (ids client/commandes), jamais de coordonnées
  action text,
  received_at timestamptz not null default now()
);

alter table public.src_pending_connections enable row level security;
alter table public.std_compliance_log enable row level security;

drop policy if exists "src_pending_connections: staff" on public.src_pending_connections;
create policy "src_pending_connections: staff" on public.src_pending_connections
  for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

drop policy if exists "std_compliance_log: read staff" on public.std_compliance_log;
create policy "std_compliance_log: read staff" on public.std_compliance_log
  for select to authenticated using (public.is_staff(auth.uid()));
