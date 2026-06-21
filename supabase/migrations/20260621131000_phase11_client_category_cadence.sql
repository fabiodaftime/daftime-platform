-- Phase 11 — Catégorie & cadence de production des clients.
--  category : production (réel, compte dans les stats) | test (fictif) | ponctuel (ponctuel)
--  cadence  : monthly | quarterly ; cadence_months = mois de mise à jour (1-12) si non mensuel.

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'production';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cadence text NOT NULL DEFAULT 'monthly';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cadence_months integer[];

COMMENT ON COLUMN public.clients.category IS 'production | test | ponctuel — test/ponctuel exclus des stats mensuelles.';
COMMENT ON COLUMN public.clients.cadence IS 'monthly | quarterly — cadence de production.';
COMMENT ON COLUMN public.clients.cadence_months IS 'Mois de mise à jour (1-12) si cadence non mensuelle.';

-- Classification initiale (ajustable ensuite dans les réglages dossier).
UPDATE public.clients SET category = 'test'
WHERE name ILIKE 'Brasserie Bocuse%' OR name ILIKE 'CW Partners' OR name ILIKE 'CW Partners FZCO%'
   OR name ILIKE 'Hotel X%' OR name ILIKE 'Immo Pour Expat' OR name ILIKE 'IPE Services'
   OR name ILIKE 'Nexus%' OR name ILIKE 'Richissime';

UPDATE public.clients SET category = 'ponctuel' WHERE name ILIKE 'Ampfora%';

UPDATE public.clients SET cadence = 'quarterly', cadence_months = '{3,6,9,12}' WHERE name ILIKE 'Labarile%';
