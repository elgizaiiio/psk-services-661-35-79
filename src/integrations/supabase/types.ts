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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          points_reward: number | null
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_reward?: number | null
          requirement_type: string
          requirement_value: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_reward?: number | null
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      daily_codes: {
        Row: {
          code1: string
          code2: string
          code3: string
          code4: string
          created_at: string
          date: string
          id: string
        }
        Insert: {
          code1: string
          code2: string
          code3: string
          code4: string
          created_at?: string
          date: string
          id?: string
        }
        Update: {
          code1?: string
          code2?: string
          code3?: string
          code4?: string
          created_at?: string
          date?: string
          id?: string
        }
        Relationships: []
      }
      game_daily_rewards: {
        Row: {
          created_at: string
          date: string
          day_index: number
          id: string
          player_id: string
          reward_amount: number
          reward_type: string
          streak_count: number
        }
        Insert: {
          created_at?: string
          date?: string
          day_index: number
          id?: string
          player_id: string
          reward_amount: number
          reward_type: string
          streak_count: number
        }
        Update: {
          created_at?: string
          date?: string
          day_index?: number
          id?: string
          player_id?: string
          reward_amount?: number
          reward_type?: string
          streak_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_daily_rewards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
        ]
      }
      game_players: {
        Row: {
          coins: number
          created_at: string
          current_skin: string
          energy: number
          energy_refill_rate_minutes: number
          id: string
          last_energy_at: string
          max_energy: number
          telegram_id: number | null
          updated_at: string
          user_id: string | null
          username: string | null
        }
        Insert: {
          coins?: number
          created_at?: string
          current_skin?: string
          energy?: number
          energy_refill_rate_minutes?: number
          id?: string
          last_energy_at?: string
          max_energy?: number
          telegram_id?: number | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Update: {
          coins?: number
          created_at?: string
          current_skin?: string
          energy?: number
          energy_refill_rate_minutes?: number
          id?: string
          last_energy_at?: string
          max_energy?: number
          telegram_id?: number | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      game_purchases: {
        Row: {
          amount_ton: number
          created_at: string
          id: string
          item_key: string | null
          item_type: string
          metadata: Json | null
          player_id: string
          status: string
        }
        Insert: {
          amount_ton?: number
          created_at?: string
          id?: string
          item_key?: string | null
          item_type: string
          metadata?: Json | null
          player_id: string
          status?: string
        }
        Update: {
          amount_ton?: number
          created_at?: string
          id?: string
          item_key?: string | null
          item_type?: string
          metadata?: Json | null
          player_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_purchases_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
        ]
      }
      game_scores: {
        Row: {
          created_at: string
          id: string
          player_id: string
          score: number
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          score: number
          week_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          score?: number
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_scores_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
        ]
      }
      game_skins: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          price_ton: number
          skin_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price_ton?: number
          skin_key: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price_ton?: number
          skin_key?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_referrals: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          next_retry_at: string | null
          photo_url: string | null
          referral_param: string
          retry_count: number | null
          status: string | null
          telegram_id: number
          telegram_username: string | null
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          next_retry_at?: string | null
          photo_url?: string | null
          referral_param: string
          retry_count?: number | null
          status?: string | null
          telegram_id: number
          telegram_username?: string | null
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          next_retry_at?: string | null
          photo_url?: string | null
          referral_param?: string
          retry_count?: number | null
          status?: string | null
          telegram_id?: number
          telegram_username?: string | null
        }
        Relationships: []
      }
      referral_attempts: {
        Row: {
          attempt_count: number | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          processed_at: string | null
          referral_param: string
          referrer_found: boolean | null
          referrer_id: string | null
          success: boolean | null
          telegram_id: number
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          referral_param: string
          referrer_found?: boolean | null
          referrer_id?: string | null
          success?: boolean | null
          telegram_id: number
        }
        Update: {
          attempt_count?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          referral_param?: string
          referrer_found?: boolean | null
          referrer_id?: string | null
          success?: boolean | null
          telegram_id?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          commission_rate: number
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "viral_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "viral_users"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          points: number
          task_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          points: number
          task_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          points?: number
          task_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournament_participants: {
        Row: {
          id: string
          joined_at: string
          rank_position: number | null
          score: number | null
          tournament_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          rank_position?: number | null
          score?: number | null
          tournament_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          rank_position?: number | null
          score?: number | null
          tournament_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          entry_fee: number | null
          game_type: string
          id: string
          max_participants: number | null
          name: string
          prize_pool: number | null
          rules: Json | null
          start_time: string
          status: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          entry_fee?: number | null
          game_type: string
          id?: string
          max_participants?: number | null
          name: string
          prize_pool?: number | null
          rules?: Json | null
          start_time: string
          status?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          entry_fee?: number | null
          game_type?: string
          id?: string
          max_participants?: number | null
          name?: string
          prize_pool?: number | null
          rules?: Json | null
          start_time?: string
          status?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string | null
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id?: string | null
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string | null
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_completed_tasks: {
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
            foreignKeyName: "user_completed_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_completed_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "viral_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_code_attempts: {
        Row: {
          completed_at: string | null
          date: string
          id: string
          points_earned: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          date: string
          id?: string
          points_earned?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          date?: string
          id?: string
          points_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_code_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "viral_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          experience_points: number | null
          id: string
          is_premium: boolean | null
          level: number | null
          premium_expires_at: string | null
          rank_position: number | null
          total_points: number | null
          updated_at: string
          user_id: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          experience_points?: number | null
          id?: string
          is_premium?: boolean | null
          level?: number | null
          premium_expires_at?: string | null
          rank_position?: number | null
          total_points?: number | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          experience_points?: number | null
          id?: string
          is_premium?: boolean | null
          level?: number | null
          premium_expires_at?: string | null
          rank_position?: number | null
          total_points?: number | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      viral_mining_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          end_time: string
          id: string
          is_active: boolean
          mining_power_multiplier: number
          start_time: string
          tokens_per_hour: number
          total_tokens_mined: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          end_time: string
          id?: string
          is_active?: boolean
          mining_power_multiplier?: number
          start_time: string
          tokens_per_hour?: number
          total_tokens_mined?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          end_time?: string
          id?: string
          is_active?: boolean
          mining_power_multiplier?: number
          start_time?: string
          tokens_per_hour?: number
          total_tokens_mined?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viral_mining_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "viral_users"
            referencedColumns: ["id"]
          },
        ]
      }
      viral_upgrades: {
        Row: {
          cost_ton: number
          created_at: string
          id: string
          transaction_hash: string | null
          upgrade_level: number
          upgrade_type: string
          user_id: string
        }
        Insert: {
          cost_ton?: number
          created_at?: string
          id?: string
          transaction_hash?: string | null
          upgrade_level: number
          upgrade_type: string
          user_id: string
        }
        Update: {
          cost_ton?: number
          created_at?: string
          id?: string
          transaction_hash?: string | null
          upgrade_level?: number
          upgrade_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viral_upgrades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "viral_users"
            referencedColumns: ["id"]
          },
        ]
      }
      viral_users: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_active_at: string | null
          last_name: string | null
          mining_duration_hours: number
          mining_power_multiplier: number
          photo_url: string | null
          referral_bonus_earned: number | null
          successful_referrals: number | null
          telegram_id: number
          telegram_username: string | null
          token_balance: number
          total_referrals: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_active_at?: string | null
          last_name?: string | null
          mining_duration_hours?: number
          mining_power_multiplier?: number
          photo_url?: string | null
          referral_bonus_earned?: number | null
          successful_referrals?: number | null
          telegram_id: number
          telegram_username?: string | null
          token_balance?: number
          total_referrals?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_active_at?: string | null
          last_name?: string | null
          mining_duration_hours?: number
          mining_power_multiplier?: number
          photo_url?: string | null
          referral_bonus_earned?: number | null
          successful_referrals?: number | null
          telegram_id?: number
          telegram_username?: string | null
          token_balance?: number
          total_referrals?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          metadata: Json | null
          status: string
          transaction_hash: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          transaction_hash?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          transaction_hash?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_mining_reward: {
        Args: { session_id: string }
        Returns: number
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
