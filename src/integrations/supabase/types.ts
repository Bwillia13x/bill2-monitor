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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      campaigns: {
        Row: {
          active: boolean | null
          close_date: string | null
          created_at: string
          id: string
          key: string
          min_show_n: number
          open_date: string
          statement: string
        }
        Insert: {
          active?: boolean | null
          close_date?: string | null
          created_at?: string
          id?: string
          key: string
          min_show_n?: number
          open_date?: string
          statement: string
        }
        Update: {
          active?: boolean | null
          close_date?: string | null
          created_at?: string
          id?: string
          key?: string
          min_show_n?: number
          open_date?: string
          statement?: string
        }
        Relationships: []
      }
      cci_submissions: {
        Row: {
          created_at: string
          district: string | null
          exhaustion_10: number
          id: string
          role: string | null
          satisfaction_10: number
          submission_date: string
          tenure: string | null
          user_id: string
          weekly_comparison: string
        }
        Insert: {
          created_at?: string
          district?: string | null
          exhaustion_10: number
          id?: string
          role?: string | null
          satisfaction_10: number
          submission_date?: string
          tenure?: string | null
          user_id: string
          weekly_comparison: string
        }
        Update: {
          created_at?: string
          district?: string | null
          exhaustion_10?: number
          id?: string
          role?: string | null
          satisfaction_10?: number
          submission_date?: string
          tenure?: string | null
          user_id?: string
          weekly_comparison?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string
          error_timestamp: string
          error_type: string
          id: string
          message: string
          stack_trace: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          error_timestamp?: string
          error_type: string
          id?: string
          message: string
          stack_trace?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          error_timestamp?: string
          error_type?: string
          id?: string
          message?: string
          stack_trace?: string | null
        }
        Relationships: []
      }
      merkle_chain_events: {
        Row: {
          created_at: string
          current_hash: string
          data: Json
          event_id: string
          event_type: string
          id: string
          previous_hash: string
          timestamp: string
        }
        Insert: {
          created_at?: string
          current_hash: string
          data: Json
          event_id: string
          event_type: string
          id?: string
          previous_hash: string
          timestamp?: string
        }
        Update: {
          created_at?: string
          current_hash?: string
          data?: Json
          event_id?: string
          event_type?: string
          id?: string
          previous_hash?: string
          timestamp?: string
        }
        Relationships: []
      }
      micro_poll_responses: {
        Row: {
          created_at: string
          id: string
          poll_id: string
          response: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          poll_id: string
          response: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          poll_id?: string
          response?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "micro_poll_responses_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "micro_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      micro_polls: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          poll_date: string
          question: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          poll_date?: string
          question: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          poll_date?: string
          question?: string
        }
        Relationships: []
      }
      one_liners: {
        Row: {
          approved: boolean | null
          created_at: string
          district: string | null
          id: string
          tags: string[] | null
          text: string
          user_id: string
        }
        Insert: {
          approved?: boolean | null
          created_at?: string
          district?: string | null
          id?: string
          tags?: string[] | null
          text: string
          user_id: string
        }
        Update: {
          approved?: boolean | null
          created_at?: string
          district?: string | null
          id?: string
          tags?: string[] | null
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      pledge_signatures: {
        Row: {
          campaign_id: string
          district: string | null
          id: string
          one_liner: string | null
          signed_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          district?: string | null
          id?: string
          one_liner?: string | null
          signed_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          district?: string | null
          id?: string
          one_liner?: string | null
          signed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pledge_signatures_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: string | null
          school_district: string | null
          updated_at: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: string | null
          school_district?: string | null
          updated_at?: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          school_district?: string | null
          updated_at?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      signals: {
        Row: {
          created_at: string
          dissatisfaction_level: number
          id: string
          signal_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dissatisfaction_level: number
          id?: string
          signal_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dissatisfaction_level?: number
          id?: string
          signal_date?: string
          user_id?: string
        }
        Relationships: []
      }
      snapshot_logs: {
        Row: {
          created_at: string
          data_hash: string
          id: string
          metadata: Json | null
          snapshot_id: string
          snapshot_timestamp: string
          status: string
          total_records: number
        }
        Insert: {
          created_at?: string
          data_hash: string
          id?: string
          metadata?: Json | null
          snapshot_id: string
          snapshot_timestamp?: string
          status: string
          total_records: number
        }
        Update: {
          created_at?: string
          data_hash?: string
          id?: string
          metadata?: Json | null
          snapshot_id?: string
          snapshot_timestamp?: string
          status?: string
          total_records?: number
        }
        Relationships: []
      }
      stories: {
        Row: {
          approved: boolean | null
          created_at: string
          district: string | null
          id: string
          tags: string[] | null
          text: string
          user_id: string
        }
        Insert: {
          approved?: boolean | null
          created_at?: string
          district?: string | null
          id?: string
          tags?: string[] | null
          text: string
          user_id: string
        }
        Update: {
          approved?: boolean | null
          created_at?: string
          district?: string | null
          id?: string
          tags?: string[] | null
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      story_videos: {
        Row: {
          approved: boolean | null
          created_at: string
          district: string | null
          duration_seconds: number | null
          id: string
          message: string
          role: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string
          views: number | null
        }
        Insert: {
          approved?: boolean | null
          created_at?: string
          district?: string | null
          duration_seconds?: number | null
          id?: string
          message: string
          role?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url: string
          views?: number | null
        }
        Update: {
          approved?: boolean | null
          created_at?: string
          district?: string | null
          duration_seconds?: number | null
          id?: string
          message?: string
          role?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string
          views?: number | null
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
      recent_merkle_events: {
        Row: {
          current_hash: string | null
          data: Json | null
          event_id: string | null
          event_type: string | null
          timestamp: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_merkle_event: {
        Args: {
          p_current_hash: string
          p_data: Json
          p_event_id: string
          p_event_type: string
          p_previous_hash: string
        }
        Returns: Json
      }
      get_aggregate_dissatisfaction: {
        Args: never
        Returns: {
          avg_dissatisfaction: number
          signal_date: string
          total_signals: number
        }[]
      }
      get_approved_one_liners_count: { Args: never; Returns: number }
      get_approved_stories_count: { Args: never; Returns: number }
      get_campaign_coverage: {
        Args: { c_key: string }
        Returns: {
          covered: number
          observed: number
          ratio: number
          threshold: number
        }[]
      }
      get_campaign_daily_counts: {
        Args: { c_key: string; days?: number }
        Returns: {
          count: number
          day: string
        }[]
      }
      get_campaign_districts: {
        Args: { c_key: string }
        Returns: {
          count: number
          district: string
        }[]
      }
      get_campaign_summary: {
        Args: { c_key: string }
        Returns: {
          min_show_n: number
          statement: string
          today: number
          total: number
        }[]
      }
      get_cci_aggregate: {
        Args: { days_back?: number; min_n?: number }
        Returns: {
          cci: number
          cci_change_1d: number
          exh_mean: number
          last_updated: string
          p_better: number
          p_same: number
          p_worse: number
          sat_mean: number
          total_n: number
        }[]
      }
      get_cci_daily_trend: {
        Args: { days?: number; min_n?: number }
        Returns: {
          cci: number
          day: string
          n: number
        }[]
      }
      get_latest_snapshot_info: {
        Args: never
        Returns: {
          data_hash: string
          snapshot_id: string
          snapshot_timestamp: string
          status: string
          total_records: number
        }[]
      }
      get_merkle_chain_stats: {
        Args: never
        Returns: {
          aggregates_updated: number
          first_event_date: string
          last_event_date: string
          root_hash: string
          signals_submitted: number
          snapshots_created: number
          total_events: number
        }[]
      }
      get_merkle_root_hash: { Args: never; Returns: string }
      get_poll_aggregate: {
        Args: { poll_id_param: string }
        Returns: {
          avg_response: number
          total_responses: number
        }[]
      }
      get_poll_distribution: {
        Args: { _poll_id: string; min_n?: number }
        Returns: {
          count: number
          score: number
          total: number
        }[]
      }
      get_privacy_safeguard_ratio: {
        Args: { c_key: string }
        Returns: {
          share_suppressed: number
          suppressed: number
          threshold: number
          visible: number
        }[]
      }
      get_today_aggregate: {
        Args: never
        Returns: {
          avg_dissatisfaction: number
          total_signals: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_user_signed: { Args: { c_key: string }; Returns: boolean }
      store_digital_signature: {
        Args: {
          p_data_id: string
          p_data_type: string
          p_metadata?: Json
          p_public_key: string
          p_signature: string
        }
        Returns: string
      }
      validate_campaign_key: { Args: { c_key: string }; Returns: boolean }
      verify_merkle_chain: {
        Args: never
        Returns: {
          error_message: string
          first_invalid_index: number
          is_valid: boolean
          total_events: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
