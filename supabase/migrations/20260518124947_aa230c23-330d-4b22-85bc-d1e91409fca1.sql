CREATE TABLE IF NOT EXISTS public.labarile_pl_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL,
  account text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(year, month, account)
);

CREATE INDEX IF NOT EXISTS idx_labarile_pl_accounts_ym ON public.labarile_pl_accounts(year, month);
CREATE INDEX IF NOT EXISTS idx_labarile_pl_accounts_cat ON public.labarile_pl_accounts(category);

ALTER TABLE public.labarile_pl_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read labarile_pl_accounts"
ON public.labarile_pl_accounts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins manage labarile_pl_accounts"
ON public.labarile_pl_accounts FOR ALL TO authenticated
USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

CREATE TRIGGER update_labarile_pl_accounts_updated_at
BEFORE UPDATE ON public.labarile_pl_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();