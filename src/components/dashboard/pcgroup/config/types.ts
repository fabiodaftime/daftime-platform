// Types miroirs des tables Supabase pcgroup_*

export type EntityCode = 'agency' | 'structuring' | 'digit' | 'spy' | 'comment' | string;

export interface PCGEntityRow {
  id: string;
  code: EntityCode;
  name: string;
  badge: string;
  gradient: string;
  css_class: string;
  pie_color: string;
  source_type: 'dashboard' | 'manual';
  display_order: number;
  is_active: boolean;
}

export interface PCGMonthRow {
  id: string;
  month_id: string;
  label: string;
  short_label: string;
  year: number;
  month_num: number;
  is_active: boolean;
  display_order: number;
}

export interface PCGRuleRow {
  id: string;
  month_id: string | null;
  reserves_pct: number;
  remontee_pct: number;
  maxence_pct: number;
  thibault_pct: number;
  florian_pct: number;
  will_in_thibault: number;
}

export interface PCGManualFactRow {
  id: string;
  month_id: string;
  entity_code: string;
  ca: number;
  charges: number;
  contribution: number;
  margin_pct: number;
  deals: number | null;
  warning: string | null;
}

export interface PCGHoldingFactRow {
  id: string;
  month_id: string;
  frais_total: number;
  frais_detail: { label: string; amount: number }[];
  apport_maxence: number;
}

export interface PCGIntercosCashRow {
  id: string;
  month_id: string;
  entity_code: string;
  amount_received: number;
}

export interface PCGroupConfig {
  entities: PCGEntityRow[];
  months: PCGMonthRow[];
  rules: PCGRuleRow[];
  manualFacts: PCGManualFactRow[];
  holdingFacts: PCGHoldingFactRow[];
  intercosCash: PCGIntercosCashRow[];
}

export const EMPTY_CONFIG: PCGroupConfig = {
  entities: [],
  months: [],
  rules: [],
  manualFacts: [],
  holdingFacts: [],
  intercosCash: [],
};
