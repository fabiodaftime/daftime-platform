
-- ============= ENUMS =============
CREATE TYPE public.revision_status AS ENUM ('todo','in_progress','in_review','validated','closed');
CREATE TYPE public.revision_cycle_status AS ENUM ('not_started','in_progress','in_review','validated','anomaly');
CREATE TYPE public.revision_checklist_status AS ENUM ('todo','done','na','anomaly');
CREATE TYPE public.revision_anomaly_severity AS ENUM ('low','medium','high','blocking');
CREATE TYPE public.revision_anomaly_status AS ENUM ('open','in_progress','resolved','accepted');
CREATE TYPE public.revision_jurisdiction AS ENUM ('uae','france','portugal');

-- ============= ENTITIES (sub-entities of a company) =============
CREATE TABLE public.revision_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  jurisdiction public.revision_jurisdiction NOT NULL DEFAULT 'uae',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

-- ============= REVISION FILES =============
CREATE TABLE public.revision_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES public.revision_entities(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  jurisdiction public.revision_jurisdiction NOT NULL DEFAULT 'uae',
  status public.revision_status NOT NULL DEFAULT 'todo',
  assigned_to UUID,
  reviewed_by UUID,
  deadline DATE,
  closed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_revision_files_company ON public.revision_files(company_id);
CREATE INDEX idx_revision_files_entity ON public.revision_files(entity_id);

-- ============= CYCLES =============
CREATE TABLE public.revision_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_file_id UUID NOT NULL REFERENCES public.revision_files(id) ON DELETE CASCADE,
  cycle_code TEXT NOT NULL,
  cycle_name TEXT NOT NULL,
  status public.revision_cycle_status NOT NULL DEFAULT 'not_started',
  progress_pct NUMERIC NOT NULL DEFAULT 0,
  assigned_to UUID,
  opening_balance NUMERIC,
  closing_balance NUMERIC,
  variance NUMERIC,
  variance_pct NUMERIC,
  comments TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_revision_cycles_file ON public.revision_cycles(revision_file_id);

-- ============= CHECKLIST =============
CREATE TABLE public.revision_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.revision_cycles(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  status public.revision_checklist_status NOT NULL DEFAULT 'todo',
  done_by UUID,
  done_at TIMESTAMPTZ,
  evidence_required BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_revision_checklist_cycle ON public.revision_checklist_items(cycle_id);

-- ============= LEAD SCHEDULES =============
CREATE TABLE public.revision_lead_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.revision_cycles(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL,
  account_label TEXT NOT NULL,
  n_balance NUMERIC NOT NULL DEFAULT 0,
  n1_balance NUMERIC NOT NULL DEFAULT 0,
  variance_amount NUMERIC GENERATED ALWAYS AS (n_balance - n1_balance) STORED,
  variance_pct NUMERIC,
  justified BOOLEAN NOT NULL DEFAULT false,
  justification_note TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_revision_lead_cycle ON public.revision_lead_schedules(cycle_id);

-- ============= ATTACHMENTS =============
CREATE TABLE public.revision_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES public.revision_cycles(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES public.revision_checklist_items(id) ON DELETE CASCADE,
  revision_file_id UUID NOT NULL REFERENCES public.revision_files(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_revision_attach_file ON public.revision_attachments(revision_file_id);

-- ============= COMMENTS =============
CREATE TABLE public.revision_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES public.revision_cycles(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES public.revision_checklist_items(id) ON DELETE CASCADE,
  revision_file_id UUID NOT NULL REFERENCES public.revision_files(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  is_review_note BOOLEAN NOT NULL DEFAULT false,
  resolved BOOLEAN NOT NULL DEFAULT false,
  parent_id UUID REFERENCES public.revision_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_revision_comments_file ON public.revision_comments(revision_file_id);

-- ============= ANOMALIES =============
CREATE TABLE public.revision_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.revision_cycles(id) ON DELETE CASCADE,
  revision_file_id UUID NOT NULL REFERENCES public.revision_files(id) ON DELETE CASCADE,
  severity public.revision_anomaly_severity NOT NULL DEFAULT 'medium',
  description TEXT NOT NULL,
  proposed_adjustment_amount NUMERIC,
  debit_account TEXT,
  credit_account TEXT,
  status public.revision_anomaly_status NOT NULL DEFAULT 'open',
  assigned_to UUID,
  resolved_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_revision_anomalies_file ON public.revision_anomalies(revision_file_id);

-- ============= TEMPLATES =============
CREATE TABLE public.revision_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction public.revision_jurisdiction NOT NULL,
  cycle_code TEXT NOT NULL,
  cycle_name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  default_checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (jurisdiction, cycle_code)
);

-- ============= AUDIT LOG =============
CREATE TABLE public.revision_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_file_id UUID NOT NULL REFERENCES public.revision_files(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL,
  actor_name TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_revision_audit_file ON public.revision_audit_log(revision_file_id);

-- ============= HELPER FUNCTION (security definer) =============
CREATE OR REPLACE FUNCTION public.has_revision_file_access(_user_id UUID, _file_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.revision_files rf
    WHERE rf.id = _file_id
      AND public.has_company_access(_user_id, rf.company_id)
  )
$$;

-- ============= ENABLE RLS =============
ALTER TABLE public.revision_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_lead_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_audit_log ENABLE ROW LEVEL SECURITY;

-- ============= RLS POLICIES =============
-- ENTITIES
CREATE POLICY "View entities of accessible companies" ON public.revision_entities
  FOR SELECT USING (public.has_company_access(auth.uid(), company_id));
CREATE POLICY "Super admins manage entities" ON public.revision_entities
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- FILES
CREATE POLICY "View revision files of accessible companies" ON public.revision_files
  FOR SELECT USING (public.has_company_access(auth.uid(), company_id));
CREATE POLICY "Insert revision files for accessible companies" ON public.revision_files
  FOR INSERT WITH CHECK (public.has_company_access(auth.uid(), company_id));
CREATE POLICY "Update revision files of accessible companies" ON public.revision_files
  FOR UPDATE USING (public.has_company_access(auth.uid(), company_id));
CREATE POLICY "Super admins delete revision files" ON public.revision_files
  FOR DELETE USING (public.is_super_admin(auth.uid()));

-- CYCLES
CREATE POLICY "View cycles via file access" ON public.revision_cycles
  FOR SELECT USING (public.has_revision_file_access(auth.uid(), revision_file_id));
CREATE POLICY "Manage cycles via file access" ON public.revision_cycles
  FOR ALL USING (public.has_revision_file_access(auth.uid(), revision_file_id))
  WITH CHECK (public.has_revision_file_access(auth.uid(), revision_file_id));

-- CHECKLIST
CREATE POLICY "View checklist via cycle" ON public.revision_checklist_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.revision_cycles c
            WHERE c.id = cycle_id
              AND public.has_revision_file_access(auth.uid(), c.revision_file_id))
  );
CREATE POLICY "Manage checklist via cycle" ON public.revision_checklist_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.revision_cycles c
            WHERE c.id = cycle_id
              AND public.has_revision_file_access(auth.uid(), c.revision_file_id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.revision_cycles c
            WHERE c.id = cycle_id
              AND public.has_revision_file_access(auth.uid(), c.revision_file_id))
  );

-- LEAD SCHEDULES
CREATE POLICY "View lead schedules via cycle" ON public.revision_lead_schedules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.revision_cycles c
            WHERE c.id = cycle_id
              AND public.has_revision_file_access(auth.uid(), c.revision_file_id))
  );
CREATE POLICY "Manage lead schedules via cycle" ON public.revision_lead_schedules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.revision_cycles c
            WHERE c.id = cycle_id
              AND public.has_revision_file_access(auth.uid(), c.revision_file_id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.revision_cycles c
            WHERE c.id = cycle_id
              AND public.has_revision_file_access(auth.uid(), c.revision_file_id))
  );

-- ATTACHMENTS
CREATE POLICY "View attachments via file" ON public.revision_attachments
  FOR SELECT USING (public.has_revision_file_access(auth.uid(), revision_file_id));
CREATE POLICY "Insert attachments via file" ON public.revision_attachments
  FOR INSERT WITH CHECK (public.has_revision_file_access(auth.uid(), revision_file_id) AND uploaded_by = auth.uid());
CREATE POLICY "Delete own attachments" ON public.revision_attachments
  FOR DELETE USING (uploaded_by = auth.uid() OR public.is_super_admin(auth.uid()));

-- COMMENTS
CREATE POLICY "View comments via file" ON public.revision_comments
  FOR SELECT USING (public.has_revision_file_access(auth.uid(), revision_file_id));
CREATE POLICY "Insert comments via file" ON public.revision_comments
  FOR INSERT WITH CHECK (public.has_revision_file_access(auth.uid(), revision_file_id) AND author_id = auth.uid());
CREATE POLICY "Update own comments" ON public.revision_comments
  FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Delete own comments" ON public.revision_comments
  FOR DELETE USING (author_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- ANOMALIES
CREATE POLICY "View anomalies via file" ON public.revision_anomalies
  FOR SELECT USING (public.has_revision_file_access(auth.uid(), revision_file_id));
CREATE POLICY "Manage anomalies via file" ON public.revision_anomalies
  FOR ALL USING (public.has_revision_file_access(auth.uid(), revision_file_id))
  WITH CHECK (public.has_revision_file_access(auth.uid(), revision_file_id));

-- TEMPLATES (read for all authenticated, write super admin only)
CREATE POLICY "Authenticated view templates" ON public.revision_templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins manage templates" ON public.revision_templates
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- AUDIT LOG
CREATE POLICY "View audit via file" ON public.revision_audit_log
  FOR SELECT USING (public.has_revision_file_access(auth.uid(), revision_file_id));
CREATE POLICY "Insert audit via file" ON public.revision_audit_log
  FOR INSERT WITH CHECK (public.has_revision_file_access(auth.uid(), revision_file_id) AND actor_id = auth.uid());

-- ============= TRIGGERS updated_at =============
CREATE TRIGGER trg_revision_entities_uat BEFORE UPDATE ON public.revision_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_revision_files_uat BEFORE UPDATE ON public.revision_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_revision_cycles_uat BEFORE UPDATE ON public.revision_cycles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_revision_checklist_uat BEFORE UPDATE ON public.revision_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_revision_lead_uat BEFORE UPDATE ON public.revision_lead_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_revision_anomalies_uat BEFORE UPDATE ON public.revision_anomalies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_revision_templates_uat BEFORE UPDATE ON public.revision_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= STORAGE BUCKET =============
INSERT INTO storage.buckets (id, name, public)
VALUES ('revision-attachments', 'revision-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth users view revision attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'revision-attachments');

CREATE POLICY "Auth users upload revision attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'revision-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete their own revision attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'revision-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============= SEED TEMPLATES UAE =============
INSERT INTO public.revision_templates (jurisdiction, cycle_code, cycle_name, order_index, default_checklist_items) VALUES
('uae','immo','Immobilisations & Amortissements',1,'[
  {"code":"immo-1","label":"Inventaire physique des immobilisations","mandatory":true,"evidence":true},
  {"code":"immo-2","label":"Vérification du tableau d''amortissement","mandatory":true,"evidence":true},
  {"code":"immo-3","label":"Contrôle des acquisitions de l''exercice","mandatory":true,"evidence":true},
  {"code":"immo-4","label":"Contrôle des cessions et mises au rebut","mandatory":true,"evidence":false},
  {"code":"immo-5","label":"Test de dépréciation (impairment)","mandatory":false,"evidence":false}
]'::jsonb),
('uae','stocks','Stocks & En-cours',2,'[
  {"code":"stk-1","label":"Inventaire physique de fin d''exercice","mandatory":true,"evidence":true},
  {"code":"stk-2","label":"Valorisation au coût ou valeur nette","mandatory":true,"evidence":false},
  {"code":"stk-3","label":"Cut-off des entrées/sorties","mandatory":true,"evidence":false},
  {"code":"stk-4","label":"Provisions pour dépréciation","mandatory":false,"evidence":false}
]'::jsonb),
('uae','clients','Clients & Ventes',3,'[
  {"code":"cli-1","label":"Pointage de la balance auxiliaire clients","mandatory":true,"evidence":true},
  {"code":"cli-2","label":"Cut-off des ventes (dernière facture)","mandatory":true,"evidence":true},
  {"code":"cli-3","label":"Circularisation des soldes significatifs","mandatory":false,"evidence":true},
  {"code":"cli-4","label":"Provision pour créances douteuses","mandatory":true,"evidence":false},
  {"code":"cli-5","label":"Revue de la balance âgée","mandatory":true,"evidence":true}
]'::jsonb),
('uae','fournisseurs','Fournisseurs & Achats',4,'[
  {"code":"frn-1","label":"Pointage de la balance auxiliaire fournisseurs","mandatory":true,"evidence":true},
  {"code":"frn-2","label":"Cut-off des achats (dernière facture reçue)","mandatory":true,"evidence":true},
  {"code":"frn-3","label":"Calcul des FNP (factures non parvenues)","mandatory":true,"evidence":false},
  {"code":"frn-4","label":"Calcul des CCA (charges constatées d''avance)","mandatory":true,"evidence":false}
]'::jsonb),
('uae','tresorerie','Trésorerie',5,'[
  {"code":"tre-1","label":"Rapprochement bancaire signé pour chaque compte","mandatory":true,"evidence":true},
  {"code":"tre-2","label":"Vérification des chèques en circulation > 3 mois","mandatory":true,"evidence":false},
  {"code":"tre-3","label":"Cut-off des opérations bancaires","mandatory":true,"evidence":false},
  {"code":"tre-4","label":"Contrôle solde caisse vs inventaire physique","mandatory":true,"evidence":true},
  {"code":"tre-5","label":"Contrôle des taux de change appliqués","mandatory":true,"evidence":false}
]'::jsonb),
('uae','capitaux','Capitaux propres',6,'[
  {"code":"cap-1","label":"Suivi des mouvements de capital","mandatory":true,"evidence":true},
  {"code":"cap-2","label":"PV d''AG et décisions de l''associé unique","mandatory":true,"evidence":true},
  {"code":"cap-3","label":"Affectation du résultat N-1","mandatory":true,"evidence":true}
]'::jsonb),
('uae','emprunts','Emprunts & Dettes financières',7,'[
  {"code":"emp-1","label":"Tableaux d''amortissement à jour","mandatory":true,"evidence":true},
  {"code":"emp-2","label":"Confirmation bancaire des soldes","mandatory":false,"evidence":true},
  {"code":"emp-3","label":"Calcul des intérêts courus","mandatory":true,"evidence":false}
]'::jsonb),
('uae','paie','Personnel & Paie (EOSB / DEWS)',8,'[
  {"code":"pai-1","label":"Rapprochement masse salariale comptable / bulletins","mandatory":true,"evidence":true},
  {"code":"pai-2","label":"Calcul de la provision EOSB (End of Service Benefits)","mandatory":true,"evidence":true},
  {"code":"pai-3","label":"Vérification des cotisations DEWS (si applicable)","mandatory":false,"evidence":false},
  {"code":"pai-4","label":"Contrôle des congés non pris","mandatory":true,"evidence":false}
]'::jsonb),
('uae','vat','Fiscal — VAT FTA',9,'[
  {"code":"vat-1","label":"Rapprochement déclarations VAT vs comptabilité","mandatory":true,"evidence":true},
  {"code":"vat-2","label":"Contrôle des taux appliqués (5% / 0% / exonéré)","mandatory":true,"evidence":false},
  {"code":"vat-3","label":"Justificatifs des opérations zero-rated / exempt","mandatory":true,"evidence":true},
  {"code":"vat-4","label":"Contrôle du Reverse Charge Mechanism","mandatory":true,"evidence":false},
  {"code":"vat-5","label":"Rapprochement avec le portail FTA","mandatory":true,"evidence":true}
]'::jsonb),
('uae','ct','Fiscal — Corporate Tax & QFZP',10,'[
  {"code":"ct-1","label":"Vérification éligibilité QFZP (Qualifying Free Zone Person)","mandatory":true,"evidence":true},
  {"code":"ct-2","label":"Calcul du Qualifying Income vs Non-Qualifying","mandatory":true,"evidence":true},
  {"code":"ct-3","label":"Test de substance économique","mandatory":true,"evidence":true},
  {"code":"ct-4","label":"Calcul du Corporate Tax (9% au-delà du seuil)","mandatory":true,"evidence":false},
  {"code":"ct-5","label":"Contrôle des transactions intra-groupe (Transfer Pricing)","mandatory":true,"evidence":true}
]'::jsonb),
('uae','autres','Autres charges & produits',11,'[
  {"code":"aut-1","label":"Revue analytique des principaux postes","mandatory":true,"evidence":false},
  {"code":"aut-2","label":"Justification des variations significatives N/N-1","mandatory":true,"evidence":false}
]'::jsonb),
('uae','engagements','Engagements hors-bilan & annexes',12,'[
  {"code":"eng-1","label":"Inventaire des cautions et garanties données","mandatory":true,"evidence":true},
  {"code":"eng-2","label":"Engagements de loyers (IFRS 16 si applicable)","mandatory":false,"evidence":true},
  {"code":"eng-3","label":"Litiges en cours","mandatory":true,"evidence":false}
]'::jsonb),
('uae','cloture','Clôture & revue analytique finale',13,'[
  {"code":"clo-1","label":"Revue analytique du compte de résultat","mandatory":true,"evidence":false},
  {"code":"clo-2","label":"Revue analytique du bilan","mandatory":true,"evidence":false},
  {"code":"clo-3","label":"Note de synthèse de révision","mandatory":true,"evidence":true},
  {"code":"clo-4","label":"Validation finale par l''associé","mandatory":true,"evidence":false}
]'::jsonb);
