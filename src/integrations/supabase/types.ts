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
      compliance_reports: {
        Row: {
          created_at: string | null
          generated_by: string
          id: string
          organization_id: string | null
          report_data: Json
          report_type: string
          report_url: string | null
        }
        Insert: {
          created_at?: string | null
          generated_by: string
          id?: string
          organization_id?: string | null
          report_data: Json
          report_type: string
          report_url?: string | null
        }
        Update: {
          created_at?: string | null
          generated_by?: string
          id?: string
          organization_id?: string | null
          report_data?: Json
          report_type?: string
          report_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      data_export_requests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          expires_at: string | null
          export_url: string | null
          id: string
          organization_id: string | null
          processed_by: string | null
          request_type: string
          requested_by: string
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          export_url?: string | null
          id?: string
          organization_id?: string | null
          processed_by?: string | null
          request_type: string
          requested_by: string
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          export_url?: string | null
          id?: string
          organization_id?: string | null
          processed_by?: string | null
          request_type?: string
          requested_by?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_export_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          subject: string
          template_type: string
          text_content: string | null
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          subject: string
          template_type: string
          text_content?: string | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          subject?: string
          template_type?: string
          text_content?: string | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      organization_analytics: {
        Row: {
          additional_data: Json | null
          created_at: string | null
          id: string
          metric_category: string
          metric_date: string
          metric_type: string
          metric_value: number
          organization_id: string
        }
        Insert: {
          additional_data?: Json | null
          created_at?: string | null
          id?: string
          metric_category: string
          metric_date: string
          metric_type: string
          metric_value: number
          organization_id: string
        }
        Update: {
          additional_data?: Json | null
          created_at?: string | null
          id?: string
          metric_category?: string
          metric_date?: string
          metric_type?: string
          metric_value?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_api_keys: {
        Row: {
          api_key_hash: string
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_name: string
          last_used_at: string | null
          organization_id: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          api_key_hash: string
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_name: string
          last_used_at?: string | null
          organization_id: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          api_key_hash?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_name?: string
          last_used_at?: string | null
          organization_id?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_billing_history: {
        Row: {
          amount: number
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string | null
          currency: string | null
          id: string
          organization_id: string
          status: string
          stripe_invoice_id: string | null
          subscription_id: string
        }
        Insert: {
          amount: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          organization_id: string
          status: string
          stripe_invoice_id?: string | null
          subscription_id: string
        }
        Update: {
          amount?: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          organization_id?: string
          status?: string
          stripe_invoice_id?: string | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_billing_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_billing_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "organization_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_branding: {
        Row: {
          accent_color: string | null
          background_color: string | null
          brand_name: string | null
          created_at: string | null
          custom_css: string | null
          favicon_url: string | null
          font_family: string | null
          id: string
          logo_url: string | null
          organization_id: string
          primary_color: string | null
          privacy_policy_url: string | null
          secondary_color: string | null
          support_email: string | null
          tagline: string | null
          terms_of_service_url: string | null
          text_color: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          brand_name?: string | null
          created_at?: string | null
          custom_css?: string | null
          favicon_url?: string | null
          font_family?: string | null
          id?: string
          logo_url?: string | null
          organization_id: string
          primary_color?: string | null
          privacy_policy_url?: string | null
          secondary_color?: string | null
          support_email?: string | null
          tagline?: string | null
          terms_of_service_url?: string | null
          text_color?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          brand_name?: string | null
          created_at?: string | null
          custom_css?: string | null
          favicon_url?: string | null
          font_family?: string | null
          id?: string
          logo_url?: string | null
          organization_id?: string
          primary_color?: string | null
          privacy_policy_url?: string | null
          secondary_color?: string | null
          support_email?: string | null
          tagline?: string | null
          terms_of_service_url?: string | null
          text_color?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_branding_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          is_primary: boolean | null
          is_verified: boolean | null
          organization_id: string
          ssl_certificate_status: string | null
          updated_at: string | null
          verification_token: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          organization_id: string
          ssl_certificate_status?: string | null
          updated_at?: string | null
          verification_token?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          organization_id?: string
          ssl_certificate_status?: string | null
          updated_at?: string | null
          verification_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_domains_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_features: {
        Row: {
          configuration: Json | null
          created_at: string | null
          feature_name: string
          id: string
          is_enabled: boolean | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          configuration?: Json | null
          created_at?: string | null
          feature_name: string
          id?: string
          is_enabled?: boolean | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          configuration?: Json | null
          created_at?: string | null
          feature_name?: string
          id?: string
          is_enabled?: boolean | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_features_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_insights: {
        Row: {
          action_suggested: string | null
          confidence_score: number | null
          created_at: string | null
          id: string
          insight_category: string
          insight_data: Json
          insight_description: string
          insight_title: string
          insight_type: string
          is_actionable: boolean | null
          is_dismissed: boolean | null
          organization_id: string
        }
        Insert: {
          action_suggested?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          insight_category: string
          insight_data: Json
          insight_description: string
          insight_title: string
          insight_type: string
          is_actionable?: boolean | null
          is_dismissed?: boolean | null
          organization_id: string
        }
        Update: {
          action_suggested?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          insight_category?: string
          insight_data?: Json
          insight_description?: string
          insight_title?: string
          insight_type?: string
          is_actionable?: boolean | null
          is_dismissed?: boolean | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_insights_organization_id_fkey"
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
      organization_member_activity: {
        Row: {
          activity_type: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          member_id: string
          organization_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          member_id: string
          organization_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          member_id?: string
          organization_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_member_activity_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_member_activity_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_member_invitations: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          expires_at: string | null
          id: string
          invitation_token: string
          invited_by: string | null
          organization_id: string | null
          permissions: Json | null
          role: Database["public"]["Enums"]["organization_role_type"]
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invitation_token: string
          invited_by?: string | null
          organization_id?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["organization_role_type"]
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invitation_token?: string
          invited_by?: string | null
          organization_id?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["organization_role_type"]
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_member_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          department: string | null
          id: string
          invitation_expires_at: string | null
          invitation_token: string | null
          invited_at: string | null
          joined_at: string
          last_active_at: string | null
          last_activity_at: string | null
          organization_id: string
          permissions: Json | null
          role: Database["public"]["Enums"]["organization_role_type"]
          status: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          department?: string | null
          id?: string
          invitation_expires_at?: string | null
          invitation_token?: string | null
          invited_at?: string | null
          joined_at?: string
          last_active_at?: string | null
          last_activity_at?: string | null
          organization_id: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["organization_role_type"]
          status?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          department?: string | null
          id?: string
          invitation_expires_at?: string | null
          invitation_token?: string | null
          invited_at?: string | null
          joined_at?: string
          last_active_at?: string | null
          last_activity_at?: string | null
          organization_id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["organization_role_type"]
          status?: string | null
          title?: string | null
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
      organization_report_outputs: {
        Row: {
          expires_at: string | null
          file_size: number | null
          file_url: string | null
          generated_at: string | null
          generated_by: string
          id: string
          organization_id: string
          output_format: string
          report_id: string
        }
        Insert: {
          expires_at?: string | null
          file_size?: number | null
          file_url?: string | null
          generated_at?: string | null
          generated_by: string
          id?: string
          organization_id: string
          output_format: string
          report_id: string
        }
        Update: {
          expires_at?: string | null
          file_size?: number | null
          file_url?: string | null
          generated_at?: string | null
          generated_by?: string
          id?: string
          organization_id?: string
          output_format?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_report_outputs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_report_outputs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "organization_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_reports: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          is_automated: boolean | null
          last_generated_at: string | null
          organization_id: string
          report_config: Json
          report_name: string
          report_type: string
          schedule_config: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          is_automated?: boolean | null
          last_generated_at?: string | null
          organization_id: string
          report_config: Json
          report_name: string
          report_type: string
          schedule_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          is_automated?: boolean | null
          last_generated_at?: string | null
          organization_id?: string
          report_config?: Json
          report_name?: string
          report_type?: string
          schedule_config?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_sso_config: {
        Row: {
          configuration: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          provider_name: string
          provider_type: string
          updated_at: string | null
        }
        Insert: {
          configuration: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          provider_name: string
          provider_type: string
          updated_at?: string | null
        }
        Update: {
          configuration?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          provider_name?: string
          provider_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_sso_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_subscriptions: {
        Row: {
          billing_address: Json | null
          billing_contact_email: string | null
          billing_cycle: string | null
          billing_model: string | null
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          custom_pricing: Json | null
          features: Json | null
          id: string
          max_seats: number | null
          member_limit: number
          organization_id: string
          plan_type: string
          project_limit: number
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_id: string
          trial_ends_at: string | null
          updated_at: string
          used_seats: number | null
        }
        Insert: {
          billing_address?: Json | null
          billing_contact_email?: string | null
          billing_cycle?: string | null
          billing_model?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          custom_pricing?: Json | null
          features?: Json | null
          id?: string
          max_seats?: number | null
          member_limit?: number
          organization_id: string
          plan_type?: string
          project_limit?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_id?: string
          trial_ends_at?: string | null
          updated_at?: string
          used_seats?: number | null
        }
        Update: {
          billing_address?: Json | null
          billing_contact_email?: string | null
          billing_cycle?: string | null
          billing_model?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          custom_pricing?: Json | null
          features?: Json | null
          id?: string
          max_seats?: number | null
          member_limit?: number
          organization_id?: string
          plan_type?: string
          project_limit?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_id?: string
          trial_ends_at?: string | null
          updated_at?: string
          used_seats?: number | null
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
      organization_usage_metrics: {
        Row: {
          created_at: string | null
          id: string
          metric_date: string
          metric_type: string
          metric_value: number
          organization_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_date: string
          metric_type: string
          metric_value: number
          organization_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_date?: string
          metric_type?: string
          metric_value?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_usage_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          custom_domain_enabled: boolean | null
          enterprise_features: Json | null
          id: string
          is_white_label: boolean | null
          max_projects: number | null
          max_users: number | null
          name: string
          settings: Json | null
          slug: string
          sso_enabled: boolean | null
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_domain_enabled?: boolean | null
          enterprise_features?: Json | null
          id?: string
          is_white_label?: boolean | null
          max_projects?: number | null
          max_users?: number | null
          name: string
          settings?: Json | null
          slug: string
          sso_enabled?: boolean | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_domain_enabled?: boolean | null
          enterprise_features?: Json | null
          id?: string
          is_white_label?: boolean | null
          max_projects?: number | null
          max_users?: number | null
          name?: string
          settings?: Json | null
          slug?: string
          sso_enabled?: boolean | null
          subscription_tier?: string | null
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
      security_events_log: {
        Row: {
          created_at: string | null
          event_details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          organization_id: string | null
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          organization_id?: string | null
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          organization_id?: string | null
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plan_templates: {
        Row: {
          base_price: number | null
          billing_model: string
          created_at: string | null
          description: string | null
          display_name: string
          features: Json | null
          id: string
          is_enterprise: boolean | null
          is_white_label: boolean | null
          name: string
          price_per_seat: number | null
          project_limit: number | null
          seat_limit: number | null
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          billing_model?: string
          created_at?: string | null
          description?: string | null
          display_name: string
          features?: Json | null
          id?: string
          is_enterprise?: boolean | null
          is_white_label?: boolean | null
          name: string
          price_per_seat?: number | null
          project_limit?: number | null
          seat_limit?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          billing_model?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          features?: Json | null
          id?: string
          is_enterprise?: boolean | null
          is_white_label?: boolean | null
          name?: string
          price_per_seat?: number | null
          project_limit?: number | null
          seat_limit?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_usage_logs: {
        Row: {
          billing_period_end: string
          billing_period_start: string
          id: string
          organization_id: string | null
          recorded_at: string | null
          subscription_id: string | null
          usage_amount: number
          usage_type: string
        }
        Insert: {
          billing_period_end: string
          billing_period_start: string
          id?: string
          organization_id?: string | null
          recorded_at?: string | null
          subscription_id?: string | null
          usage_amount?: number
          usage_type: string
        }
        Update: {
          billing_period_end?: string
          billing_period_start?: string
          id?: string
          organization_id?: string | null
          recorded_at?: string | null
          subscription_id?: string | null
          usage_amount?: number
          usage_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_usage_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_usage_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "organization_subscriptions"
            referencedColumns: ["id"]
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
      organization_metrics_summary: {
        Row: {
          active_users: number | null
          avg_engagement: number | null
          metric_date: string | null
          organization_id: string | null
          projects_created: number | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
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
      aggregate_daily_analytics: {
        Args: { org_id: string; target_date: string }
        Returns: undefined
      }
      assign_user_role: {
        Args: { _user_id: string; _role: string; _created_by: string }
        Returns: string
      }
      calculate_user_engagement_score: {
        Args: { org_id: string; user_id_param: string; date_param: string }
        Returns: number
      }
      can_manage_organization: {
        Args: { user_id_param: string; org_id_param: string }
        Returns: boolean
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
      check_organization_admin: {
        Args: { user_id_param: string; org_id_param: string }
        Returns: boolean
      }
      check_organization_limits: {
        Args: { org_id_param: string; limit_type: string }
        Returns: boolean
      }
      check_organization_membership: {
        Args: { user_id_param: string; org_id_param: string }
        Returns: boolean
      }
      check_organization_seat_limit: {
        Args: { org_id: string }
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
      get_organization_by_domain: {
        Args: { domain_param: string }
        Returns: {
          organization_id: string
          organization_name: string
          organization_slug: string
          is_white_label: boolean
          branding: Json
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
      get_user_current_org: {
        Args: Record<PropertyKey, never>
        Returns: string
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
      get_user_organization_permissions: {
        Args: { user_id_param: string; org_id_param: string }
        Returns: Json
      }
      get_user_organizations: {
        Args: Record<PropertyKey, never>
        Returns: {
          organization_id: string
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
      is_organization_member: {
        Args: { org_id: string; user_id_param: string }
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
      log_organization_activity: {
        Args: {
          org_id: string
          user_id_param: string
          activity_type_param: string
          details_param?: Json
          ip_address_param?: unknown
          user_agent_param?: string
        }
        Returns: string
      }
      log_security_event: {
        Args:
          | {
              event_type_param: string
              target_user_id_param?: string
              details_param?: Json
            }
          | {
              org_id: string
              user_id_param: string
              event_type_param: string
              event_details_param?: Json
              ip_address_param?: unknown
              user_agent_param?: string
              session_id_param?: string
              risk_level_param?: string
            }
        Returns: string
      }
      migrate_user_subscriptions_to_organizations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      organization_has_feature: {
        Args: { org_id: string; feature_name_param: string }
        Returns: boolean
      }
      remove_user_role: {
        Args: { _user_id: string; _role: string }
        Returns: boolean
      }
      request_data_export: {
        Args: {
          org_id: string
          target_user_id: string
          request_type_param?: string
        }
        Returns: string
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
      update_organization_usage_metric: {
        Args: {
          org_id: string
          metric_type_param: string
          increment_value?: number
        }
        Returns: undefined
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
      organization_role_type:
        | "owner"
        | "admin"
        | "manager"
        | "editor"
        | "viewer"
        | "billing_admin"
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
      organization_role_type: [
        "owner",
        "admin",
        "manager",
        "editor",
        "viewer",
        "billing_admin",
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
