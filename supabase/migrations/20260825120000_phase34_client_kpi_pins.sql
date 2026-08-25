-- Phase 34 — Ratios épinglés par le conseiller (3-6 métriques clés à suivre). ADDITIF & platform-only.
create table if not exists public.client_kpi_pins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  metric_id text not null,               -- id d'une ligne du catalogue de l'activity_type
  target numeric,                        -- objectif fixé avec le client
  direction text not null default 'up',  -- 'up' | 'down' — sens de l'amélioration
  comment text,                          -- pourquoi ce ratio compte pour CE client
  display_order integer not null default 0,
  pinned_by uuid, pinned_at timestamptz not null default now(),
  unique (client_id, metric_id)
);
create index if not exists idx_client_kpi_pins_client on public.client_kpi_pins (client_id, display_order);

alter table public.client_kpi_pins enable row level security;
grant select, insert, update, delete on public.client_kpi_pins to authenticated;
grant all on public.client_kpi_pins to service_role;

create policy "client_kpi_pins selectable by access" on public.client_kpi_pins
  for select to authenticated using (public.has_client_access(auth.uid(), client_id));
create policy "client_kpi_pins managed by staff" on public.client_kpi_pins
  for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
