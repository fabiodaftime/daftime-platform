-- Phase 2 — Bucket Storage des fichiers clients (entrée du pipeline IA)
-- Convention de chemin : client-files/<client_id>/<...> → le 1er dossier = client_id.

INSERT INTO storage.buckets (id, name, public)
VALUES ('client-files', 'client-files', false)
ON CONFLICT (id) DO NOTHING;

-- Lecture : staff (tous) ou client rattaché à ce client_id
CREATE POLICY "client-files: read by access"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'client-files'
    AND public.has_client_access(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

-- Dépôt : le client PEUT déposer dans son propre dossier (et le staff partout)
CREATE POLICY "client-files: insert by access"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'client-files'
    AND public.has_client_access(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

-- Modification / suppression : staff uniquement
CREATE POLICY "client-files: update by staff"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'client-files' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'client-files' AND public.is_staff(auth.uid()));

CREATE POLICY "client-files: delete by staff"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'client-files' AND public.is_staff(auth.uid()));
