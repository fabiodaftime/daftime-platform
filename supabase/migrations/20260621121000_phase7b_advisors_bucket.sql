-- Phase 7b — Bucket public pour les photos des conseillers.
-- (Séparé de phase7 car cette dernière était déjà appliquée : une migration appliquée
--  n'est jamais rejouée par `supabase db push`.)

-- Lecture publique via URL ; écriture réservée au staff Daftime.
INSERT INTO storage.buckets (id, name, public)
VALUES ('advisors', 'advisors', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "advisors photos staff write" ON storage.objects;
CREATE POLICY "advisors photos staff write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'advisors' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "advisors photos staff update" ON storage.objects;
CREATE POLICY "advisors photos staff update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'advisors' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "advisors photos staff delete" ON storage.objects;
CREATE POLICY "advisors photos staff delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'advisors' AND public.is_staff(auth.uid()));
