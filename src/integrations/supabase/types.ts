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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          permission_name: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_name: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_name?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_cache: {
        Row: {
          computed_at: string
          expires_at: string
          id: string
          metric_name: string
          metric_value: Json
        }
        Insert: {
          computed_at?: string
          expires_at: string
          id?: string
          metric_name: string
          metric_value: Json
        }
        Update: {
          computed_at?: string
          expires_at?: string
          id?: string
          metric_name?: string
          metric_value?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          timestamp: string
          user_id: string
        }
        Insert: {
          action: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          timestamp?: string
          user_id: string
        }
        Update: {
          action?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          is_material: boolean | null
          line_total: number
          quantity: number | null
          tax_rate_id: string | null
          unit_amount: number
          vat_amount: number | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          is_material?: boolean | null
          line_total: number
          quantity?: number | null
          tax_rate_id?: string | null
          unit_amount: number
          vat_amount?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          is_material?: boolean | null
          line_total?: number
          quantity?: number | null
          tax_rate_id?: string | null
          unit_amount?: number
          vat_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          client_signature_url: string | null
          client_signed_at: string | null
          created_at: string
          currency: string | null
          dwelling_age_years: number | null
          id: string
          invoice_number: string
          issued_at: string | null
          legal_invoice_number: string | null
          materials_percentage: number | null
          paid_at: string | null
          payment_intent_id: string | null
          place_of_supply: string | null
          property_area_sqm: number | null
          property_location: string | null
          quote_id: string
          quote_version_id: string | null
          reverse_charge_note: string | null
          service_fee_amount: number
          service_fee_percentage: number
          status: string
          stripe_invoice_id: string | null
          stripe_pdf_url: string | null
          subtotal_amount: number | null
          tax_point: string | null
          total_amount: number
          updated_at: string
          vat_amount: number | null
          vat_basis: string | null
          vat_rate: number | null
          vendor_id: string
          vendor_payout_amount: number
          vendor_signature_url: string | null
          vendor_signed_at: string | null
        }
        Insert: {
          client_id: string
          client_signature_url?: string | null
          client_signed_at?: string | null
          created_at?: string
          currency?: string | null
          dwelling_age_years?: number | null
          id?: string
          invoice_number: string
          issued_at?: string | null
          legal_invoice_number?: string | null
          materials_percentage?: number | null
          paid_at?: string | null
          payment_intent_id?: string | null
          place_of_supply?: string | null
          property_area_sqm?: number | null
          property_location?: string | null
          quote_id: string
          quote_version_id?: string | null
          reverse_charge_note?: string | null
          service_fee_amount: number
          service_fee_percentage?: number
          status?: string
          stripe_invoice_id?: string | null
          stripe_pdf_url?: string | null
          subtotal_amount?: number | null
          tax_point?: string | null
          total_amount: number
          updated_at?: string
          vat_amount?: number | null
          vat_basis?: string | null
          vat_rate?: number | null
          vendor_id: string
          vendor_payout_amount: number
          vendor_signature_url?: string | null
          vendor_signed_at?: string | null
        }
        Update: {
          client_id?: string
          client_signature_url?: string | null
          client_signed_at?: string | null
          created_at?: string
          currency?: string | null
          dwelling_age_years?: number | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          legal_invoice_number?: string | null
          materials_percentage?: number | null
          paid_at?: string | null
          payment_intent_id?: string | null
          place_of_supply?: string | null
          property_area_sqm?: number | null
          property_location?: string | null
          quote_id?: string
          quote_version_id?: string | null
          reverse_charge_note?: string | null
          service_fee_amount?: number
          service_fee_percentage?: number
          status?: string
          stripe_invoice_id?: string | null
          stripe_pdf_url?: string | null
          subtotal_amount?: number | null
          tax_point?: string | null
          total_amount?: number
          updated_at?: string
          vat_amount?: number | null
          vat_basis?: string | null
          vat_rate?: number | null
          vendor_id?: string
          vendor_payout_amount?: number
          vendor_signature_url?: string | null
          vendor_signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_quote_version_id_fkey"
            columns: ["quote_version_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          file_url: string | null
          id: string
          message_content: string
          message_type: Database["public"]["Enums"]["message_type"] | null
          quote_request_id: string
          read_status: boolean | null
          recipient_id: string
          sender_id: string
          sent_at: string
        }
        Insert: {
          file_url?: string | null
          id?: string
          message_content: string
          message_type?: Database["public"]["Enums"]["message_type"] | null
          quote_request_id: string
          read_status?: boolean | null
          recipient_id: string
          sender_id: string
          sent_at?: string
        }
        Update: {
          file_url?: string | null
          id?: string
          message_content?: string
          message_type?: Database["public"]["Enums"]["message_type"] | null
          quote_request_id?: string
          read_status?: boolean | null
          recipient_id?: string
          sender_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          id: string
          ip_address: unknown | null
          page_path: string
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          ip_address?: unknown | null
          page_path: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          ip_address?: unknown | null
          page_path?: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email_change_count: number | null
          email_verified: boolean | null
          full_name: string | null
          id: string
          last_email_change: string | null
          onboarding_completed: boolean | null
          phone_number: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email_change_count?: number | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          last_email_change?: string | null
          onboarding_completed?: boolean | null
          phone_number?: string | null
          updated_at?: string
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email_change_count?: number | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          last_email_change?: string | null
          onboarding_completed?: boolean | null
          phone_number?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      project_attachments: {
        Row: {
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          project_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          project_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          project_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_attachments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_vendors: {
        Row: {
          id: string
          project_id: string
          removed_at: string | null
          selected_at: string
          selection_status: string
          vendor_id: string
        }
        Insert: {
          id?: string
          project_id: string
          removed_at?: string | null
          selected_at?: string
          selection_status?: string
          vendor_id: string
        }
        Update: {
          id?: string
          project_id?: string
          removed_at?: string | null
          selected_at?: string
          selection_status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_vendors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_vendors_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      projects: {
        Row: {
          budget_range: string | null
          client_id: string
          created_at: string
          description: string
          form_data: Json | null
          id: string
          is_active: boolean | null
          location: string | null
          project_name: string | null
          project_type: string | null
          service_groups: string[] | null
          status: Database["public"]["Enums"]["project_status"] | null
          timeline: string | null
          title: string
          updated_at: string
          vendor_selections: Json | null
        }
        Insert: {
          budget_range?: string | null
          client_id: string
          created_at?: string
          description: string
          form_data?: Json | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          project_name?: string | null
          project_type?: string | null
          service_groups?: string[] | null
          status?: Database["public"]["Enums"]["project_status"] | null
          timeline?: string | null
          title: string
          updated_at?: string
          vendor_selections?: Json | null
        }
        Update: {
          budget_range?: string | null
          client_id?: string
          created_at?: string
          description?: string
          form_data?: Json | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          project_name?: string | null
          project_type?: string | null
          service_groups?: string[] | null
          status?: Database["public"]["Enums"]["project_status"] | null
          timeline?: string | null
          title?: string
          updated_at?: string
          vendor_selections?: Json | null
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          client_id: string
          created_at: string
          deleted_at: string | null
          deletion_reason: string | null
          estimated_timeline: string | null
          id: string
          project_id: string
          quoted_amount: number | null
          responded_at: string | null
          response_deadline: string | null
          status: Database["public"]["Enums"]["quote_status"] | null
          updated_at: string
          vendor_id: string
          vendor_notes: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          estimated_timeline?: string | null
          id?: string
          project_id: string
          quoted_amount?: number | null
          responded_at?: string | null
          response_deadline?: string | null
          status?: Database["public"]["Enums"]["quote_status"] | null
          updated_at?: string
          vendor_id: string
          vendor_notes?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          estimated_timeline?: string | null
          id?: string
          project_id?: string
          quoted_amount?: number | null
          responded_at?: string | null
          response_deadline?: string | null
          status?: Database["public"]["Enums"]["quote_status"] | null
          updated_at?: string
          vendor_id?: string
          vendor_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_reviews: {
        Row: {
          created_at: string | null
          id: string
          quote_id: string
          requested_changes: Json | null
          review_notes: string | null
          review_type: string
          reviewer_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          quote_id: string
          requested_changes?: Json | null
          review_notes?: string | null
          review_type?: string
          reviewer_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          quote_id?: string
          requested_changes?: Json | null
          review_notes?: string | null
          review_type?: string
          reviewer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_reviews_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_updates: {
        Row: {
          attachments: Json | null
          changes: Json | null
          created_at: string | null
          id: string
          message: string | null
          quote_request_id: string
          update_type: string
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          attachments?: Json | null
          changes?: Json | null
          created_at?: string | null
          id?: string
          message?: string | null
          quote_request_id: string
          update_type: string
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          attachments?: Json | null
          changes?: Json | null
          created_at?: string | null
          id?: string
          message?: string | null
          quote_request_id?: string
          update_type?: string
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_updates_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          assumptions_dependencies: string | null
          change_note: string | null
          cost_breakdown: Json | null
          created_at: string
          duration_weeks: number | null
          estimated_timeline: string | null
          exclusions: string[] | null
          id: string
          inclusions: string[] | null
          insurance_provider_used: string | null
          insurance_will_be_used: boolean | null
          is_current_version: boolean | null
          milestones: Json | null
          notes_to_client: string | null
          payment_schedule: Json | null
          portfolio_references: Json | null
          proposed_visit_dates: Json | null
          quote_request_id: string
          site_visit_required: boolean | null
          start_date: string | null
          total_amount: number
          updated_at: string
          validity_date: string | null
          version: number
        }
        Insert: {
          assumptions_dependencies?: string | null
          change_note?: string | null
          cost_breakdown?: Json | null
          created_at?: string
          duration_weeks?: number | null
          estimated_timeline?: string | null
          exclusions?: string[] | null
          id?: string
          inclusions?: string[] | null
          insurance_provider_used?: string | null
          insurance_will_be_used?: boolean | null
          is_current_version?: boolean | null
          milestones?: Json | null
          notes_to_client?: string | null
          payment_schedule?: Json | null
          portfolio_references?: Json | null
          proposed_visit_dates?: Json | null
          quote_request_id: string
          site_visit_required?: boolean | null
          start_date?: string | null
          total_amount: number
          updated_at?: string
          validity_date?: string | null
          version?: number
        }
        Update: {
          assumptions_dependencies?: string | null
          change_note?: string | null
          cost_breakdown?: Json | null
          created_at?: string
          duration_weeks?: number | null
          estimated_timeline?: string | null
          exclusions?: string[] | null
          id?: string
          inclusions?: string[] | null
          insurance_provider_used?: string | null
          insurance_will_be_used?: boolean | null
          is_current_version?: boolean | null
          milestones?: Json | null
          notes_to_client?: string | null
          payment_schedule?: Json | null
          portfolio_references?: Json | null
          proposed_visit_dates?: Json | null
          quote_request_id?: string
          site_visit_required?: boolean | null
          start_date?: string | null
          total_amount?: number
          updated_at?: string
          validity_date?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      rfi_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          id: string
          message_id: string | null
          mime_type: string
          rfi_id: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          id?: string
          message_id?: string | null
          mime_type: string
          rfi_id: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          id?: string
          message_id?: string | null
          mime_type?: string
          rfi_id?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfi_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "rfi_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfi_attachments_rfi_id_fkey"
            columns: ["rfi_id"]
            isOneToOne: false
            referencedRelation: "rfis"
            referencedColumns: ["id"]
          },
        ]
      }
      rfi_messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_hidden: boolean | null
          rfi_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_hidden?: boolean | null
          rfi_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_hidden?: boolean | null
          rfi_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfi_messages_rfi_id_fkey"
            columns: ["rfi_id"]
            isOneToOne: false
            referencedRelation: "rfis"
            referencedColumns: ["id"]
          },
        ]
      }
      rfis: {
        Row: {
          created_at: string
          created_by: string
          id: string
          question: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          ticket_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          question: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          ticket_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          question?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          ticket_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfis_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tickets: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          id: string
          internal_notes: string | null
          priority: string | null
          quote_request_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          internal_notes?: string | null
          priority?: string | null
          quote_request_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          internal_notes?: string | null
          priority?: string | null
          quote_request_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          login_at: string | null
          logout_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          login_at?: string | null
          logout_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          login_at?: string | null
          logout_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vendor_profiles: {
        Row: {
          about_business: string | null
          availability_status: boolean | null
          bio: string | null
          business_address: string | null
          business_name: string
          created_at: string
          email: string | null
          established_in_cyprus: boolean | null
          id: string
          insurance_coverage: boolean | null
          insurance_provider: string | null
          license_number: string | null
          licenses_certifications: Json | null
          location: string | null
          phone: string | null
          portfolio_images: Json | null
          price_range_max: number | null
          price_range_min: number | null
          rating: number | null
          response_time_hours: number | null
          service_radius: string | null
          services_offered: Json | null
          specialty: string[] | null
          stripe_charges_enabled: boolean | null
          stripe_connect_id: string | null
          stripe_onboarding_complete: boolean | null
          stripe_onboarding_completed_at: string | null
          stripe_onboarding_started_at: string | null
          stripe_payouts_enabled: boolean | null
          team_size: number | null
          total_reviews: number | null
          updated_at: string
          user_id: string
          vat_id: string | null
          vendor_category: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website: string | null
          year_established: number | null
          years_experience: number | null
        }
        Insert: {
          about_business?: string | null
          availability_status?: boolean | null
          bio?: string | null
          business_address?: string | null
          business_name: string
          created_at?: string
          email?: string | null
          established_in_cyprus?: boolean | null
          id?: string
          insurance_coverage?: boolean | null
          insurance_provider?: string | null
          license_number?: string | null
          licenses_certifications?: Json | null
          location?: string | null
          phone?: string | null
          portfolio_images?: Json | null
          price_range_max?: number | null
          price_range_min?: number | null
          rating?: number | null
          response_time_hours?: number | null
          service_radius?: string | null
          services_offered?: Json | null
          specialty?: string[] | null
          stripe_charges_enabled?: boolean | null
          stripe_connect_id?: string | null
          stripe_onboarding_complete?: boolean | null
          stripe_onboarding_completed_at?: string | null
          stripe_onboarding_started_at?: string | null
          stripe_payouts_enabled?: boolean | null
          team_size?: number | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
          vat_id?: string | null
          vendor_category?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website?: string | null
          year_established?: number | null
          years_experience?: number | null
        }
        Update: {
          about_business?: string | null
          availability_status?: boolean | null
          bio?: string | null
          business_address?: string | null
          business_name?: string
          created_at?: string
          email?: string | null
          established_in_cyprus?: boolean | null
          id?: string
          insurance_coverage?: boolean | null
          insurance_provider?: string | null
          license_number?: string | null
          licenses_certifications?: Json | null
          location?: string | null
          phone?: string | null
          portfolio_images?: Json | null
          price_range_max?: number | null
          price_range_min?: number | null
          rating?: number | null
          response_time_hours?: number | null
          service_radius?: string | null
          services_offered?: Json | null
          specialty?: string[] | null
          stripe_charges_enabled?: boolean | null
          stripe_connect_id?: string | null
          stripe_onboarding_complete?: boolean | null
          stripe_onboarding_completed_at?: string | null
          stripe_onboarding_started_at?: string | null
          stripe_payouts_enabled?: boolean | null
          team_size?: number | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
          vat_id?: string | null
          vendor_category?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website?: string | null
          year_established?: number | null
          years_experience?: number | null
        }
        Relationships: []
      }
      vendor_tiers: {
        Row: {
          created_at: string
          id: string
          monthly_fee: number
          quotes_per_month: number
          service_fee_percentage: number
          tier_name: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_fee?: number
          quotes_per_month?: number
          service_fee_percentage?: number
          tier_name?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_fee?: number
          quotes_per_month?: number
          service_fee_percentage?: number
          tier_name?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      invoice_analytics: {
        Row: {
          avg_days_to_pay: number | null
          invoice_count: number | null
          overdue_count: number | null
          paid_count: number | null
          pending_count: number | null
          total_revenue: number | null
          total_vat_collected: number | null
          vat_basis: string | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_invoice_from_quote: {
        Args: { quote_request_id_param: string }
        Returns: string
      }
      generate_legal_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_client_quote_details: {
        Args: { quote_request_id_param: string }
        Returns: {
          assumptions_dependencies: string
          cost_breakdown: Json
          created_at: string
          duration_weeks: number
          estimated_timeline: string
          exclusions: string[]
          inclusions: string[]
          insurance_provider_used: string
          insurance_will_be_used: boolean
          milestones: Json
          notes_to_client: string
          payment_schedule: Json
          portfolio_references: Json
          proposed_visit_dates: Json
          quote_id: string
          site_visit_required: boolean
          start_date: string
          total_amount: number
          validity_date: string
          vendor_business_name: string
          vendor_notes: string
          vendor_rating: number
        }[]
      }
      get_dashboard_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_public_vendor_directory: {
        Args: Record<PropertyKey, never>
        Returns: {
          bio: string
          business_name: string
          id: string
          location: string
          portfolio_images: Json
          rating: number
          services_offered: Json
          specialty: string[]
          total_reviews: number
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          years_experience: number
        }[]
      }
      get_public_vendor_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          availability_status: boolean
          bio: string
          business_name: string
          created_at: string
          id: string
          location: string
          portfolio_images: Json
          rating: number
          response_time_hours: number
          services_offered: Json
          specialty: string[]
          total_reviews: number
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          years_experience: number
        }[]
      }
      get_safe_vendor_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          availability_status: boolean
          bio: string
          business_name: string
          id: string
          location: string
          rating: number
          services_offered: Json
          specialty: string[]
          total_reviews: number
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          years_experience: number
        }[]
      }
      get_user_growth_analytics: {
        Args: { days?: number }
        Returns: Json
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_type"]
      }
      get_vendor_contact_info: {
        Args: { vendor_user_id: string }
        Returns: {
          business_address: string
          email: string
          phone: string
          website: string
        }[]
      }
      get_vendor_etek_status: {
        Args: { vendor_user_id: string }
        Returns: boolean
      }
      get_vendor_for_quote_request: {
        Args: { quote_request_id_param: string }
        Returns: {
          bio: string
          business_name: string
          id: string
          location: string
          portfolio_images: Json
          rating: number
          response_time_hours: number
          services_offered: Json
          specialty: string[]
          total_reviews: number
          user_id: string
          years_experience: number
        }[]
      }
      get_vendor_performance_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_vendor_service_fee: {
        Args: { vendor_user_id: string }
        Returns: number
      }
      is_admin: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_security_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_ticket_participant: {
        Args: { _ticket_id: string; _user_id: string }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_record_id?: string
          p_table_name: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: undefined
      }
      log_sensitive_data_access: {
        Args: {
          access_type: string
          accessed_table: string
          accessed_user_id: string
        }
        Returns: undefined
      }
      log_vendor_profile_access: {
        Args: {
          access_type: string
          accessing_user_id: string
          vendor_user_id: string
        }
        Returns: undefined
      }
      validate_input_security: {
        Args: { input_text: string; max_length?: number }
        Returns: boolean
      }
    }
    Enums: {
      message_type: "text" | "file" | "quote" | "system"
      project_status:
        | "draft"
        | "active"
        | "in_progress"
        | "completed"
        | "cancelled"
      quote_status: "pending" | "quoted" | "accepted" | "declined" | "expired"
      user_type: "client" | "vendor" | "admin"
      verification_status: "pending" | "verified" | "rejected"
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
      message_type: ["text", "file", "quote", "system"],
      project_status: [
        "draft",
        "active",
        "in_progress",
        "completed",
        "cancelled",
      ],
      quote_status: ["pending", "quoted", "accepted", "declined", "expired"],
      user_type: ["client", "vendor", "admin"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
