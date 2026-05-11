CREATE OR REPLACE FUNCTION public.pcgroup_intercos_cash_validate()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Montant : non null, numérique, positif ou nul
  IF NEW.amount_received IS NULL THEN
    RAISE EXCEPTION 'Le montant remonté est obligatoire (mois %, entité %)', NEW.month_id, NEW.entity_code;
  END IF;
  IF NEW.amount_received < 0 THEN
    RAISE EXCEPTION 'Le montant remonté ne peut pas être négatif (mois %, entité %, valeur %)',
      NEW.month_id, NEW.entity_code, NEW.amount_received;
  END IF;
  IF NEW.amount_received <> NEW.amount_received THEN -- NaN check
    RAISE EXCEPTION 'Le montant remonté n''est pas un nombre valide (mois %, entité %)',
      NEW.month_id, NEW.entity_code;
  END IF;

  -- Mois : doit exister et être actif
  IF NOT EXISTS (
    SELECT 1 FROM public.pcgroup_months
    WHERE month_id = NEW.month_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Mois inconnu ou inactif : %', NEW.month_id;
  END IF;

  -- Entité : doit exister et être active
  IF NOT EXISTS (
    SELECT 1 FROM public.pcgroup_entities
    WHERE code = NEW.entity_code AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Entité inconnue ou inactive : %', NEW.entity_code;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pcgroup_intercos_cash_validate_trg ON public.pcgroup_intercos_cash;

CREATE TRIGGER pcgroup_intercos_cash_validate_trg
BEFORE INSERT OR UPDATE ON public.pcgroup_intercos_cash
FOR EACH ROW
EXECUTE FUNCTION public.pcgroup_intercos_cash_validate();