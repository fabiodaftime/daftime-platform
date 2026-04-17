export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string
          currency: string
          fiscal_year_start: number
          id: string
          layout_type: Database["public"]["Enums"]["dashboard_layout"]
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          fiscal_year_start?: number
          id?: string
          layout_type?: Database["public"]["Enums"]["dashboard_layout"]
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          fiscal_year_start?: number
          id?: string
          layout_type?: Database["public"]["Enums"]["dashboard_layout"]
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      dashboard_comments: {
        Row: {
          author_name: string
          company_id: string
          content: string
          created_at: string
          id: string
          section: string
          user_id: string
        }
        Insert: {
          author_name: string
          company_id: string
          content: string
          created_at?: string
          id?: string
          section?: string
          user_id: string
        }
        Update: {
          author_name?: string
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          section?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_comments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_configs: {
        Row: {
          company_id: string
          config_key: string
          config_value: Json
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          config_key: string
          config_value?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          config_key?: string
          config_value?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      monthly_expenses: {
        Row: {
          amount_actual: number
          amount_budget: number
          amount_prior_year: number
          category_id: string
          created_at: string
          id: string
          monthly_financial_id: string
        }
        Insert: {
          amount_actual?: number
          amount_budget?: number
          amount_prior_year?: number
          category_id: string
          created_at?: string
          id?: string
          monthly_financial_id: string
        }
        Update: {
          amount_actual?: number
          amount_budget?: number
          amount_prior_year?: number
          category_id?: string
          created_at?: string
          id?: string
          monthly_financial_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_expenses_monthly_financial_id_fkey"
            columns: ["monthly_financial_id"]
            isOneToOne: false
            referencedRelation: "monthly_financials"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_financials: {
        Row: {
          cash_balance: number
          company_id: string
          created_at: string
          fx_rate: number | null
          id: string
          month: number
          revenue_actual: number
          revenue_budget: number
          revenue_prior_year: number
          updated_at: string
          year: number
        }
        Insert: {
          cash_balance?: number
          company_id: string
          created_at?: string
          fx_rate?: number | null
          id?: string
          month: number
          revenue_actual?: number
          revenue_budget?: number
          revenue_prior_year?: number
          updated_at?: string
          year: number
        }
        Update: {
          cash_balance?: number
          company_id?: string
          created_at?: string
          fx_rate?: number | null
          id?: string
          month?: number
          revenue_actual?: number
          revenue_budget?: number
          revenue_prior_year?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_financials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      revision_anomalies: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          credit_account: string | null
          cycle_id: string
          debit_account: string | null
          description: string
          id: string
          proposed_adjustment_amount: number | null
          resolved_at: string | null
          revision_file_id: string
          severity: Database["public"]["Enums"]["revision_anomaly_severity"]
          status: Database["public"]["Enums"]["revision_anomaly_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          credit_account?: string | null
          cycle_id: string
          debit_account?: string | null
          description: string
          id?: string
          proposed_adjustment_amount?: number | null
          resolved_at?: string | null
          revision_file_id: string
          severity?: Database["public"]["Enums"]["revision_anomaly_severity"]
          status?: Database["public"]["Enums"]["revision_anomaly_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          credit_account?: string | null
          cycle_id?: string
          debit_account?: string | null
          description?: string
          id?: string
          proposed_adjustment_amount?: number | null
          resolved_at?: string | null
          revision_file_id?: string
          severity?: Database["public"]["Enums"]["revision_anomaly_severity"]
          status?: Database["public"]["Enums"]["revision_anomaly_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_anomalies_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "revision_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revision_anomalies_revision_file_id_fkey"
            columns: ["revision_file_id"]
            isOneToOne: false
            referencedRelation: "revision_files"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_attachments: {
        Row: {
          checklist_item_id: string | null
          cycle_id: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          revision_file_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          checklist_item_id?: string | null
          cycle_id?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          revision_file_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          checklist_item_id?: string | null
          cycle_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          revision_file_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_attachments_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "revision_checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revision_attachments_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "revision_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revision_attachments_revision_file_id_fkey"
            columns: ["revision_file_id"]
            isOneToOne: false
            referencedRelation: "revision_files"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_audit_log: {
        Row: {
          action: string
          actor_id: string
          actor_name: string | null
          created_at: string
          id: string
          payload: Json | null
          revision_file_id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id: string
          actor_name?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          revision_file_id: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          actor_name?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          revision_file_id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revision_audit_log_revision_file_id_fkey"
            columns: ["revision_file_id"]
            isOneToOne: false
            referencedRelation: "revision_files"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_checklist_items: {
        Row: {
          created_at: string
          cycle_id: string
          description: string | null
          done_at: string | null
          done_by: string | null
          evidence_required: boolean
          id: string
          is_mandatory: boolean
          item_code: string
          label: string
          note: string | null
          order_index: number
          status: Database["public"]["Enums"]["revision_checklist_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          cycle_id: string
          description?: string | null
          done_at?: string | null
          done_by?: string | null
          evidence_required?: boolean
          id?: string
          is_mandatory?: boolean
          item_code: string
          label: string
          note?: string | null
          order_index?: number
          status?: Database["public"]["Enums"]["revision_checklist_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          cycle_id?: string
          description?: string | null
          done_at?: string | null
          done_by?: string | null
          evidence_required?: boolean
          id?: string
          is_mandatory?: boolean
          item_code?: string
          label?: string
          note?: string | null
          order_index?: number
          status?: Database["public"]["Enums"]["revision_checklist_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_checklist_items_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "revision_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_comments: {
        Row: {
          author_id: string
          author_name: string
          body: string
          checklist_item_id: string | null
          created_at: string
          cycle_id: string | null
          id: string
          is_review_note: boolean
          parent_id: string | null
          resolved: boolean
          revision_file_id: string
        }
        Insert: {
          author_id: string
          author_name: string
          body: string
          checklist_item_id?: string | null
          created_at?: string
          cycle_id?: string | null
          id?: string
          is_review_note?: boolean
          parent_id?: string | null
          resolved?: boolean
          revision_file_id: string
        }
        Update: {
          author_id?: string
          author_name?: string
          body?: string
          checklist_item_id?: string | null
          created_at?: string
          cycle_id?: string | null
          id?: string
          is_review_note?: boolean
          parent_id?: string | null
          resolved?: boolean
          revision_file_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_comments_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "revision_checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revision_comments_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "revision_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revision_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "revision_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revision_comments_revision_file_id_fkey"
            columns: ["revision_file_id"]
            isOneToOne: false
            referencedRelation: "revision_files"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_cycles: {
        Row: {
          assigned_to: string | null
          closing_balance: number | null
          comments: string | null
          created_at: string
          cycle_code: string
          cycle_name: string
          id: string
          opening_balance: number | null
          order_index: number
          progress_pct: number
          revision_file_id: string
          status: Database["public"]["Enums"]["revision_cycle_status"]
          updated_at: string
          variance: number | null
          variance_pct: number | null
        }
        Insert: {
          assigned_to?: string | null
          closing_balance?: number | null
          comments?: string | null
          created_at?: string
          cycle_code: string
          cycle_name: string
          id?: string
          opening_balance?: number | null
          order_index?: number
          progress_pct?: number
          revision_file_id: string
          status?: Database["public"]["Enums"]["revision_cycle_status"]
          updated_at?: string
          variance?: number | null
          variance_pct?: number | null
        }
        Update: {
          assigned_to?: string | null
          closing_balance?: number | null
          comments?: string | null
          created_at?: string
          cycle_code?: string
          cycle_name?: string
          id?: string
          opening_balance?: number | null
          order_index?: number
          progress_pct?: number
          revision_file_id?: string
          status?: Database["public"]["Enums"]["revision_cycle_status"]
          updated_at?: string
          variance?: number | null
          variance_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "revision_cycles_revision_file_id_fkey"
            columns: ["revision_file_id"]
            isOneToOne: false
            referencedRelation: "revision_files"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_entities: {
        Row: {
          code: string
          company_id: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          jurisdiction: Database["public"]["Enums"]["revision_jurisdiction"]
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          jurisdiction?: Database["public"]["Enums"]["revision_jurisdiction"]
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          jurisdiction?: Database["public"]["Enums"]["revision_jurisdiction"]
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_entities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_files: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          deadline: string | null
          entity_id: string | null
          fiscal_year: number
          id: string
          jurisdiction: Database["public"]["Enums"]["revision_jurisdiction"]
          period_end: string
          period_start: string
          reviewed_by: string | null
          status: Database["public"]["Enums"]["revision_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          entity_id?: string | null
          fiscal_year: number
          id?: string
          jurisdiction?: Database["public"]["Enums"]["revision_jurisdiction"]
          period_end: string
          period_start: string
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["revision_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          entity_id?: string | null
          fiscal_year?: number
          id?: string
          jurisdiction?: Database["public"]["Enums"]["revision_jurisdiction"]
          period_end?: string
          period_start?: string
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["revision_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_files_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revision_files_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "revision_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_lead_schedules: {
        Row: {
          account_label: string
          account_number: string
          created_at: string
          cycle_id: string
          id: string
          justification_note: string | null
          justified: boolean
          n_balance: number
          n1_balance: number
          order_index: number
          updated_at: string
          variance_amount: number | null
          variance_pct: number | null
        }
        Insert: {
          account_label: string
          account_number: string
          created_at?: string
          cycle_id: string
          id?: string
          justification_note?: string | null
          justified?: boolean
          n_balance?: number
          n1_balance?: number
          order_index?: number
          updated_at?: string
          variance_amount?: number | null
          variance_pct?: number | null
        }
        Update: {
          account_label?: string
          account_number?: string
          created_at?: string
          cycle_id?: string
          id?: string
          justification_note?: string | null
          justified?: boolean
          n_balance?: number
          n1_balance?: number
          order_index?: number
          updated_at?: string
          variance_amount?: number | null
          variance_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "revision_lead_schedules_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "revision_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_templates: {
        Row: {
          created_at: string
          cycle_code: string
          cycle_name: string
          default_checklist_items: Json
          id: string
          is_active: boolean
          jurisdiction: Database["public"]["Enums"]["revision_jurisdiction"]
          order_index: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          cycle_code: string
          cycle_name: string
          default_checklist_items?: Json
          id?: string
          is_active?: boolean
          jurisdiction: Database["public"]["Enums"]["revision_jurisdiction"]
          order_index?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          cycle_code?: string
          cycle_name?: string
          default_checklist_items?: Json
          id?: string
          is_active?: boolean
          jurisdiction?: Database["public"]["Enums"]["revision_jurisdiction"]
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_company_access: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      has_revision_file_access: {
        Args: { _file_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "client_admin" | "client_viewer"
      dashboard_layout:
        | "cw_partners"
        | "bocuse"
        | "lle_education"
        | "default"
        | "labarile"
        | "richissime"
        | "cwp_pl_2025"
        | "nowmade"
        | "prime_circle"
        | "prime_circle_agency"
        | "digit"
        | "prime_circle_group"
        | "nexus_test"
        | "hotel_x"
        | "skalis"
      revision_anomaly_severity: "low" | "medium" | "high" | "blocking"
      revision_anomaly_status: "open" | "in_progress" | "resolved" | "accepted"
      revision_checklist_status: "todo" | "done" | "na" | "anomaly"
      revision_cycle_status:
        | "not_started"
        | "in_progress"
        | "in_review"
        | "validated"
        | "anomaly"
      revision_jurisdiction: "uae" | "france" | "portugal"
      revision_status:
        | "todo"
        | "in_progress"
        | "in_review"
        | "validated"
        | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "client_admin", "client_viewer"],
      dashboard_layout: [
        "cw_partners",
        "bocuse",
        "lle_education",
        "default",
        "labarile",
        "richissime",
        "cwp_pl_2025",
        "nowmade",
        "prime_circle",
        "prime_circle_agency",
        "digit",
        "prime_circle_group",
        "nexus_test",
        "hotel_x",
        "skalis",
      ],
      revision_anomaly_severity: ["low", "medium", "high", "blocking"],
      revision_anomaly_status: ["open", "in_progress", "resolved", "accepted"],
      revision_checklist_status: ["todo", "done", "na", "anomaly"],
      revision_cycle_status: [
        "not_started",
        "in_progress",
        "in_review",
        "validated",
        "anomaly",
      ],
      revision_jurisdiction: ["uae", "france", "portugal"],
      revision_status: [
        "todo",
        "in_progress",
        "in_review",
        "validated",
        "closed",
      ],
    },
  },
} as const
