-- Phase 1 — Pipeline IA : files (entrees) -> contexts -> standardized_data (source de verite)

-- Fichiers deposes par client / mois (entree du pipeline)
CREATE TABLE public.files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    period date,                 -- 1er du mois concerne (nullable : doc transverse)
    kind text,                   -- type fonctionnel libre (releve, balance, contexte...)
    original_name text,
    storage_path text,
    status public.file_status NOT NULL DEFAULT 'uploaded',
    uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_files_client_period ON public.files(client_id, period);

-- Contexte extrait (docx/txt -> champs structures), versionne par client
CREATE TABLE public.contexts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    source_file_id uuid REFERENCES public.files(id) ON DELETE SET NULL,
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    version integer NOT NULL DEFAULT 1,
    is_current boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_contexts_client_current ON public.contexts(client_id) WHERE is_current;

-- Donnee standardisee = SOURCE DE VERITE, JSON versionne par client + mois
CREATE TABLE public.standardized_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    period date NOT NULL,        -- 1er du mois
    activity_type_id uuid REFERENCES public.activity_types(id) ON DELETE SET NULL,
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    missing_items jsonb NOT NULL DEFAULT '[]'::jsonb,   -- pieces manquantes signalees par l'IA
    source public.data_source NOT NULL DEFAULT 'ai',
    version integer NOT NULL DEFAULT 1,
    is_current boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (client_id, period, version)
);
CREATE INDEX idx_standardized_data_client_period ON public.standardized_data(client_id, period) WHERE is_current;

CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON public.files
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standardized_data ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.files TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contexts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.standardized_data TO authenticated;
GRANT ALL ON public.files TO service_role;
GRANT ALL ON public.contexts TO service_role;
GRANT ALL ON public.standardized_data TO service_role;
