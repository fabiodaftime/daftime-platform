-- Phase 33 — Vue quotidienne : table daily_metrics (agrégats jour × canal). ADDITIF & platform-only.
-- RLS calquée sur les autres tables client : lecture si has_client_access, gestion staff ;
-- écritures réelles via service_role (seed démo / futur daily-snapshot).
create table if not exists public.daily_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  day date not null,
  channel text not null default 'all',       -- 'all' | 'site' | 'amazon' | …
  ca numeric, orders integer, units integer,
  refunds numeric, commissions numeric,
  cogs_estime numeric, marge_estimee numeric,
  source text not null default 'connector',  -- 'connector' | 'manual' | 'demo'
  computed_at timestamptz not null default now(),
  unique (client_id, day, channel)
);
create index if not exists idx_daily_metrics_client_day on public.daily_metrics (client_id, day desc);

alter table public.daily_metrics enable row level security;
grant select, insert, update, delete on public.daily_metrics to authenticated;
grant all on public.daily_metrics to service_role;

create policy "daily_metrics selectable by access" on public.daily_metrics
  for select to authenticated using (public.has_client_access(auth.uid(), client_id));
create policy "daily_metrics managed by staff" on public.daily_metrics
  for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
