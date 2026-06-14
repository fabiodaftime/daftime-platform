-- Phase 3 — Charte graphique par client (tokens de design déduits du site/screenshot/PDF)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS brand jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.clients.brand IS
  'Tokens de design (couleurs/typo/style) déduits de la charte du client, injectés dans la génération de dashboard.';

-- Coexistence : pendant la migration, le staff Daftime porte encore le rôle legacy super_admin.
-- On l'inclut dans is_staff() pour que le RLS des tables génériques l'autorise (cohérent avec
-- la garde des edge functions). À retirer en Phase 6 une fois les rôles re-mappés.
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role IN ('admin', 'manager', 'collaborateur', 'super_admin')
    );
$$;
