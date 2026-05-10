
CREATE TABLE public.entity_data_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_layout text NOT NULL,
  source_type text NOT NULL DEFAULT 'google_sheets',
  source_ref text NOT NULL,
  sheet_tab text,
  field_map jsonb NOT NULL DEFAULT '{}'::jsonb,
  month_map jsonb NOT NULL DEFAULT '{}'::jsonb,
  auto_sync boolean NOT NULL DEFAULT false,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_layout)
);

ALTER TABLE public.entity_data_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read mappings"
  ON public.entity_data_mappings FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admin manage mappings"
  ON public.entity_data_mappings FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE TRIGGER trg_entity_data_mappings_updated_at
  BEFORE UPDATE ON public.entity_data_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
