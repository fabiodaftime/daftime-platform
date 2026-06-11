CREATE TABLE public.dataroom_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cat TEXT NOT NULL,
  folder TEXT NOT NULL,
  file TEXT NOT NULL,
  kb INTEGER NOT NULL DEFAULT 0,
  storage_path TEXT,
  uploaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cat, folder, file)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dataroom_documents TO authenticated;
GRANT ALL ON public.dataroom_documents TO service_role;

ALTER TABLE public.dataroom_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read dataroom"
  ON public.dataroom_documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins manage dataroom"
  ON public.dataroom_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX dataroom_documents_cat_folder_idx ON public.dataroom_documents (cat, folder);

CREATE TRIGGER dataroom_documents_set_updated_at
  BEFORE UPDATE ON public.dataroom_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage RLS for dataroom bucket
CREATE POLICY "Authenticated can read dataroom files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'dataroom');

CREATE POLICY "Super admins manage dataroom files"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'dataroom' AND public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (bucket_id = 'dataroom' AND public.has_role(auth.uid(), 'super_admin'));