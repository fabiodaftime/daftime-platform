-- Phase 44 — Invitations d'accès client à durée longue (7 jours), gérées par la plateforme.
-- La durée des liens Supabase (1 h) est un réglage d'authentification du projet, PARTAGÉ avec la prod Lovable :
-- on n'y touche pas. Le lien envoyé au client porte un jeton Daftime (aléatoire, stocké haché, usage unique) ;
-- au clic, l'edge function client-invite-accept génère le lien de connexion Supabase, consommé aussitôt.
-- Additif. RLS activée sans politique : table lisible uniquement par le service (edge functions).

create table if not exists public.client_invitations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  email text not null,
  token_hash text not null unique,          -- SHA-256 hex du jeton ; le jeton lui-même n'est jamais stocké
  created_by uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz
);
create index if not exists client_invitations_client_email on public.client_invitations (client_id, email);
alter table public.client_invitations enable row level security;
