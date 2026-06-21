-- Phase 12 — Suivi de production manuel (clients legacy notamment).
-- Pour les clients dont le statut de clôture n'est pas piloté par le pipeline IA
-- (dashboards), le staff suit l'avancement à la main, par mois.

CREATE TABLE IF NOT EXISTS public.production_status (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  period     date NOT NULL,
  status     text NOT NULL DEFAULT 'a_produire',
  note       text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, period)
);
CREATE INDEX IF NOT EXISTS idx_production_status_period ON public.production_status(period);

ALTER TABLE public.production_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "production_status managed by staff" ON public.production_status;
CREATE POLICY "production_status managed by staff"
  ON public.production_status FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
