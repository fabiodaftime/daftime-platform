-- Inputs canoniques mensuels par entité (source de vérité chiffrée)
CREATE TABLE public.entity_monthly_inputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_layout text NOT NULL,           -- 'digit' | 'prime_circle' | 'prime_circle_agency' | ...
  company_id uuid,                        -- nullable: certains layouts (ex: digit groupe) n'ont pas de company
  month_id text NOT NULL,                 -- 'jan-2026', 'feb-2026', ...
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_layout, company_id, month_id)
);

CREATE INDEX idx_emi_lookup ON public.entity_monthly_inputs (entity_layout, month_id);
CREATE INDEX idx_emi_company ON public.entity_monthly_inputs (company_id);

ALTER TABLE public.entity_monthly_inputs ENABLE ROW LEVEL SECURITY;

-- Lecture: super admin partout, sinon accès company requis (NULL company = lisible par tous authenticated)
CREATE POLICY "Read entity inputs"
  ON public.entity_monthly_inputs
  FOR SELECT
  TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR company_id IS NULL
    OR has_company_access(auth.uid(), company_id)
  );

-- Écriture: super admin uniquement
CREATE POLICY "Super admins manage entity inputs"
  ON public.entity_monthly_inputs
  FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE TRIGGER trg_emi_updated_at
  BEFORE UPDATE ON public.entity_monthly_inputs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit log: chaque modification (champ par champ)
CREATE TABLE public.entity_input_edits_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_layout text NOT NULL,
  company_id uuid,
  month_id text NOT NULL,
  field_path text NOT NULL,           -- ex: 'ca_core' ou 'costs.provider'
  old_value jsonb,
  new_value jsonb,
  actor_id uuid NOT NULL,
  actor_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_eil_entity ON public.entity_input_edits_log (entity_layout, month_id, created_at DESC);

ALTER TABLE public.entity_input_edits_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read edit log"
  ON public.entity_input_edits_log
  FOR SELECT
  TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR company_id IS NULL
    OR has_company_access(auth.uid(), company_id)
  );

CREATE POLICY "Insert edit log (super admin self)"
  ON public.entity_input_edits_log
  FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin(auth.uid()) AND actor_id = auth.uid());

-- Realtime sur les inputs (cascade live vers tous les dashboards ouverts)
ALTER PUBLICATION supabase_realtime ADD TABLE public.entity_monthly_inputs;