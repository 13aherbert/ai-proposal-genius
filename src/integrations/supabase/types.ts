export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      _migration_history: {
        Row: {
          applied_at: string | null
          id: number
          name: string
        }
        Insert: {
          applied_at?: string | null
          id?: number
          name: string
        }
        Update: {
          applied_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      admin_role_checks: {
        Row: {
          check_time: string
          result: boolean
          user_id: string
        }
        Insert: {
          check_time: string
          result: boolean
          user_id: string
        }
        Update: {
          check_time?: string
          result?: boolean
          user_id?: string
        }
        Relationships: []
      }
      beta_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_email_sent: boolean | null
          invite_code: string
          invited_by: string
          status: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invitation_email_sent?: boolean | null
          invite_code: string
          invited_by: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_email_sent?: boolean | null
          invite_code?: string
          invited_by?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      beta_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_entries: {
        Row: {
          category: string
          content: string | null
          created_at: string
          entry_id: string
          file_path: string | null
          parsed_content: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          content?: string | null
          created_at?: string
          entry_id?: string
          file_path?: string | null
          parsed_content?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          entry_id?: string
          file_path?: string | null
          parsed_content?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          business_name: string | null
          created_at: string
          first_name: string | null
          industry: string | null
          last_name: string | null
          profile_id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          business_name?: string | null
          created_at?: string
          first_name?: string | null
          industry?: string | null
          last_name?: string | null
          profile_id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          business_name?: string | null
          created_at?: string
          first_name?: string | null
          industry?: string | null
          last_name?: string | null
          profile_id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          created_at: string
          document_id: string
          document_type: string
          file_name: string
          file_path: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id?: string
          document_type: string
          file_name: string
          file_path: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          document_type?: string
          file_name?: string
          file_path?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_documents_project_user_fkey"
            columns: ["project_id", "user_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id", "user_id"]
          },
        ]
      }
      projects: {
        Row: {
          analysis: string | null
          business_name: string | null
          client_name: string | null
          created_at: string
          deadline: string | null
          evaluation: string | null
          last_update_at: string | null
          project_id: string
          proposal_outline: string | null
          rfp_file_path: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis?: string | null
          business_name?: string | null
          client_name?: string | null
          created_at?: string
          deadline?: string | null
          evaluation?: string | null
          last_update_at?: string | null
          project_id?: string
          proposal_outline?: string | null
          rfp_file_path: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis?: string | null
          business_name?: string | null
          client_name?: string | null
          created_at?: string
          deadline?: string | null
          evaluation?: string | null
          last_update_at?: string | null
          project_id?: string
          proposal_outline?: string | null
          rfp_file_path?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proposal_sections: {
        Row: {
          content: string | null
          created_at: string
          project_id: string
          section_id: string
          section_title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          project_id: string
          section_id?: string
          section_title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          project_id?: string
          section_id?: string
          section_title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_sections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          features: Json | null
          plan_type: string
          project_limit: number | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          features?: Json | null
          plan_type: string
          project_limit?: number | null
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          features?: Json | null
          plan_type?: string
          project_limit?: number | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_status_cache: {
        Row: {
          has_user_role: boolean
          is_admin: boolean
          is_beta_tester: boolean
          last_updated: string
          project_limit: number | null
          subscription_plan: string | null
          subscription_status: string | null
          user_id: string
        }
        Insert: {
          has_user_role?: boolean
          is_admin?: boolean
          is_beta_tester?: boolean
          last_updated?: string
          project_limit?: number | null
          subscription_plan?: string | null
          subscription_status?: string | null
          user_id: string
        }
        Update: {
          has_user_role?: boolean
          is_admin?: boolean
          is_beta_tester?: boolean
          last_updated?: string
          project_limit?: number | null
          subscription_plan?: string | null
          subscription_status?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_user_cascade: {
        Args: { admin_id: string; target_user_id: string }
        Returns: boolean
      }
      admin_delete_user_roles: {
        Args: { admin_id: string; target_user_id: string }
        Returns: boolean
      }
      assign_user_role: {
        Args: { _user_id: string; _role: string; _created_by: string }
        Returns: string
      }
      cascade_delete_user_data: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      check_beta_tester_role: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      check_existing_role: {
        Args: { _user_id: string; _role: string }
        Returns: boolean
      }
      check_pending_invitation: {
        Args: { email_param: string }
        Returns: {
          id: string
          email: string
          invite_code: string
          invited_by: string
          status: string
          created_at: string
          accepted_at: string
          expires_at: string
          invitation_email_sent: boolean
        }[]
      }
      check_project_limit: {
        Args: { user_id: string }
        Returns: boolean
      }
      check_user_role: {
        Args: { user_id_param: string; role_param: string }
        Returns: boolean
      }
      check_user_status: {
        Args: { user_id_param: string }
        Returns: {
          is_admin: boolean
          is_beta_tester: boolean
          has_user_role: boolean
          subscription_status: string
          subscription_plan: string
          project_limit: number
        }[]
      }
      delete_user_as_admin: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      delete_user_roles_as_admin: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      direct_admin_check: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      get_all_user_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          user_id: string
          role: string
          created_at: string
          created_by: string
        }[]
      }
      get_all_user_roles_by_id: {
        Args: { user_id_param: string }
        Returns: {
          id: string
          user_id: string
          role: string
          created_at: string
          created_by: string
        }[]
      }
      get_beta_invitation_direct: {
        Args: { invitation_id_param: string }
        Returns: {
          id: string
          email: string
          invite_code: string
          invited_by: string
          status: string
          created_at: string
          accepted_at: string
          expires_at: string
          invitation_email_sent: boolean
        }[]
      }
      get_subscription_details: {
        Args: { user_id_param: string }
        Returns: {
          subscription_id: string
          status: string
          plan_type: string
          current_period_end: string
          project_limit: number
          features: Json
          stripe_customer_id: string
          stripe_subscription_id: string
          cancel_at_period_end: boolean
        }[]
      }
      get_user_permissions: {
        Args: { user_id_param: string }
        Returns: {
          is_admin: boolean
          is_beta_tester: boolean
          subscription_plan: string
          subscription_status: string
          features: Json
          project_limit: number
        }[]
      }
      has_role: {
        Args: { _user_id: string; _role: string }
        Returns: boolean
      }
      invite_beta_tester: {
        Args: { email_param: string; inviter_id: string }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_direct: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_for_delete: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      remove_user_role: {
        Args: { _user_id: string; _role: string }
        Returns: boolean
      }
      update_beta_invitation_email_sent: {
        Args: { invitation_id_param: string; sent_status: boolean }
        Returns: boolean
      }
      update_beta_invitation_status: {
        Args: {
          invitation_id_param: string
          status_param: string
          accepted_at_param: string
        }
        Returns: boolean
      }
      verify_invitation_code: {
        Args: { code_param: string }
        Returns: {
          id: string
          email: string
          invite_code: string
          invited_by: string
          status: string
          created_at: string
          accepted_at: string
          expires_at: string
          invitation_email_sent: boolean
        }[]
      }
    }
    Enums: {
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
      ],
    },
  },
} as const
