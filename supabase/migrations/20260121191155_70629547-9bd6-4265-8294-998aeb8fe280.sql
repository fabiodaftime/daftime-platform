-- Add new dashboard layout for a separate-access P&L/EBITDA dashboard
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'dashboard_layout'
      AND e.enumlabel = 'cwp_pl_2025'
  ) THEN
    ALTER TYPE public.dashboard_layout ADD VALUE 'cwp_pl_2025';
  END IF;
END $$;