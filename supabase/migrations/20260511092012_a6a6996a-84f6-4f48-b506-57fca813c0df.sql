CREATE TABLE public.pcgroup_intercos_cash_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month_id TEXT NOT NULL,
  entity_code TEXT NOT NULL,
  action TEXT NOT NULL,
  old_amount NUMERIC,
  new_amount NUMERIC,
  actor_id UUID,
  actor_name TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pcgroup_intercos_cash_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read intercos cash audit"
ON public.pcgroup_intercos_cash_audit
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins insert intercos cash audit"
ON public.pcgroup_intercos_cash_audit
FOR INSERT TO authenticated
WITH CHECK (is_super_admin(auth.uid()) AND (actor_id = auth.uid() OR actor_id IS NULL));

CREATE INDEX idx_pcgroup_intercos_cash_audit_month_entity
ON public.pcgroup_intercos_cash_audit (month_id, entity_code, created_at DESC);