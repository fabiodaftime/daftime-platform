export type RevisionStatus = 'todo' | 'in_progress' | 'in_review' | 'validated' | 'closed';
export type RevisionCycleStatus = 'not_started' | 'in_progress' | 'in_review' | 'validated' | 'anomaly';
export type RevisionChecklistStatus = 'todo' | 'done' | 'na' | 'anomaly';
export type RevisionAnomalySeverity = 'low' | 'medium' | 'high' | 'blocking';
export type RevisionAnomalyStatus = 'open' | 'in_progress' | 'resolved' | 'accepted';
export type RevisionJurisdiction = 'uae' | 'france' | 'portugal';

export interface RevisionEntity {
  id: string;
  company_id: string;
  code: string;
  name: string;
  jurisdiction: RevisionJurisdiction;
}

export interface RevisionFile {
  id: string;
  company_id: string;
  entity_id: string | null;
  fiscal_year: number;
  period_start: string;
  period_end: string;
  jurisdiction: RevisionJurisdiction;
  status: RevisionStatus;
  assigned_to: string | null;
  reviewed_by: string | null;
  deadline: string | null;
  created_at: string;
}

export interface RevisionCycle {
  id: string;
  revision_file_id: string;
  cycle_code: string;
  cycle_name: string;
  status: RevisionCycleStatus;
  progress_pct: number;
  opening_balance: number | null;
  closing_balance: number | null;
  variance: number | null;
  variance_pct: number | null;
  comments: string | null;
  order_index: number;
}

export interface RevisionChecklistItem {
  id: string;
  cycle_id: string;
  item_code: string;
  label: string;
  description: string | null;
  is_mandatory: boolean;
  status: RevisionChecklistStatus;
  done_by: string | null;
  done_at: string | null;
  evidence_required: boolean;
  note: string | null;
  order_index: number;
}

export interface RevisionLeadSchedule {
  id: string;
  cycle_id: string;
  account_number: string;
  account_label: string;
  n_balance: number;
  n1_balance: number;
  variance_amount: number;
  variance_pct: number | null;
  justified: boolean;
  justification_note: string | null;
}

export interface RevisionAnomaly {
  id: string;
  cycle_id: string;
  revision_file_id: string;
  severity: RevisionAnomalySeverity;
  description: string;
  proposed_adjustment_amount: number | null;
  debit_account: string | null;
  credit_account: string | null;
  status: RevisionAnomalyStatus;
  created_at: string;
}

export interface RevisionComment {
  id: string;
  revision_file_id: string;
  cycle_id: string | null;
  author_id: string;
  author_name: string;
  body: string;
  is_review_note: boolean;
  resolved: boolean;
  created_at: string;
}

export interface RevisionTemplate {
  id: string;
  jurisdiction: RevisionJurisdiction;
  cycle_code: string;
  cycle_name: string;
  order_index: number;
  default_checklist_items: Array<{
    code: string;
    label: string;
    mandatory: boolean;
    evidence: boolean;
  }>;
}
