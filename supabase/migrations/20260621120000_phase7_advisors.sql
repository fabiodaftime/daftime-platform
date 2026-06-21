-- Phase 7 — Conseillers (advisors) rattachés aux clients.
-- Chaque client peut être rattaché à un conseiller Daftime ; ses coordonnées
-- (nom, email, WhatsApp, photo, lien de RDV personnalisé) sont affichées dans l'espace client.

CREATE TABLE IF NOT EXISTS public.advisors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text,
  whatsapp    text,          -- numéro au format international (ex. +971501234567)
  photo_url   text,
  booking_url text,          -- lien Cal.com personnalisé du conseiller
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS advisor_id uuid REFERENCES public.advisors(id) ON DELETE SET NULL;
COMMENT ON COLUMN public.clients.advisor_id IS 'Conseiller Daftime rattaché à ce client.';

ALTER TABLE public.advisors ENABLE ROW LEVEL SECURITY;

-- Lecture : tout utilisateur authentifié peut lire les conseillers
-- (coordonnées internes destinées à être partagées avec les clients).
DROP POLICY IF EXISTS "advisors readable by authenticated" ON public.advisors;
CREATE POLICY "advisors readable by authenticated"
  ON public.advisors FOR SELECT TO authenticated
  USING (true);

-- Écriture : staff Daftime uniquement.
DROP POLICY IF EXISTS "advisors managed by staff" ON public.advisors;
CREATE POLICY "advisors managed by staff"
  ON public.advisors FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
