-- Add base role to PCGroup entities so the consolidated dashboard
-- can compute "X Filiales + Holding" labels and route data correctly.
ALTER TABLE public.pcgroup_entities
  ADD COLUMN IF NOT EXISTS base_role text NOT NULL DEFAULT 'subsidiary';

-- Validation trigger (CHECK on text would also work, but we keep it
-- as a trigger for forward-compatible role expansion).
CREATE OR REPLACE FUNCTION public.pcgroup_entities_validate_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.base_role NOT IN ('agency','structuring','digit','holding','subsidiary') THEN
    RAISE EXCEPTION 'Invalid base_role: %', NEW.base_role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pcgroup_entities_validate_role_trg ON public.pcgroup_entities;
CREATE TRIGGER pcgroup_entities_validate_role_trg
BEFORE INSERT OR UPDATE ON public.pcgroup_entities
FOR EACH ROW EXECUTE FUNCTION public.pcgroup_entities_validate_role();

-- Backfill from known codes
UPDATE public.pcgroup_entities SET base_role = 'agency'      WHERE code = 'agency'      AND base_role = 'subsidiary';
UPDATE public.pcgroup_entities SET base_role = 'structuring' WHERE code = 'structuring' AND base_role = 'subsidiary';
UPDATE public.pcgroup_entities SET base_role = 'digit'       WHERE code = 'digit'       AND base_role = 'subsidiary';
UPDATE public.pcgroup_entities SET base_role = 'holding'     WHERE code IN ('holding','prime_circle_holding') AND base_role = 'subsidiary';