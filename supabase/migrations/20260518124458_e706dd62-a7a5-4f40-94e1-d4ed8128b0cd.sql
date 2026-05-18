create table if not exists public.labarile_monthly_pl (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  month int not null check (month between 1 and 12),
  revenue numeric not null default 0,
  coaches numeric not null default 0,
  marketing numeric not null default 0,
  it numeric not null default 0,
  stripe numeric not null default 0,
  admin numeric not null default 0,
  autres numeric not null default 0,
  note text,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (year, month)
);

alter table public.labarile_monthly_pl enable row level security;

create policy "Authenticated read labarile_monthly_pl"
  on public.labarile_monthly_pl for select
  to authenticated using (true);

create policy "Super admins manage labarile_monthly_pl"
  on public.labarile_monthly_pl for all
  to authenticated
  using (is_super_admin(auth.uid()))
  with check (is_super_admin(auth.uid()));

create trigger trg_labarile_monthly_pl_updated_at
  before update on public.labarile_monthly_pl
  for each row execute function public.update_updated_at_column();