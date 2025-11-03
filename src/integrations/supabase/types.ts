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
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_admin: boolean | null
          role: string | null
          school_district: string | null
          updated_at: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          role?: string | null
          school_district?: string | null
          updated_at?: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      get_poll_aggregate: {
        Args: { poll_id_param: string }
        Returns: {
          avg_response: number
          total_responses: number
        }[]
      }
      get_today_aggregate: {
        Args: never
        Returns: {
          avg_dissatisfaction: number
          total_signals: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
