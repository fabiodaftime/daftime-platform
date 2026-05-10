
-- ============================================================================
-- PCGroup configuration tables
-- ============================================================================

-- Entities
CREATE TABLE public.pcgroup_entities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  badge text NOT NULL DEFAULT '',
  gradient text NOT NULL DEFAULT '',
  css_class text NOT NULL DEFAULT '',
  pie_color text NOT NULL DEFAULT '#1E3A5F',
  source_type text NOT NULL DEFAULT 'manual', -- 'dashboard' | 'manual'
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Months
CREATE TABLE public.pcgroup_months (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month_id text NOT NULL UNIQUE, -- 'jan-2026'
  label text NOT NULL,            -- 'Janvier 2026'
  short_label text NOT NULL DEFAULT '',
  year integer NOT NULL,
  month_num integer NOT NULL CHECK (month_num BETWEEN 1 AND 12),
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Rules (per month, NULL month_id = global default)
CREATE TABLE public.pcgroup_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month_id text UNIQUE,
  reserves_pct numeric NOT NULL DEFAULT 10,
  remontee_pct numeric NOT NULL DEFAULT 90,
  maxence_pct numeric NOT NULL DEFAULT 37.5,
  thibault_pct numeric NOT NULL DEFAULT 37.5,
  florian_pct numeric NOT NULL DEFAULT 25,
  will_in_thibault numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Manual entity facts (SPY, Comment, ...) per month
CREATE TABLE public.pcgroup_manual_facts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month_id text NOT NULL,
  entity_code text NOT NULL,
  ca numeric NOT NULL DEFAULT 0,
  charges numeric NOT NULL DEFAULT 0,
  contribution numeric NOT NULL DEFAULT 0, -- marge nette
  margin_pct numeric NOT NULL DEFAULT 0,
  deals integer,
  warning text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (month_id, entity_code)
);

-- Holding facts per month
CREATE TABLE public.pcgroup_holding_facts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month_id text NOT NULL UNIQUE,
  frais_total numeric NOT NULL DEFAULT 0,
  frais_detail jsonb NOT NULL DEFAULT '[]'::jsonb,
  apport_maxence numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Intercos cash received per entity per month
CREATE TABLE public.pcgroup_intercos_cash (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month_id text NOT NULL,
  entity_code text NOT NULL,
  amount_received numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (month_id, entity_code)
);

-- Indexes
CREATE INDEX idx_pcgroup_manual_facts_month ON public.pcgroup_manual_facts(month_id);
CREATE INDEX idx_pcgroup_intercos_cash_month ON public.pcgroup_intercos_cash(month_id);

-- Triggers updated_at
CREATE TRIGGER pcgroup_entities_updated BEFORE UPDATE ON public.pcgroup_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER pcgroup_months_updated BEFORE UPDATE ON public.pcgroup_months
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER pcgroup_rules_updated BEFORE UPDATE ON public.pcgroup_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER pcgroup_manual_facts_updated BEFORE UPDATE ON public.pcgroup_manual_facts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER pcgroup_holding_facts_updated BEFORE UPDATE ON public.pcgroup_holding_facts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER pcgroup_intercos_cash_updated BEFORE UPDATE ON public.pcgroup_intercos_cash
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.pcgroup_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pcgroup_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pcgroup_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pcgroup_manual_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pcgroup_holding_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pcgroup_intercos_cash ENABLE ROW LEVEL SECURITY;

-- Policies: super_admin manage, authenticated read
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'pcgroup_entities','pcgroup_months','pcgroup_rules',
    'pcgroup_manual_facts','pcgroup_holding_facts','pcgroup_intercos_cash'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY "Super admins manage %1$s" ON public.%1$s FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));',
      t
    );
    EXECUTE format(
      'CREATE POLICY "Authenticated read %1$s" ON public.%1$s FOR SELECT TO authenticated USING (true);',
      t
    );
  END LOOP;
END $$;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Entities
INSERT INTO public.pcgroup_entities (code, name, badge, gradient, css_class, pie_color, source_type, display_order) VALUES
  ('agency',      'Agency',         'Media',       'linear-gradient(135deg, #4F5BD5 0%, #6366F1 100%)', 'agency',      '#F59E0B', 'dashboard', 1),
  ('structuring', 'Structuring',    'Banking',     'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)', 'structuring', '#1E3A5F', 'dashboard', 2),
  ('digit',       'Digit Solution', 'Ad Accounts', 'linear-gradient(135deg, #D946A8 0%, #EC4899 100%)', 'digit',       '#4F5BD5', 'dashboard', 3),
  ('spy',         'SPY',            'Tools',       'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', 'spy',         '#10B981', 'manual',    4),
  ('comment',     'Comment',        'Trust',       'linear-gradient(135deg, #10B981 0%, #059669 100%)', 'comment',     '#D946A8', 'manual',    5);

-- Months
INSERT INTO public.pcgroup_months (month_id, label, short_label, year, month_num, display_order) VALUES
  ('jan-2026', 'Janvier 2026',  'jan', 2026, 1, 1),
  ('feb-2026', 'Février 2026',  'fév', 2026, 2, 2),
  ('mar-2026', 'Mars 2026',     'mar', 2026, 3, 3),
  ('apr-2026', 'Avril 2026',    'avr', 2026, 4, 4);

-- Rules (1 row per month, identical for now)
INSERT INTO public.pcgroup_rules (month_id, reserves_pct, remontee_pct, maxence_pct, thibault_pct, florian_pct, will_in_thibault) VALUES
  ('jan-2026', 10, 90, 37.5, 37.5, 25, 10000),
  ('feb-2026', 10, 90, 37.5, 37.5, 25, 10000),
  ('mar-2026', 10, 90, 37.5, 37.5, 25, 10000),
  ('apr-2026', 10, 90, 37.5, 37.5, 25, 10000);

-- Manual SPY/Comment facts
INSERT INTO public.pcgroup_manual_facts (month_id, entity_code, ca, charges, contribution, margin_pct, deals, warning) VALUES
  ('jan-2026', 'spy',     16750, 13488, 3262, 19.5,  5, NULL),
  ('jan-2026', 'comment',  2813,   281, 2531, 90.0, 20, ''),
  ('feb-2026', 'spy',     27300, 23741, 3559, 13.0,  5, NULL),
  ('feb-2026', 'comment',   333,   193,  140, 42.0, 20, 'Activité en forte baisse ce mois. CA divisé par ~8 vs janvier.'),
  ('mar-2026', 'spy',     37350, 33880, 3470,  9.3,  5, NULL),
  ('mar-2026', 'comment',   861,   158,  703, 81.6, 20, 'Rebond significatif vs Février. Marge nette excellente à 81.6%.'),
  ('apr-2026', 'spy',     38450, 35352, 3098,  8.1,  5, NULL),
  ('apr-2026', 'comment',   438,   174,  264, 60.3, 20, 'Activité résiduelle. CA quasi nul vs Mars.');

-- Holding facts
INSERT INTO public.pcgroup_holding_facts (month_id, frais_total, frais_detail, apport_maxence) VALUES
  ('jan-2026',  7060, '[
    {"label":"Compta + CFO Groupe","amount":3430},
    {"label":"Salaire Assistante","amount":1630},
    {"label":"Salaires Fixes Sales","amount":2000}
  ]'::jsonb, 0),
  ('feb-2026', 10890, '[
    {"label":"Compta + CFO Groupe","amount":3430},
    {"label":"Salaire Assistante","amount":1630},
    {"label":"Salaires Fixes Sales","amount":2000},
    {"label":"Travel Expenses","amount":3781},
    {"label":"Bank Fees","amount":50}
  ]'::jsonb, 54458),
  ('mar-2026',  8378, '[
    {"label":"CFO + Compta Groupe","amount":3430},
    {"label":"AI Agent","amount":2000},
    {"label":"Salaire Fixe Sales","amount":2000},
    {"label":"Tools","amount":780},
    {"label":"Frais Bancaires","amount":88},
    {"label":"Frais Paddel (non remboursés)","amount":80}
  ]'::jsonb, 0),
  ('apr-2026',  8298, '[
    {"label":"CFO + Compta Groupe","amount":3430},
    {"label":"AI Agent","amount":2000},
    {"label":"Salaire Fixe Sales","amount":2000},
    {"label":"Tools","amount":780},
    {"label":"Frais Bancaires","amount":88}
  ]'::jsonb, 0);

-- Intercos cash received
INSERT INTO public.pcgroup_intercos_cash (month_id, entity_code, amount_received) VALUES
  ('jan-2026', 'structuring', 20000),
  ('jan-2026', 'digit',       12000),
  ('jan-2026', 'agency',       1500),
  ('jan-2026', 'spy',          2000),
  ('jan-2026', 'comment',       500),
  ('feb-2026', 'structuring',  1500),
  ('feb-2026', 'digit',         500),
  ('feb-2026', 'agency',        173);
