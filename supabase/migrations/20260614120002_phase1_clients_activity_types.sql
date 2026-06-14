-- Phase 1 — Tables socle du modele generique : activity_types + clients

CREATE TABLE public.activity_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    config jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    activity_type_id uuid REFERENCES public.activity_types(id) ON DELETE SET NULL,
    currency text NOT NULL DEFAULT 'EUR',
    fiscal_year_start integer NOT NULL DEFAULT 1,
    logo_url text,
    -- L'etape "supervision" du workflow dashboard ne s'applique qu'a certains clients
    requires_supervision boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_activity_type ON public.clients(activity_type_id);

CREATE TRIGGER update_activity_types_updated_at
    BEFORE UPDATE ON public.activity_types
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.activity_types TO service_role;
GRANT ALL ON public.clients TO service_role;

-- Seed initial des types d'activite (extensible)
INSERT INTO public.activity_types (slug, name, description) VALUES
    ('ecommerce',  'E-commerce',          'Vente en ligne de produits'),
    ('coach',      'Coach / Formation',   'Prestations de coaching ou de formation'),
    ('restaurant', 'Restauration',        'Restaurants et hospitality'),
    ('holding',    'Holding / Groupe',    'Structure de detention et consolidation'),
    ('services',   'Services / Conseil',  'Prestations de services et de conseil');
