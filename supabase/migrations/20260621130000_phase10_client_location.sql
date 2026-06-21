-- Phase 10 — Localisation des clients (implantations Daftime : Dubaï / France / Portugal).
-- Tous les clients existants sont rattachés à Dubaï par défaut (siège) ; le staff peut
-- ensuite réassigner France/Portugal depuis la plateforme.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT 'dubai';

COMMENT ON COLUMN public.clients.location IS 'Implantation Daftime du client : dubai | france | portugal.';
