export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
      activity_feed: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          id: string
          organization_id: string | null
          resource_id: string | null
          resource_type: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          organization_id?: string | null
          resource_id?: string | null
          resource_type: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_rate_limits: {
        Row: {
          action_count: number | null
          action_type: string
          admin_user_id: string
          created_at: string | null
          id: string
          window_start: string | null
        }
        Insert: {
          action_count?: number | null
          action_type: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          window_start?: string | null
        }
        Update: {
          action_count?: number | null
          action_type?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          window_start?: string | null
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          parsed_content?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          organization_id: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          organization_id: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          organization_id?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          joined_at: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          features: Json | null
          id: string
          member_limit: number
          organization_id: string
          plan_type: string
          project_limit: number
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_id: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          features?: Json | null
          id?: string
          member_limit?: number
          organization_id: string
          plan_type?: string
          project_limit?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_id?: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          features?: Json | null
          id?: string
          member_limit?: number
          organization_id?: string
          plan_type?: string
          project_limit?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      orphaned_records_backup: {
        Row: {
          created_at: string | null
          id: string
          reason: string
          record_data: Json
          record_id: string
          table_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason: string
          record_data: Json
          record_id: string
          table_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string
          record_data?: Json
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      password_reset_attempts: {
        Row: {
          attempt_time: string | null
          email: string
          id: string
          ip_address: unknown | null
          success: boolean | null
        }
        Insert: {
          attempt_time?: string | null
          email: string
          id?: string
          ip_address?: unknown | null
          success?: boolean | null
        }
        Update: {
          attempt_time?: string | null
          email?: string
          id?: string
          ip_address?: unknown | null
          success?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          business_name: string | null
          created_at: string
          current_organization_id: string | null
          first_name: string | null
          industry: Database["public"]["Enums"]["industry_type"] | null
          job_title: string | null
          last_name: string | null
          onboarding_segment: string | null
          organization_size:
            | Database["public"]["Enums"]["organization_size_type"]
            | null
          profile_id: string
          updated_at: string
          use_case: Database["public"]["Enums"]["use_case_type"] | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          business_name?: string | null
          created_at?: string
          current_organization_id?: string | null
          first_name?: string | null
          industry?: Database["public"]["Enums"]["industry_type"] | null
          job_title?: string | null
          last_name?: string | null
          onboarding_segment?: string | null
          organization_size?:
            | Database["public"]["Enums"]["organization_size_type"]
            | null
          profile_id: string
          updated_at?: string
          use_case?: Database["public"]["Enums"]["use_case_type"] | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          business_name?: string | null
          created_at?: string
          current_organization_id?: string | null
          first_name?: string | null
          industry?: Database["public"]["Enums"]["industry_type"] | null
          job_title?: string | null
          last_name?: string | null
          onboarding_segment?: string | null
          organization_size?:
            | Database["public"]["Enums"]["organization_size_type"]
            | null
          profile_id?: string
          updated_at?: string
          use_case?: Database["public"]["Enums"]["use_case_type"] | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_organization_id_fkey"
            columns: ["current_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_collaborators: {
        Row: {
          id: string
          invited_at: string
          invited_by: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_at?: string
          invited_by: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          invited_at?: string
          invited_by?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_collaborators_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
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
          is_shared: boolean | null
          last_update_at: string | null
          organization_id: string
          project_id: string
          proposal_outline: string | null
          rfp_file_path: string
          shared_with: string[] | null
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
          is_shared?: boolean | null
          last_update_at?: string | null
          organization_id: string
          project_id?: string
          proposal_outline?: string | null
          rfp_file_path: string
          shared_with?: string[] | null
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
          is_shared?: boolean | null
          last_update_at?: string | null
          organization_id?: string
          project_id?: string
          proposal_outline?: string | null
          rfp_file_path?: string
          shared_with?: string[] | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_sections: {
        Row: {
          content: string | null
          created_at: string
          organization_id: string
          project_id: string
          section_id: string
          section_title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          organization_id: string
          project_id: string
          section_id?: string
          section_title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          organization_id?: string
          project_id?: string
          section_id?: string
          section_title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_sections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_sections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          target_user_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      check_admin_rate_limit: {
        Args: {
          admin_id: string
          action_type: string
          max_actions?: number
          window_minutes?: number
        }
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
      check_password_reset_rate_limit: {
        Args: { email_param: string }
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
      check_system_admin_role: {
        Args: { user_id_param: string }
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
      create_default_organization_for_user: {
        Args: { user_id_param: string }
        Returns: string
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
      generate_organization_slug: {
        Args: { org_name: string }
        Returns: string
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
      get_all_users_with_organizations: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          first_name: string
          last_name: string
          business_name: string
          roles: string[]
          organization_id: string
          organization_name: string
          organization_role: string
          subscription_plan: string
          subscription_status: string
          created_at: string
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
      get_plan_limits: {
        Args: { plan_type_param: string }
        Returns: number
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
      get_user_current_organization: {
        Args: { user_id_param: string }
        Returns: string
      }
      get_user_details_for_admin: {
        Args: { target_user_id: string }
        Returns: {
          user_id: string
          email: string
          first_name: string
          last_name: string
          business_name: string
          industry: string
          organization_size: string
          use_case: string
          job_title: string
          roles: string[]
          organizations: Json
          subscription_info: Json
          project_count: number
          knowledge_entries_count: number
          created_at: string
          last_sign_in: string
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
      is_system_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_activity: {
        Args: {
          org_id: string
          user_id_param: string
          action_type_param: string
          resource_type_param: string
          resource_id_param?: string
          details_param?: Json
        }
        Returns: string
      }
      log_admin_action: {
        Args: {
          admin_user_id: string
          action_type: string
          target_user_id?: string
          details?: Json
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          event_type_param: string
          target_user_id_param?: string
          details_param?: Json
        }
        Returns: string
      }
      migrate_user_subscriptions_to_organizations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      remove_user_role: {
        Args: { _user_id: string; _role: string }
        Returns: boolean
      }
      switch_user_organization: {
        Args: { user_id_param: string; org_id_param: string }
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
      user_belongs_to_organization: {
        Args: { user_id_param: string; org_id_param: string }
        Returns: boolean
      }
      user_is_org_owner_or_admin: {
        Args: { user_id_param: string; org_id_param: string }
        Returns: boolean
      }
      validate_password_policy: {
        Args: { password: string }
        Returns: {
          is_valid: boolean
          errors: string[]
        }[]
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
      industry_type:
        | "technology"
        | "healthcare"
        | "finance"
        | "education"
        | "manufacturing"
        | "retail"
        | "consulting"
        | "real_estate"
        | "construction"
        | "government"
        | "non_profit"
        | "other"
      organization_size_type:
        | "solo"
        | "small_team"
        | "enterprise"
        | "white_label"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
      use_case_type:
        | "rfp_response"
        | "proposal_management"
        | "team_collaboration"
        | "enterprise_solution"
        | "white_label_integration"
        | "other"
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
      industry_type: [
        "technology",
        "healthcare",
        "finance",
        "education",
        "manufacturing",
        "retail",
        "consulting",
        "real_estate",
        "construction",
        "government",
        "non_profit",
        "other",
      ],
      organization_size_type: [
        "solo",
        "small_team",
        "enterprise",
        "white_label",
      ],
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
      ],
      use_case_type: [
        "rfp_response",
        "proposal_management",
        "team_collaboration",
        "enterprise_solution",
        "white_label_integration",
        "other",
      ],
    },
  },
} as const
