-- Phase 5 (Stage 1) — Référentiel : lien clients ↔ companies + création d'un client générique par société legacy.

-- Lien du modèle générique vers la société legacy (sert au re-map des rôles et à la cohabitation).
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS legacy_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- Un client générique par société (idempotent via legacy_company_id). activity_type laissé NULL
-- (assigné client par client à la bascule). slug dérivé du layout_type (unique) sinon du nom.
INSERT INTO public.clients (name, slug, currency, fiscal_year_start, legacy_company_id)
SELECT
  co.name,
  trim(both '-' from lower(regexp_replace(coalesce(nullif(co.layout_type::text, 'default'), co.name), '[^a-z0-9]+', '-', 'g'))),
  co.currency,
  co.fiscal_year_start,
  co.id
FROM public.companies co
WHERE NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.legacy_company_id = co.id);
