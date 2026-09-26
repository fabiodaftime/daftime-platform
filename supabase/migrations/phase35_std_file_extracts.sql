-- Phase 35 — Cache des extractions par fichier (standardisation INCRÉMENTALE).
-- Chaque fichier n'est lu/parsé qu'une fois par mois cible et par version du moteur : la
-- standardisation traite les fichiers par lots (budget CPU de l'edge runtime ~2 s) et reprend là où
-- elle s'est arrêtée ; une re-standardisation ne re-parse que les fichiers nouveaux ou modifiés.
-- Additive (préfixe std_ : backend partagé avec la prod Lovable). Écriture réservée aux edge functions
-- (service role) ; lecture staff pour le diagnostic.

create table if not exists public.std_file_extracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  file_id uuid not null references public.files(id) on delete cascade,
  period date not null,                 -- mois cible de l'extraction (YYYY-MM-01)
  fingerprint text not null,            -- updated_at du fichier + version moteur + hash du contexte (règles, soldes)
  status text not null check (status in ('parsed', 'llm', 'skipped')),
  extract jsonb,                        -- ParsedExtract si status = 'parsed'
  reason text,                          -- motif si 'skipped' / 'llm'
  created_at timestamptz not null default now(),
  unique (file_id, period, fingerprint)
);

create index if not exists std_file_extracts_client_period_idx on public.std_file_extracts (client_id, period);

alter table public.std_file_extracts enable row level security;

drop policy if exists "std_file_extracts: read staff" on public.std_file_extracts;
create policy "std_file_extracts: read staff" on public.std_file_extracts
  for select to authenticated using (public.is_staff(auth.uid()));
