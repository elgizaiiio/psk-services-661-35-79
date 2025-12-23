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
      bolt_completed_tasks: {
        Row: {
          completed_at: string
          id: string
          points_earned: number
          task_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          points_earned?: number
          task_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          points_earned?: number
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolt_completed_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "bolt_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolt_completed_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
        ]
      }
      bolt_daily_code_attempts: {
        Row: {
          completed_at: string | null
          created_at: string
          date: string
          id: string
          points_earned: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          date: string
          id?: string
          points_earned?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          date?: string
          id?: string
          points_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolt_daily_code_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
        ]
      }
      bolt_daily_codes: {
        Row: {
          code1: string
          code2: string
          code3: string
          code4: string
          created_at: string
          date: string
          id: string
          points_reward: number
        }
        Insert: {
          code1: string
          code2: string
          code3: string
          code4: string
          created_at?: string
          date: string
          id?: string
          points_reward?: number
        }
        Update: {
          code1?: string
          code2?: string
          code3?: string
          code4?: string
          created_at?: string
          date?: string
          id?: string
          points_reward?: number
        }
        Relationships: []
      }
      bolt_flash_offers: {
        Row: {
          created_at: string
          current_claims: number
          description: string | null
          discount_percent: number
          discounted_price: number
          ends_at: string
          id: string
          is_active: boolean
          max_claims: number | null
          original_price: number
          product_type: string
          starts_at: string
          title: string
        }
        Insert: {
          created_at?: string
          current_claims?: number
          description?: string | null
          discount_percent: number
          discounted_price: number
          ends_at: string
          id?: string
          is_active?: boolean
          max_claims?: number | null
          original_price: number
          product_type?: string
          starts_at?: string
          title: string
        }
        Update: {
          created_at?: string
          current_claims?: number
          description?: string | null
          discount_percent?: number
          discounted_price?: number
          ends_at?: string
          id?: string
          is_active?: boolean
          max_claims?: number | null
          original_price?: number
          product_type?: string
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      bolt_lucky_boxes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          possible_rewards: Json
          price_ton: number
          rarity: string
          win_chance: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          possible_rewards?: Json
          price_ton?: number
          rarity?: string
          win_chance?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          possible_rewards?: Json
          price_ton?: number
          rarity?: string
          win_chance?: number
        }
        Relationships: []
      }
      bolt_mining_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          end_time: string
          id: string
          is_active: boolean
          mining_power: number
          start_time: string
          tokens_per_hour: number
          total_mined: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          end_time: string
          id?: string
          is_active?: boolean
          mining_power?: number
          start_time?: string
          tokens_per_hour?: number
          total_mined?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          end_time?: string
          id?: string
          is_active?: boolean
          mining_power?: number
          start_time?: string
          tokens_per_hour?: number
          total_mined?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolt_mining_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
        ]
      }
      bolt_referrals: {
        Row: {
          bonus_earned: number
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          bonus_earned?: number
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          bonus_earned?: number
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolt_referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolt_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
        ]
      }
      bolt_social_notifications: {
        Row: {
          action_type: string
          amount: number | null
          created_at: string
          id: string
          product_name: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          action_type: string
          amount?: number | null
          created_at?: string
          id?: string
          product_name?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          action_type?: string
          amount?: number | null
          created_at?: string
          id?: string
          product_name?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      bolt_tasks: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          points: number
          task_url: string | null
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          points?: number
          task_url?: string | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          points?: number
          task_url?: string | null
          title?: string
        }
        Relationships: []
      }
      bolt_upgrade_purchases: {
        Row: {
          amount_paid: number
          created_at: string
          id: string
          upgrade_type: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          id?: string
          upgrade_type: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          id?: string
          upgrade_type?: string
          user_id?: string
        }
        Relationships: []
      }
      bolt_user_levels: {
        Row: {
          created_at: string
          id: string
          level: number
          rank_title: string
          unlocked_features: Json | null
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          rank_title?: string
          unlocked_features?: Json | null
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          rank_title?: string
          unlocked_features?: Json | null
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      bolt_user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_claim_at: string | null
          max_streak: number
          streak_restored_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_claim_at?: string | null
          max_streak?: number
          streak_restored_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_claim_at?: string | null
          max_streak?: number
          streak_restored_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bolt_users: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          mining_duration_hours: number
          mining_power: number
          photo_url: string | null
          referral_bonus: number
          referred_by: string | null
          telegram_id: number
          telegram_username: string | null
          token_balance: number
          total_referrals: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          mining_duration_hours?: number
          mining_power?: number
          photo_url?: string | null
          referral_bonus?: number
          referred_by?: string | null
          telegram_id: number
          telegram_username?: string | null
          token_balance?: number
          total_referrals?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          mining_duration_hours?: number
          mining_power?: number
          photo_url?: string | null
          referral_bonus?: number
          referred_by?: string | null
          telegram_id?: number
          telegram_username?: string | null
          token_balance?: number
          total_referrals?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolt_users_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
        ]
      }
      bolt_vip_tiers: {
        Row: {
          benefits: Json | null
          created_at: string
          expires_at: string | null
          id: string
          tier: string
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          benefits?: Json | null
          created_at?: string
          expires_at?: string | null
          id?: string
          tier?: string
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          benefits?: Json | null
          created_at?: string
          expires_at?: string | null
          id?: string
          tier?: string
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
