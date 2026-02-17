
CREATE TABLE public.dashboard_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  config_key text NOT NULL,
  config_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(company_id, config_key)
);

ALTER TABLE public.dashboard_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with company access can view configs"
  ON public.dashboard_configs FOR SELECT
  USING (has_company_access(auth.uid(), company_id));

CREATE POLICY "Super admins and client admins can manage configs"
  ON public.dashboard_configs FOR ALL
  USING (
    is_super_admin(auth.uid()) OR 
    has_role(auth.uid(), 'client_admin')
  );

CREATE TRIGGER update_dashboard_configs_updated_at
  BEFORE UPDATE ON public.dashboard_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
