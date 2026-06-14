-- Phase 1 — Dashboards (HTML + JSON separes) + historique de workflow

CREATE TABLE public.dashboards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    period date NOT NULL,        -- 1er du mois
    standardized_data_id uuid REFERENCES public.standardized_data(id) ON DELETE SET NULL,
    html text,                   -- rendu HTML autonome (Chart.js)
    data_json jsonb NOT NULL DEFAULT '{}'::jsonb,   -- donnees injectees, separees du HTML
    status public.dashboard_status NOT NULL DEFAULT 'a_traiter',
    version integer NOT NULL DEFAULT 1,
    is_current boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (client_id, period, version)
);
CREATE INDEX idx_dashboards_client_period ON public.dashboards(client_id, period) WHERE is_current;
CREATE INDEX idx_dashboards_status ON public.dashboards(status);

-- Trace des transitions de workflow (qui a fait passer de quel statut a quel statut)
CREATE TABLE public.dashboard_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id uuid NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
    from_status public.dashboard_status,
    to_status public.dashboard_status NOT NULL,
    changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    note text,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dashboard_status_history_dashboard ON public.dashboard_status_history(dashboard_id);

CREATE TRIGGER update_dashboards_updated_at
    BEFORE UPDATE ON public.dashboards
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_status_history ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboard_status_history TO authenticated;
GRANT ALL ON public.dashboards TO service_role;
GRANT ALL ON public.dashboard_status_history TO service_role;
