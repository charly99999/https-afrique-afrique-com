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
      boosts: {
        Row: {
          amount_fcfa: number
          created_at: string
          days: number
          expires_at: string
          id: string
          listing_id: string
          payment_id: string | null
          starts_at: string
          user_id: string
        }
        Insert: {
          amount_fcfa: number
          created_at?: string
          days: number
          expires_at: string
          id?: string
          listing_id: string
          payment_id?: string | null
          starts_at?: string
          user_id: string
        }
        Update: {
          amount_fcfa?: number
          created_at?: string
          days?: number
          expires_at?: string
          id?: string
          listing_id?: string
          payment_id?: string | null
          starts_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boosts_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_submissions: {
        Row: {
          created_at: string
          doc_back_path: string | null
          doc_country: string
          doc_front_path: string
          doc_number: string
          doc_type: string
          full_name: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          selfie_path: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_back_path?: string | null
          doc_country: string
          doc_front_path: string
          doc_number: string
          doc_type: string
          full_name: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          selfie_path: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_back_path?: string | null
          doc_country?: string
          doc_front_path?: string
          doc_number?: string
          doc_type?: string
          full_name?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          selfie_path?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      listing_photos: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          position: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          position?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          position?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          boosted_until: string | null
          category_slug: string
          city: string
          country: Database["public"]["Enums"]["country_code"]
          cover_url: string | null
          created_at: string
          description: string
          expires_at: string | null
          favorites_count: number
          id: string
          negotiable: boolean
          owner_id: string
          price_fcfa: number
          published_at: string | null
          status: Database["public"]["Enums"]["listing_status"]
          subcategory_slug: string | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          boosted_until?: string | null
          category_slug: string
          city: string
          country: Database["public"]["Enums"]["country_code"]
          cover_url?: string | null
          created_at?: string
          description: string
          expires_at?: string | null
          favorites_count?: number
          id?: string
          negotiable?: boolean
          owner_id: string
          price_fcfa: number
          published_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          subcategory_slug?: string | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          boosted_until?: string | null
          category_slug?: string
          city?: string
          country?: Database["public"]["Enums"]["country_code"]
          cover_url?: string | null
          created_at?: string
          description?: string
          expires_at?: string | null
          favorites_count?: number
          id?: string
          negotiable?: boolean
          owner_id?: string
          price_fcfa?: number
          published_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          subcategory_slug?: string | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_owner_profile_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_owner_profile_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          listing_id: string | null
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          listing_id?: string | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          listing_id?: string | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      paydunya_ipn_logs: {
        Row: {
          error: string | null
          http_status: number
          id: string
          invoice_token: string | null
          paydunya_status: string | null
          payload: Json | null
          payment_id: string | null
          received_at: string
          signature_valid: boolean
        }
        Insert: {
          error?: string | null
          http_status: number
          id?: string
          invoice_token?: string | null
          paydunya_status?: string | null
          payload?: Json | null
          payment_id?: string | null
          received_at?: string
          signature_valid?: boolean
        }
        Update: {
          error?: string | null
          http_status?: number
          id?: string
          invoice_token?: string | null
          paydunya_status?: string | null
          payload?: Json | null
          payment_id?: string | null
          received_at?: string
          signature_valid?: boolean
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_fcfa: number
          boost_days: number | null
          completed_at: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          provider: string
          provider_invoice_url: string | null
          provider_response: Json | null
          provider_token: string | null
          related_listing_id: string | null
          related_plan: Database["public"]["Enums"]["sub_plan"] | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_fcfa: number
          boost_days?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["payment_kind"]
          provider?: string
          provider_invoice_url?: string | null
          provider_response?: Json | null
          provider_token?: string | null
          related_listing_id?: string | null
          related_plan?: Database["public"]["Enums"]["sub_plan"] | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_fcfa?: number
          boost_days?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          provider?: string
          provider_invoice_url?: string | null
          provider_response?: Json | null
          provider_token?: string | null
          related_listing_id?: string | null
          related_plan?: Database["public"]["Enums"]["sub_plan"] | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_related_listing_id_fkey"
            columns: ["related_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_expires_at: string | null
          account_type: Database["public"]["Enums"]["account_type"]
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: Database["public"]["Enums"]["country_code"]
          created_at: string
          display_name: string | null
          email_opt_in: boolean
          free_boosts_remaining: number
          id: string
          phone: string | null
          updated_at: string
          verified: boolean
          verified_at: string | null
          whatsapp: string | null
        }
        Insert: {
          account_expires_at?: string | null
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: Database["public"]["Enums"]["country_code"]
          created_at?: string
          display_name?: string | null
          email_opt_in?: boolean
          free_boosts_remaining?: number
          id: string
          phone?: string | null
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          account_expires_at?: string | null
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: Database["public"]["Enums"]["country_code"]
          created_at?: string
          display_name?: string | null
          email_opt_in?: boolean
          free_boosts_remaining?: number
          id?: string
          phone?: string | null
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      publish_errors: {
        Row: {
          context: Json | null
          created_at: string
          error_code: string | null
          id: string
          listing_id: string | null
          message: string
          step: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          error_code?: string | null
          id?: string
          listing_id?: string | null
          message: string
          step: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          error_code?: string | null
          id?: string
          listing_id?: string | null
          message?: string
          step?: string
          user_id?: string | null
        }
        Relationships: []
      }
      push_send_log: {
        Row: {
          id: string
          kind: string
          listing_id: string | null
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          kind: string
          listing_id?: string | null
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          kind?: string
          listing_id?: string | null
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          failure_count: number
          id: string
          last_success_at: string | null
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          failure_count?: number
          id?: string
          last_success_at?: string | null
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          failure_count?: number
          id?: string
          last_success_at?: string | null
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          listing_id: string
          reason: string
          reporter_id: string
          resolved: boolean
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          listing_id: string
          reason: string
          reporter_id: string
          resolved?: boolean
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          listing_id?: string
          reason?: string
          reporter_id?: string
          resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_id: string
          comment: string | null
          created_at: string
          id: string
          listing_id: string | null
          rating: number
          seller_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          rating: number
          seller_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          rating?: number
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          active: boolean
          amount_fcfa: number
          created_at: string
          expires_at: string
          id: string
          payment_id: string | null
          plan: Database["public"]["Enums"]["sub_plan"]
          starts_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          amount_fcfa: number
          created_at?: string
          expires_at: string
          id?: string
          payment_id?: string | null
          plan: Database["public"]["Enums"]["sub_plan"]
          starts_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          amount_fcfa?: number
          created_at?: string
          expires_at?: string
          id?: string
          payment_id?: string | null
          plan?: Database["public"]["Enums"]["sub_plan"]
          starts_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          account_expires_at: string | null
          account_type: Database["public"]["Enums"]["account_type"] | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: Database["public"]["Enums"]["country_code"] | null
          created_at: string | null
          display_name: string | null
          id: string | null
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          account_expires_at?: string | null
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: Database["public"]["Enums"]["country_code"] | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          account_expires_at?: string | null
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: Database["public"]["Enums"]["country_code"] | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_review_kyc_submissions: { Args: never; Returns: undefined }
      get_listing_contact: {
        Args: { _listing_id: string }
        Returns: {
          phone: string
          whatsapp: string
        }[]
      }
      get_seller_rating: {
        Args: { _seller_id: string }
        Returns: {
          avg_rating: number
          total: number
        }[]
      }
      get_seller_stats: {
        Args: { _seller_id: string }
        Returns: {
          active_listings: number
          member_since: string
          trust_score: number
          verified: boolean
          verified_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      normalize_listings_bucket_path: {
        Args: { _url: string }
        Returns: string
      }
    }
    Enums: {
      account_type: "free" | "pro" | "business"
      app_role: "admin" | "moderator" | "user"
      country_code:
        | "CI"
        | "SN"
        | "ML"
        | "BF"
        | "TG"
        | "BJ"
        | "NE"
        | "GN"
        | "CM"
        | "GA"
        | "CD"
      listing_status:
        | "draft"
        | "pending"
        | "active"
        | "sold"
        | "expired"
        | "rejected"
        | "suspended"
      payment_kind: "subscription" | "boost"
      payment_status:
        | "pending"
        | "completed"
        | "failed"
        | "cancelled"
        | "refunded"
      sub_plan:
        | "pro_monthly"
        | "pro_quarterly"
        | "pro_yearly"
        | "business_monthly"
        | "business_quarterly"
        | "business_yearly"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_type: ["free", "pro", "business"],
      app_role: ["admin", "moderator", "user"],
      country_code: [
        "CI",
        "SN",
        "ML",
        "BF",
        "TG",
        "BJ",
        "NE",
        "GN",
        "CM",
        "GA",
        "CD",
      ],
      listing_status: [
        "draft",
        "pending",
        "active",
        "sold",
        "expired",
        "rejected",
        "suspended",
      ],
      payment_kind: ["subscription", "boost"],
      payment_status: [
        "pending",
        "completed",
        "failed",
        "cancelled",
        "refunded",
      ],
      sub_plan: [
        "pro_monthly",
        "pro_quarterly",
        "pro_yearly",
        "business_monthly",
        "business_quarterly",
        "business_yearly",
      ],
    },
  },
} as const
