-- Phase 37 — Reconnaissance des fichiers au DÉPÔT (calculée dans le navigateur, module pur detectSource).
-- detected = { recognized, parser, role, family, label, from, to } : source reconnue, famille de données
-- (ventes, coût des ventes, logistique, banque, pub…) et période couverte → grille de couverture des sources.
-- Additive (table plateforme `files`, absente du front Lovable).
alter table public.files add column if not exists detected jsonb;
comment on column public.files.detected is 'Reconnaissance au dépôt : source, famille, période couverte (from/to ISO). NULL = pas encore analysé.';
