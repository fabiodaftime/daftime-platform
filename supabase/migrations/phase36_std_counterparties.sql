-- Phase 36 — Dictionnaire GLOBAL des contreparties bancaires (partagé entre dossiers).
-- Alimenté par la qualification IA (confiance ≥ 90 % ET acteur « universel » : même nature chez tous
-- les clients, ex. Qonto → frais bancaires) et par le staff. Jamais une personne, un fournisseur de stock
-- ni un intermédiaire de paiement (PayPal, Stripe…) : ceux-là restent des règles PAR DOSSIER (contexte).
-- Priorité de classement : règles du dossier > dictionnaire global > classement intégré du moteur.
-- Additive (préfixe std_ : backend partagé avec la prod Lovable). Écriture via edge functions (service role).

create table if not exists public.std_counterparties (
  id uuid primary key default gen_random_uuid(),
  match text not null unique,           -- fragment distinctif du libellé bancaire, minuscules
  category text not null check (category in ('ads','stock','internal','loan','payroll','tools','logistics','tax','vat','bankfees','other','ignore')),
  label text,
  source text not null default 'ai' check (source in ('ai','staff')),
  confidence numeric,
  hits integer not null default 1,      -- nombre de dossiers où la contrepartie a été rencontrée
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.std_counterparties enable row level security;

drop policy if exists "std_counterparties: read staff" on public.std_counterparties;
create policy "std_counterparties: read staff" on public.std_counterparties
  for select to authenticated using (public.is_staff(auth.uid()));
