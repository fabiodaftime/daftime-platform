-- Phase 1 — Enums du modele generique + nouvelles valeurs de roles (additif, non destructif)

-- Statut de traitement d'un fichier depose
CREATE TYPE public.file_status AS ENUM ('uploaded', 'processing', 'processed', 'error');

-- Workflow d'un dashboard : a traiter -> draft IA -> revue -> valide -> supervision -> publie
CREATE TYPE public.dashboard_status AS ENUM ('a_traiter', 'draft_ia', 'revue', 'valide', 'supervision', 'publie');

-- Origine d'une donnee standardisee
CREATE TYPE public.data_source AS ENUM ('ai', 'manual');

-- Nouveaux roles cibles. Les anciens (super_admin / client_admin / client_viewer)
-- sont CONSERVES pour la coexistence du front legacy.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'collaborateur';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';
