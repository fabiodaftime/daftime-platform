-- Phase 39 — REGISTRE DE FAITS (chantier B, étape 1 : double écriture).
-- Un mois devient une LECTURE du registre au lieu d'une relecture de tous les fichiers.
--  - std_facts : un poste d'une source pour un mois, dédoublonné à l'écriture (source, document, poste, mois) ;
--  - src_bank_transactions : transactions bancaires BRUTES, même table pour fichier Pennylane, API Pennylane
--    et agrégateur bancaire ; classées à la lecture (une règle reclasse tout l'historique).
-- Additif (préfixes std_ / src_ : backend partagé avec la prod Lovable). Écriture par les edge functions
-- (service role) ; lecture staff (faits) / accès client (transactions, comme src_orders).

create table if not exists public.std_facts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  period date not null,                  -- mois (YYYY-MM-01)
  concept text not null,                 -- id du catalogue (ca, cogs, shipping_cost, ads_total…)
  amount numeric not null,               -- devise de reporting du client
  source text not null,                  -- parser / connecteur
  source_doc text not null,              -- document logique (rapport, n° de facture, fichier)
  role text,
  exclusive boolean not null default false,
  priority integer not null default 0,
  basis text not null default 'engagement' check (basis in ('engagement', 'tresorerie')),
  file_id uuid references public.files(id) on delete set null,
  engine text,
  dedup_key text not null unique,
  written_at timestamptz not null default now()
);
create index if not exists std_facts_client_period_idx on public.std_facts (client_id, period);

create table if not exists public.src_bank_transactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  source text not null,                  -- 'pennylane_file' | 'pennylane_api' | 'aggregator'
  account text not null,
  tx_date date not null,
  amount numeric not null,               -- signé, devise d'origine
  currency text,
  label text,
  counterparty text,
  file_id uuid references public.files(id) on delete set null,
  dedup_key text not null unique,
  synced_at timestamptz not null default now()
);
create index if not exists src_bank_tx_client_date_idx on public.src_bank_transactions (client_id, tx_date);

alter table public.std_facts enable row level security;
alter table public.src_bank_transactions enable row level security;

drop policy if exists "std_facts: read staff" on public.std_facts;
create policy "std_facts: read staff" on public.std_facts
  for select to authenticated using (public.is_staff(auth.uid()));

drop policy if exists "src_bank_transactions: read by access" on public.src_bank_transactions;
create policy "src_bank_transactions: read by access" on public.src_bank_transactions
  for select to authenticated using (public.has_client_access(auth.uid(), client_id));
