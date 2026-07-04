-- Phase 29 — Synchro automatique companies (legacy/Lovable) -> clients (plateforme)
-- + catégorie « à catégoriser » pour trier chaque nouveau client à la main.
--
-- Problème : le lien clients.legacy_company_id n'a été peuplé qu'une fois (backfill phase5).
-- Un client créé sur Lovable crée une ligne `companies` mais AUCUNE ligne `clients`,
-- donc il n'apparaît pas sur la plateforme (liste staff + redirection espace client lisent `clients`).
-- Solution : un trigger AFTER INSERT sur `companies` qui crée le `clients` lié, à la volée.
--
-- Classement : les nouveaux clients tombent dans la catégorie 'a_categoriser' (onglet « À catégoriser »
-- dans l'admin) → ils ne comptent PAS en production tant que le staff ne les a pas classés à la main
-- (implantation + catégorie réelle depuis la plateforme).
--
-- Sûreté : bloc EXCEPTION → une erreur éventuelle N'INTERROMPT JAMAIS la création côté Lovable.

-- Nouveau défaut : tout nouveau client est « à catégoriser » (au lieu de 'production').
ALTER TABLE public.clients ALTER COLUMN category SET DEFAULT 'a_categoriser';

CREATE OR REPLACE FUNCTION public.create_client_for_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.clients (name, slug, currency, fiscal_year_start, legacy_company_id, category)
    SELECT
      NEW.name,
      -- slug dérivé du layout_type (ou du nom) + fragment d'UUID => unicité garantie
      trim(both '-' from lower(regexp_replace(
        coalesce(nullif(NEW.layout_type::text, 'default'), NEW.name), '[^a-z0-9]+', '-', 'g')))
        || '-' || substr(NEW.id::text, 1, 8),
      NEW.currency,
      NEW.fiscal_year_start,
      NEW.id,
      'a_categoriser'
    WHERE NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.legacy_company_id = NEW.id);
  EXCEPTION WHEN OTHERS THEN
    -- Ne jamais casser la création de la société côté Lovable : on logge et on continue.
    RAISE WARNING 'create_client_for_company(%): %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_company_to_client ON public.companies;
CREATE TRIGGER trg_company_to_client
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.create_client_for_company();

-- Rattrapage : crée les clients manquants pour les sociétés déjà existantes (idempotent),
-- également en « à catégoriser ».
INSERT INTO public.clients (name, slug, currency, fiscal_year_start, legacy_company_id, category)
SELECT
  co.name,
  trim(both '-' from lower(regexp_replace(
    coalesce(nullif(co.layout_type::text, 'default'), co.name), '[^a-z0-9]+', '-', 'g')))
    || '-' || substr(co.id::text, 1, 8),
  co.currency,
  co.fiscal_year_start,
  co.id,
  'a_categoriser'
FROM public.companies co
WHERE NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.legacy_company_id = co.id);
