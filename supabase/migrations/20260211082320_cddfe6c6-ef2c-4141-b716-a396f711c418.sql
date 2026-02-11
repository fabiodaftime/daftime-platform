
CREATE TABLE public.dashboard_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  author_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dashboard_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with company access can view comments"
ON public.dashboard_comments
FOR SELECT
USING (has_company_access(auth.uid(), company_id));

CREATE POLICY "Users with company access can insert comments"
ON public.dashboard_comments
FOR INSERT
WITH CHECK (has_company_access(auth.uid(), company_id) AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.dashboard_comments
FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_dashboard_comments_company ON public.dashboard_comments(company_id, created_at DESC);
