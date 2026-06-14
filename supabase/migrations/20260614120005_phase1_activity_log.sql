-- Phase 1 — Journal d'activite generique

CREATE TABLE public.activity_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,  -- null = evenement transverse
    action text NOT NULL,
    entity_type text,
    entity_id uuid,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_log_client ON public.activity_log(client_id);
CREATE INDEX idx_activity_log_created ON public.activity_log(created_at DESC);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
