-- Phase 41 — Cartographie des flux par dossier (organigramme, comptes, entrées/sorties, délais, interco).
-- ADDITIF & platform-only. Une ligne « draft » (équipe) et une ligne « published » (lisible par le client) :
-- le filtrage est par LIGNE (RLS), donc le brouillon n'est jamais exposé au client.
create table if not exists public.client_flow_maps (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  status text not null check (status in ('draft', 'published')),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  unique (client_id, status)
);
create index if not exists idx_client_flow_maps_client on public.client_flow_maps (client_id);

alter table public.client_flow_maps enable row level security;
grant select, insert, update, delete on public.client_flow_maps to authenticated;
grant all on public.client_flow_maps to service_role;

drop policy if exists "client_flow_maps published readable by access" on public.client_flow_maps;
create policy "client_flow_maps published readable by access" on public.client_flow_maps
  for select to authenticated using (status = 'published' and public.has_client_access(auth.uid(), client_id));
drop policy if exists "client_flow_maps managed by staff" on public.client_flow_maps;
create policy "client_flow_maps managed by staff" on public.client_flow_maps
  for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
