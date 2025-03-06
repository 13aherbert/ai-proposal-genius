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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_user_role: {
        Args: {
          _user_id: string
          _role: string
          _created_by: string
        }
        Returns: string
      }
      check_beta_tester_role: {
        Args: {
          user_id_param: string
        }
        Returns: boolean
      }
      check_existing_role: {
        Args: {
          _user_id: string
          _role: string
        }
        Returns: boolean
      }
      check_project_limit: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      check_user_role: {
        Args: {
          user_id_param: string
          role_param: string
        }
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
      has_role: {
        Args: {
          _user_id: string
          _role: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_direct: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      remove_user_role: {
        Args: {
          _user_id: string
          _role: string
        }
        Returns: boolean
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
