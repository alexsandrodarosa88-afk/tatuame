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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          related_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          related_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          related_id?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      artist_applications: {
        Row: {
          address: string
          cpf: string
          created_at: string
          email: string
          full_name: string
          id: string
          instagram: string | null
          notes: string | null
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["artist_application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          cpf: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          instagram?: string | null
          notes?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["artist_application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          cpf?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          instagram?: string | null
          notes?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["artist_application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      artist_bank_details: {
        Row: {
          address: string
          artist_id: string
          bank_account: string
          bank_agency: string
          bank_name: string
          birth_date: string
          cpf: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_locked: boolean
          phone: string
          pix_key: string
          rg: string
          updated_at: string
        }
        Insert: {
          address: string
          artist_id: string
          bank_account: string
          bank_agency: string
          bank_name: string
          birth_date: string
          cpf: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_locked?: boolean
          phone: string
          pix_key: string
          rg: string
          updated_at?: string
        }
        Update: {
          address?: string
          artist_id?: string
          bank_account?: string
          bank_agency?: string
          bank_name?: string
          birth_date?: string
          cpf?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_locked?: boolean
          phone?: string
          pix_key?: string
          rg?: string
          updated_at?: string
        }
        Relationships: []
      }
      artist_payouts: {
        Row: {
          amount: number
          artist_id: string
          campaign_id: string | null
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          reference_period: string
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          artist_id: string
          campaign_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          reference_period: string
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          artist_id?: string
          campaign_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          reference_period?: string
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_payouts_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "tattoo_artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_payouts_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "tattoo_artists_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_payouts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_promotion_tasks: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          instagram_url: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          task_index: number
          task_type: string
          updated_at: string
          week_start: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          instagram_url?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          task_index: number
          task_type: string
          updated_at?: string
          week_start: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          instagram_url?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          task_index?: number
          task_type?: string
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_promotion_tasks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "tattoo_artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_promotion_tasks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "tattoo_artists_public"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_subscriptions: {
        Row: {
          amount: number
          artist_id: string
          asaas_payment_id: string | null
          billing_type: string | null
          created_at: string
          due_date: string | null
          id: string
          invoice_url: string | null
          notes: string | null
          paid_at: string | null
          reference_month: string
          status: string
          term_months: number
          updated_at: string
        }
        Insert: {
          amount: number
          artist_id: string
          asaas_payment_id?: string | null
          billing_type?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_url?: string | null
          notes?: string | null
          paid_at?: string | null
          reference_month: string
          status?: string
          term_months?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          artist_id?: string
          asaas_payment_id?: string | null
          billing_type?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_url?: string | null
          notes?: string | null
          paid_at?: string | null
          reference_month?: string
          status?: string
          term_months?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_subscriptions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "tattoo_artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_subscriptions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "tattoo_artists_public"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          code: string
          created_at: string
          description: string | null
          ends_at: string
          id: string
          price_per_quota: number
          sold_quotas: number
          status: Database["public"]["Enums"]["campaign_status"]
          tattoo_value: number
          title: string | null
          total_quotas: number
          updated_at: string
        }
        Insert: {
          code?: string
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          price_per_quota: number
          sold_quotas?: number
          status?: Database["public"]["Enums"]["campaign_status"]
          tattoo_value: number
          title?: string | null
          total_quotas: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          price_per_quota?: number
          sold_quotas?: number
          status?: Database["public"]["Enums"]["campaign_status"]
          tattoo_value?: number
          title?: string | null
          total_quotas?: number
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          quantity: number
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      credits: {
        Row: {
          amount: number
          created_at: string
          id: string
          source_order_id: string | null
          used_amount: number
          user_id: string
          valid_until: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          source_order_id?: string | null
          used_amount?: number
          user_id: string
          valid_until?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          source_order_id?: string | null
          used_amount?: number
          user_id?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "credits_source_order_id_fkey"
            columns: ["source_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          order_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          asaas_payment_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          paid_at: string | null
          pix_copy_paste: string | null
          pix_qr_code: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          asaas_payment_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          pix_copy_paste?: string | null
          pix_qr_code?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          asaas_payment_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          pix_copy_paste?: string | null
          pix_qr_code?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      participations: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          lucky_number: number
          order_id: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          lucky_number: number
          order_id: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          lucky_number?: number
          order_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          admin_notes: string | null
          artist_id: string
          campaign_id: string | null
          created_at: string
          extra_photo_url: string | null
          id: string
          is_partial: boolean
          notes: string | null
          paid_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sessions_done: number | null
          sessions_total: number | null
          signed_term_url: string
          status: string
          tattoo_photo_url: string
          tattoo_value: number
          updated_at: string
          user_id: string
          winner_cpf: string | null
          winner_email: string | null
          winner_name: string
          winner_phone: string | null
        }
        Insert: {
          admin_notes?: string | null
          artist_id: string
          campaign_id?: string | null
          created_at?: string
          extra_photo_url?: string | null
          id?: string
          is_partial?: boolean
          notes?: string | null
          paid_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sessions_done?: number | null
          sessions_total?: number | null
          signed_term_url: string
          status?: string
          tattoo_photo_url: string
          tattoo_value?: number
          updated_at?: string
          user_id: string
          winner_cpf?: string | null
          winner_email?: string | null
          winner_name: string
          winner_phone?: string | null
        }
        Update: {
          admin_notes?: string | null
          artist_id?: string
          campaign_id?: string | null
          created_at?: string
          extra_photo_url?: string | null
          id?: string
          is_partial?: boolean
          notes?: string | null
          paid_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sessions_done?: number | null
          sessions_total?: number | null
          signed_term_url?: string
          status?: string
          tattoo_photo_url?: string
          tattoo_value?: number
          updated_at?: string
          user_id?: string
          winner_cpf?: string | null
          winner_email?: string | null
          winner_name?: string
          winner_phone?: string | null
        }
        Relationships: []
      }
      policy_acceptances: {
        Row: {
          accepted_at: string
          content_snapshot: string
          created_at: string
          id: string
          ip_address: string | null
          policy_type: string
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          content_snapshot: string
          created_at?: string
          id?: string
          ip_address?: string | null
          policy_type?: string
          user_agent?: string | null
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          content_snapshot?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          policy_type?: string
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cidade: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          email: string | null
          id: string
          nome_completo: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          id: string
          nome_completo?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          nome_completo?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_terms: {
        Row: {
          artist_address: string | null
          artist_cpf: string | null
          artist_id: string
          artist_name: string
          artist_signature: string | null
          artist_signed_at: string | null
          campaign_code: string | null
          client_address: string | null
          client_cpf: string | null
          client_name: string
          client_phone: string | null
          client_receipt_signature: string | null
          client_received_at: string | null
          client_signature: string | null
          client_signed_at: string | null
          created_at: string
          generated_pdf_url: string | null
          id: string
          is_prize: boolean
          sessions_total: number | null
          status: string
          tattoo_description: string
          tattoo_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          artist_address?: string | null
          artist_cpf?: string | null
          artist_id: string
          artist_name: string
          artist_signature?: string | null
          artist_signed_at?: string | null
          campaign_code?: string | null
          client_address?: string | null
          client_cpf?: string | null
          client_name: string
          client_phone?: string | null
          client_receipt_signature?: string | null
          client_received_at?: string | null
          client_signature?: string | null
          client_signed_at?: string | null
          created_at?: string
          generated_pdf_url?: string | null
          id?: string
          is_prize?: boolean
          sessions_total?: number | null
          status?: string
          tattoo_description: string
          tattoo_value?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          artist_address?: string | null
          artist_cpf?: string | null
          artist_id?: string
          artist_name?: string
          artist_signature?: string | null
          artist_signed_at?: string | null
          campaign_code?: string | null
          client_address?: string | null
          client_cpf?: string | null
          client_name?: string
          client_phone?: string | null
          client_receipt_signature?: string | null
          client_received_at?: string | null
          client_signature?: string | null
          client_signed_at?: string | null
          created_at?: string
          generated_pdf_url?: string | null
          id?: string
          is_prize?: boolean
          sessions_total?: number | null
          status?: string
          tattoo_description?: string
          tattoo_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      tattoo_artists: {
        Row: {
          address: string | null
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          bio: string | null
          city: string | null
          created_at: string
          free_month_granted_at: string | null
          id: string
          instagram: string | null
          is_active: boolean
          is_lifetime_free: boolean
          name: string
          photo_url: string | null
          plan: string
          plan_expires_at: string | null
          plan_term_months: number | null
          state: string | null
          styles: string[]
          subscription_billing_type: string | null
          subscription_next_due: string | null
          subscription_started_at: string | null
          subscription_status: string
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          free_month_granted_at?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_lifetime_free?: boolean
          name: string
          photo_url?: string | null
          plan?: string
          plan_expires_at?: string | null
          plan_term_months?: number | null
          state?: string | null
          styles?: string[]
          subscription_billing_type?: string | null
          subscription_next_due?: string | null
          subscription_started_at?: string | null
          subscription_status?: string
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          free_month_granted_at?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_lifetime_free?: boolean
          name?: string
          photo_url?: string | null
          plan?: string
          plan_expires_at?: string | null
          plan_term_months?: number | null
          state?: string | null
          styles?: string[]
          subscription_billing_type?: string | null
          subscription_next_due?: string | null
          subscription_started_at?: string | null
          subscription_status?: string
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      tattoo_styles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          amount: number
          artist_id: string
          created_at: string
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          artist_id: string
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          artist_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      policy_acceptances_self: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string | null
          policy_type: string | null
          user_id: string | null
          version: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string | null
          policy_type?: string | null
          user_id?: string | null
          version?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string | null
          policy_type?: string | null
          user_id?: string | null
          version?: string | null
        }
        Relationships: []
      }
      tattoo_artists_public: {
        Row: {
          address: string | null
          bio: string | null
          city: string | null
          id: string | null
          instagram: string | null
          name: string | null
          photo_url: string | null
          state: string | null
          styles: string[] | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          bio?: string | null
          city?: string | null
          id?: string | null
          instagram?: string | null
          name?: string | null
          photo_url?: string | null
          state?: string | null
          styles?: string[] | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          bio?: string | null
          city?: string | null
          id?: string | null
          instagram?: string | null
          name?: string | null
          photo_url?: string | null
          state?: string | null
          styles?: string[] | null
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_premium_plan: {
        Args: { _artist_id: string; _term_months: number }
        Returns: undefined
      }
      admin_grant_free_month: { Args: { _email: string }; Returns: string }
      admin_unblock_artist: { Args: { _artist_id: string }; Returns: boolean }
      allocate_lucky_numbers: {
        Args: {
          _campaign_id: string
          _order_id: string
          _quantity: number
          _user_id: string
        }
        Returns: number[]
      }
      approve_artist_application: {
        Args: { _application_id: string; _grant_free_month?: boolean }
        Returns: string
      }
      block_overdue_artists: { Args: never; Returns: number }
      bootstrap_first_admin: { Args: never; Returns: boolean }
      compute_artist_monthly_fee: {
        Args: { _artist_id: string }
        Returns: number
      }
      compute_artist_payout_factor: {
        Args: { _artist_id: string; _reference_period: string }
        Returns: number
      }
      confirm_paid_order: {
        Args: { _gateway_payment_id?: string; _order_id: string }
        Returns: boolean
      }
      distribute_campaign_payouts: {
        Args: { _campaign_id: string }
        Returns: number
      }
      ensure_week_promotion_tasks: {
        Args: { _artist_id: string; _week_start: string }
        Returns: undefined
      }
      expire_completed_campaigns: { Args: never; Returns: number }
      generate_campaign_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reject_artist_application: {
        Args: { _application_id: string; _reason?: string }
        Returns: boolean
      }
      tattoo_artists_billing_unchanged: {
        Args: {
          _new: Database["public"]["Tables"]["tattoo_artists"]["Row"]
          _old: Database["public"]["Tables"]["tattoo_artists"]["Row"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client" | "tattoo_artist"
      artist_application_status: "pending" | "approved" | "rejected"
      campaign_status: "active" | "closed" | "drawn" | "completed"
      order_status: "pending" | "paid" | "expired" | "canceled"
      payout_status: "pending" | "paid" | "cancelled"
      withdrawal_status: "pending" | "approved" | "paid" | "rejected"
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
      app_role: ["admin", "client", "tattoo_artist"],
      artist_application_status: ["pending", "approved", "rejected"],
      campaign_status: ["active", "closed", "drawn", "completed"],
      order_status: ["pending", "paid", "expired", "canceled"],
      payout_status: ["pending", "paid", "cancelled"],
      withdrawal_status: ["pending", "approved", "paid", "rejected"],
    },
  },
} as const
