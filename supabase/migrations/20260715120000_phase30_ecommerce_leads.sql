-- Phase 30 — Leads de la landing e-commerce (formulaire « dashboard gratuit »).
-- Insertion PUBLIQUE (visiteur anonyme depuis la landing) ; lecture réservée au staff.

CREATE TABLE IF NOT EXISTS public.ecommerce_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  shop_url text,
  monthly_revenue text,        -- tranche : <30k | 30-100k | 100-300k | 300k+
  source text,                 -- d'où vient le lead (hero, sticky, pricing…)
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ecommerce_leads ENABLE ROW LEVEL SECURITY;

-- Un visiteur anonyme peut soumettre le formulaire (INSERT uniquement).
DROP POLICY IF EXISTS "public can submit ecommerce lead" ON public.ecommerce_leads;
CREATE POLICY "public can submit ecommerce lead"
  ON public.ecommerce_leads FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Seul le staff lit les leads.
DROP POLICY IF EXISTS "staff reads ecommerce leads" ON public.ecommerce_leads;
CREATE POLICY "staff reads ecommerce leads"
  ON public.ecommerce_leads FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

GRANT INSERT ON public.ecommerce_leads TO anon;
GRANT SELECT, INSERT ON public.ecommerce_leads TO authenticated;
