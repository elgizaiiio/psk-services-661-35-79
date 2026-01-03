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
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string | null
          description_ar: string | null
          description_ru: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          name_ar: string
          name_ru: string
          reward_tokens: number
          target_value: number
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          description_ru?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_ar: string
          name_ru: string
          reward_tokens?: number
          target_value?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          description_ru?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string
          name_ru?: string
          reward_tokens?: number
          target_value?: number
        }
        Relationships: []
      }
      ad_clicks: {
        Row: {
          banner_id: string | null
          campaign_id: string | null
          click_id: string | null
          created_at: string | null
          id: string
          paid: boolean | null
          paid_amount: number | null
          publisher_id: string | null
          telegram_id: number | null
          user_id: string | null
        }
        Insert: {
          banner_id?: string | null
          campaign_id?: string | null
          click_id?: string | null
          created_at?: string | null
          id?: string
          paid?: boolean | null
          paid_amount?: number | null
          publisher_id?: string | null
          telegram_id?: number | null
          user_id?: string | null
        }
        Update: {
          banner_id?: string | null
          campaign_id?: string | null
          click_id?: string | null
          created_at?: string | null
          id?: string
          paid?: boolean | null
          paid_amount?: number | null
          publisher_id?: string | null
          telegram_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_views: {
        Row: {
          ad_type: string
          created_at: string | null
          id: string
          reward_bolt: number | null
          reward_usdt: number | null
          telegram_id: number
          user_id: string | null
        }
        Insert: {
          ad_type?: string
          created_at?: string | null
          id?: string
          reward_bolt?: number | null
          reward_usdt?: number | null
          telegram_id: number
          user_id?: string | null
        }
        Update: {
          ad_type?: string
          created_at?: string | null
          id?: string
          reward_bolt?: number | null
          reward_usdt?: number | null
          telegram_id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_task_creation_state: {
        Row: {
          action_type: string | null
          broadcast_message: string | null
          created_at: string | null
          id: string
          step: string
          task_image: string | null
          task_reward: number | null
          task_title: string | null
          task_url: string | null
          telegram_id: number
        }
        Insert: {
          action_type?: string | null
          broadcast_message?: string | null
          created_at?: string | null
          id?: string
          step?: string
          task_image?: string | null
          task_reward?: number | null
          task_title?: string | null
          task_url?: string | null
          telegram_id: number
        }
        Update: {
          action_type?: string | null
          broadcast_message?: string | null
          created_at?: string | null
          id?: string
          step?: string
          task_image?: string | null
          task_reward?: number | null
          task_title?: string | null
          task_url?: string | null
          telegram_id?: number
        }
        Relationships: []
      }
      ai_dynamic_offers: {
        Row: {
          bonus_multiplier: number | null
          created_at: string | null
          created_by_ai: boolean | null
          description: string | null
          description_ar: string | null
          discount_percent: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          min_purchase: number | null
          offer_type: string
          priority: number | null
          title: string
          title_ar: string | null
        }
        Insert: {
          bonus_multiplier?: number | null
          created_at?: string | null
          created_by_ai?: boolean | null
          description?: string | null
          description_ar?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          min_purchase?: number | null
          offer_type: string
          priority?: number | null
          title: string
          title_ar?: string | null
        }
        Update: {
          bonus_multiplier?: number | null
          created_at?: string | null
          created_by_ai?: boolean | null
          description?: string | null
          description_ar?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          min_purchase?: number | null
          offer_type?: string
          priority?: number | null
          title?: string
          title_ar?: string | null
        }
        Relationships: []
      }
      ai_scheduled_notifications: {
        Row: {
          created_at: string | null
          id: string
          message_text: string
          message_text_ar: string | null
          notification_date: string | null
          notification_type: string | null
          scheduled_for: string | null
          sent: boolean | null
          sent_at: string | null
          target_all_users: boolean | null
          target_user_id: string | null
          time_slot: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_text: string
          message_text_ar?: string | null
          notification_date?: string | null
          notification_type?: string | null
          scheduled_for?: string | null
          sent?: boolean | null
          sent_at?: string | null
          target_all_users?: boolean | null
          target_user_id?: string | null
          time_slot?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message_text?: string
          message_text_ar?: string | null
          notification_date?: string | null
          notification_type?: string | null
          scheduled_for?: string | null
          sent?: boolean | null
          sent_at?: string | null
          target_all_users?: boolean | null
          target_user_id?: string | null
          time_slot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_scheduled_notifications_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_scheduled_notifications_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
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
          {
            foreignKeyName: "bolt_completed_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
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
          {
            foreignKeyName: "bolt_daily_code_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
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
      bolt_daily_task_completions: {
        Row: {
          completed_date: string
          created_at: string
          id: string
          points_earned: number
          task_id: string
          user_id: string
        }
        Insert: {
          completed_date?: string
          created_at?: string
          id?: string
          points_earned?: number
          task_id: string
          user_id: string
        }
        Update: {
          completed_date?: string
          created_at?: string
          id?: string
          points_earned?: number
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolt_daily_task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "bolt_daily_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolt_daily_task_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolt_daily_task_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      bolt_daily_tasks: {
        Row: {
          action_url: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          icon: string | null
          id: string
          is_active: boolean
          required_action: string | null
          reward_tokens: number
          task_type: string
          title: string
          title_ar: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          required_action?: string | null
          reward_tokens?: number
          task_type?: string
          title: string
          title_ar: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          required_action?: string | null
          reward_tokens?: number
          task_type?: string
          title?: string
          title_ar?: string
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
          {
            foreignKeyName: "bolt_mining_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
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
            foreignKeyName: "bolt_referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolt_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolt_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
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
          partner_telegram_id: number | null
          partnership_id: string | null
          points: number
          reward_ton: number | null
          reward_usdt: number | null
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
          partner_telegram_id?: number | null
          partnership_id?: string | null
          points?: number
          reward_ton?: number | null
          reward_usdt?: number | null
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
          partner_telegram_id?: number | null
          partnership_id?: string | null
          points?: number
          reward_ton?: number | null
          reward_usdt?: number | null
          task_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolt_tasks_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnership_requests"
            referencedColumns: ["id"]
          },
        ]
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
          bot_blocked: boolean | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          mining_duration_hours: number
          mining_power: number
          notifications_enabled: boolean | null
          photo_url: string | null
          referral_bonus: number
          referred_by: string | null
          telegram_id: number
          telegram_username: string | null
          token_balance: number
          ton_balance: number | null
          total_referrals: number
          updated_at: string
          usdt_balance: number
        }
        Insert: {
          bot_blocked?: boolean | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          mining_duration_hours?: number
          mining_power?: number
          notifications_enabled?: boolean | null
          photo_url?: string | null
          referral_bonus?: number
          referred_by?: string | null
          telegram_id: number
          telegram_username?: string | null
          token_balance?: number
          ton_balance?: number | null
          total_referrals?: number
          updated_at?: string
          usdt_balance?: number
        }
        Update: {
          bot_blocked?: boolean | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          mining_duration_hours?: number
          mining_power?: number
          notifications_enabled?: boolean | null
          photo_url?: string | null
          referral_bonus?: number
          referred_by?: string | null
          telegram_id?: number
          telegram_username?: string | null
          token_balance?: number
          ton_balance?: number | null
          total_referrals?: number
          updated_at?: string
          usdt_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "bolt_users_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolt_users_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
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
      campaign_analytics: {
        Row: {
          campaign_id: string | null
          conversions: number | null
          created_at: string | null
          date: string
          id: string
          messages_clicked: number | null
          messages_delivered: number | null
          messages_opened: number | null
          messages_sent: number | null
        }
        Insert: {
          campaign_id?: string | null
          conversions?: number | null
          created_at?: string | null
          date?: string
          id?: string
          messages_clicked?: number | null
          messages_delivered?: number | null
          messages_opened?: number | null
          messages_sent?: number | null
        }
        Update: {
          campaign_id?: string | null
          conversions?: number | null
          created_at?: string | null
          date?: string
          id?: string
          messages_clicked?: number | null
          messages_delivered?: number | null
          messages_opened?: number | null
          messages_sent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      character_upgrades: {
        Row: {
          bonus_value: number
          character_id: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          description_ru: string | null
          id: string
          is_active: boolean
          name: string
          name_ar: string
          name_ru: string
          price_tokens: number
          price_ton: number
          required_level: number
          upgrade_type: string
        }
        Insert: {
          bonus_value?: number
          character_id?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          description_ru?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_ar: string
          name_ru: string
          price_tokens?: number
          price_ton?: number
          required_level?: number
          upgrade_type: string
        }
        Update: {
          bonus_value?: number
          character_id?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          description_ru?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string
          name_ru?: string
          price_tokens?: number
          price_ton?: number
          required_level?: number
          upgrade_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_upgrades_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "mining_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_participants: {
        Row: {
          contest_id: string
          id: string
          joined_at: string
          last_referral_at: string | null
          referral_count: number
          user_id: string
        }
        Insert: {
          contest_id: string
          id?: string
          joined_at?: string
          last_referral_at?: string | null
          referral_count?: number
          user_id: string
        }
        Update: {
          contest_id?: string
          id?: string
          joined_at?: string
          last_referral_at?: string | null
          referral_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_participants_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "referral_contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_login_rewards: {
        Row: {
          claimed_at: string
          created_at: string
          id: string
          is_doubled: boolean | null
          reward_claimed: number
          streak_day: number
          user_id: string
        }
        Insert: {
          claimed_at?: string
          created_at?: string
          id?: string
          is_doubled?: boolean | null
          reward_claimed?: number
          streak_day?: number
          user_id: string
        }
        Update: {
          claimed_at?: string
          created_at?: string
          id?: string
          is_doubled?: boolean | null
          reward_claimed?: number
          streak_day?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_login_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_login_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_spins: {
        Row: {
          created_at: string
          free_spin_used: boolean | null
          id: string
          paid_spins_count: number | null
          spin_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          free_spin_used?: boolean | null
          id?: string
          paid_spins_count?: number | null
          spin_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          free_spin_used?: boolean | null
          id?: string
          paid_spins_count?: number | null
          spin_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_spins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_spins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      free_server_ad_progress: {
        Row: {
          ads_watched: number | null
          created_at: string | null
          id: string
          unlocked_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ads_watched?: number | null
          created_at?: string | null
          id?: string
          unlocked_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ads_watched?: number | null
          created_at?: string | null
          id?: string
          unlocked_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "free_server_ad_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "free_server_ad_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      game_daily_rewards: {
        Row: {
          claimed_at: string
          day_number: number
          id: string
          player_id: string | null
          reward_amount: number
          reward_type: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          day_number?: number
          id?: string
          player_id?: string | null
          reward_amount: number
          reward_type: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          day_number?: number
          id?: string
          player_id?: string | null
          reward_amount?: number
          reward_type?: string
          user_id?: string
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
          current_skin: string | null
          games_played: number
          highest_score: number
          id: string
          total_score: number
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          coins?: number
          created_at?: string
          current_skin?: string | null
          games_played?: number
          highest_score?: number
          id?: string
          total_score?: number
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          coins?: number
          created_at?: string
          current_skin?: string | null
          games_played?: number
          highest_score?: number
          id?: string
          total_score?: number
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      game_purchases: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          payment_method: string
          player_id: string | null
          price_coins: number | null
          price_ton: number | null
          tx_hash: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          payment_method?: string
          player_id?: string | null
          price_coins?: number | null
          price_ton?: number | null
          tx_hash?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          payment_method?: string
          player_id?: string | null
          price_coins?: number | null
          price_ton?: number | null
          tx_hash?: string | null
          user_id?: string
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
          duration_seconds: number | null
          game_type: string
          id: string
          level: number | null
          player_id: string | null
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          game_type?: string
          id?: string
          level?: number | null
          player_id?: string | null
          score: number
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          game_type?: string
          id?: string
          level?: number | null
          player_id?: string | null
          score?: number
          user_id?: string
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
          description: string | null
          display_name: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price_coins: number
          price_ton: number | null
          rarity: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price_coins?: number
          price_ton?: number | null
          rarity?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price_coins?: number
          price_ton?: number | null
          rarity?: string
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          ai_prompt_context: string | null
          campaign_type: string
          cooldown_hours: number | null
          created_at: string | null
          description: string | null
          description_ar: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          message_template: string | null
          message_template_ar: string | null
          name: string
          name_ar: string | null
          priority: number | null
          send_hour: number | null
          start_date: string | null
          target_segment: string
          trigger_conditions: Json | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          ai_prompt_context?: string | null
          campaign_type?: string
          cooldown_hours?: number | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          message_template?: string | null
          message_template_ar?: string | null
          name: string
          name_ar?: string | null
          priority?: number | null
          send_hour?: number | null
          start_date?: string | null
          target_segment?: string
          trigger_conditions?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Update: {
          ai_prompt_context?: string | null
          campaign_type?: string
          cooldown_hours?: number | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          message_template?: string | null
          message_template_ar?: string | null
          name?: string
          name_ar?: string | null
          priority?: number | null
          send_hour?: number | null
          start_date?: string | null
          target_segment?: string
          trigger_conditions?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_events: {
        Row: {
          campaign_id: string | null
          clicked_at: string | null
          created_at: string | null
          delivery_status: string | null
          event_data: Json | null
          event_type: string
          id: string
          message_sent: string | null
          opened_at: string | null
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivery_status?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          message_sent?: string | null
          opened_at?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivery_status?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          message_sent?: string | null
          opened_at?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          buyer_id: string | null
          created_at: string
          id: string
          price_tokens: number
          price_ton: number
          seller_id: string
          sold_at: string | null
          status: string
          user_character_id: string
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          id?: string
          price_tokens?: number
          price_ton: number
          seller_id: string
          sold_at?: string | null
          status?: string
          user_character_id: string
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          id?: string
          price_tokens?: number
          price_ton?: number
          seller_id?: string
          sold_at?: string | null
          status?: string
          user_character_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_user_character_id_fkey"
            columns: ["user_character_id"]
            isOneToOne: false
            referencedRelation: "user_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      mining_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string | null
          description_ar: string | null
          description_ru: string | null
          ends_at: string
          id: string
          is_active: boolean
          reward_tokens: number
          reward_ton: number
          starts_at: string
          target_value: number
          title: string
          title_ar: string
          title_ru: string
        }
        Insert: {
          challenge_type: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          description_ru?: string | null
          ends_at: string
          id?: string
          is_active?: boolean
          reward_tokens?: number
          reward_ton?: number
          starts_at?: string
          target_value?: number
          title: string
          title_ar: string
          title_ru: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          description_ru?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          reward_tokens?: number
          reward_ton?: number
          starts_at?: string
          target_value?: number
          title?: string
          title_ar?: string
          title_ru?: string
        }
        Relationships: []
      }
      mining_characters: {
        Row: {
          boost_duration_minutes: number
          boost_percentage: number
          created_at: string
          description: string | null
          description_ar: string | null
          description_ru: string | null
          evolution_costs: Json
          extra_coins: number
          id: string
          image_url: string | null
          is_active: boolean
          jackpot_chance_bonus: number
          max_evolution_stages: number
          mining_speed_multiplier: number
          name: string
          name_ar: string
          name_ru: string
          price_tokens: number
          price_ton: number
          tier: string
        }
        Insert: {
          boost_duration_minutes?: number
          boost_percentage?: number
          created_at?: string
          description?: string | null
          description_ar?: string | null
          description_ru?: string | null
          evolution_costs?: Json
          extra_coins?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          jackpot_chance_bonus?: number
          max_evolution_stages?: number
          mining_speed_multiplier?: number
          name: string
          name_ar: string
          name_ru: string
          price_tokens?: number
          price_ton?: number
          tier?: string
        }
        Update: {
          boost_duration_minutes?: number
          boost_percentage?: number
          created_at?: string
          description?: string | null
          description_ar?: string | null
          description_ru?: string | null
          evolution_costs?: Json
          extra_coins?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          jackpot_chance_bonus?: number
          max_evolution_stages?: number
          mining_speed_multiplier?: number
          name?: string
          name_ar?: string
          name_ru?: string
          price_tokens?: number
          price_ton?: number
          tier?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          prompt_context: string
          theme: string
          time_slot: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          prompt_context: string
          theme: string
          time_slot: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          prompt_context?: string
          theme?: string
          time_slot?: string
        }
        Relationships: []
      }
      partnership_requests: {
        Row: {
          approved_at: string | null
          approved_by: number | null
          created_at: string | null
          id: string
          points: number | null
          rejected_reason: string | null
          status: string | null
          task_id: string | null
          task_image: string | null
          task_title: string
          task_url: string
          telegram_id: number
          telegram_username: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: number | null
          created_at?: string | null
          id?: string
          points?: number | null
          rejected_reason?: string | null
          status?: string | null
          task_id?: string | null
          task_image?: string | null
          task_title: string
          task_url: string
          telegram_id: number
          telegram_username?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: number | null
          created_at?: string | null
          id?: string
          points?: number | null
          rejected_reason?: string | null
          status?: string | null
          task_id?: string | null
          task_image?: string | null
          task_title?: string
          task_url?: string
          telegram_id?: number
          telegram_username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partnership_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "bolt_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_contests: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          end_date: string
          id: string
          is_active: boolean
          name: string
          name_ar: string | null
          prize_pool_usd: number
          prizes_config: Json
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          name_ar?: string | null
          prize_pool_usd?: number
          prizes_config?: Json
          start_date: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string | null
          prize_pool_usd?: number
          prizes_config?: Json
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      referral_milestone_rewards: {
        Row: {
          claimed: boolean | null
          claimed_at: string | null
          created_at: string | null
          id: string
          milestone_type: string
          reward_amount: number
          reward_currency: string
          user_id: string
        }
        Insert: {
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          milestone_type: string
          reward_amount: number
          reward_currency: string
          user_id: string
        }
        Update: {
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          milestone_type?: string
          reward_amount?: number
          reward_currency?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_milestone_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_milestone_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      server_inventory: {
        Row: {
          created_at: string | null
          id: string
          server_id: string
          server_name: string
          sold_count: number | null
          total_stock: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          server_id: string
          server_name: string
          sold_count?: number | null
          total_stock: number
        }
        Update: {
          created_at?: string | null
          id?: string
          server_id?: string
          server_name?: string
          sold_count?: number | null
          total_stock?: number
        }
        Relationships: []
      }
      server_purchases: {
        Row: {
          activated_at: string | null
          created_at: string
          expires_at: string | null
          hash_rate: string | null
          id: string
          metadata: Json | null
          payment_id: string | null
          price_ton: number
          server_name: string
          server_tier: string
          status: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          expires_at?: string | null
          hash_rate?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          price_ton: number
          server_name: string
          server_tier?: string
          status?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          expires_at?: string | null
          hash_rate?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          price_ton?: number
          server_name?: string
          server_tier?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "server_purchases_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "ton_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      spin_history: {
        Row: {
          created_at: string
          id: string
          reward_amount: number | null
          reward_type: string
          user_id: string
          wheel_type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          reward_amount?: number | null
          reward_type: string
          user_id: string
          wheel_type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          reward_amount?: number | null
          reward_type?: string
          user_id?: string
          wheel_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spin_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spin_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      stars_payments: {
        Row: {
          amount_stars: number
          amount_usd: number | null
          created_at: string
          id: string
          product_id: string | null
          product_type: string
          status: string
          telegram_id: number
          telegram_payment_id: string | null
          user_id: string
        }
        Insert: {
          amount_stars: number
          amount_usd?: number | null
          created_at?: string
          id?: string
          product_id?: string | null
          product_type: string
          status?: string
          telegram_id: number
          telegram_payment_id?: string | null
          user_id: string
        }
        Update: {
          amount_stars?: number
          amount_usd?: number | null
          created_at?: string
          id?: string
          product_id?: string | null
          product_type?: string
          status?: string
          telegram_id?: number
          telegram_payment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stars_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stars_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      ton_payments: {
        Row: {
          amount_ton: number
          confirmed_at: string | null
          created_at: string
          description: string | null
          destination_address: string
          eth_tx_hash: string | null
          id: string
          metadata: Json | null
          nowpayments_id: string | null
          payment_currency: string | null
          payment_method: string
          product_id: string | null
          product_type: string
          status: string
          tx_hash: string | null
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount_ton: number
          confirmed_at?: string | null
          created_at?: string
          description?: string | null
          destination_address: string
          eth_tx_hash?: string | null
          id?: string
          metadata?: Json | null
          nowpayments_id?: string | null
          payment_currency?: string | null
          payment_method?: string
          product_id?: string | null
          product_type?: string
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount_ton?: number
          confirmed_at?: string | null
          created_at?: string
          description?: string | null
          destination_address?: string
          eth_tx_hash?: string | null
          id?: string
          metadata?: Json | null
          nowpayments_id?: string | null
          payment_currency?: string | null
          payment_method?: string
          product_id?: string | null
          product_type?: string
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          current_value: number
          id: string
          unlocked: boolean
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          current_value?: number
          id?: string
          unlocked?: boolean
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          current_value?: number
          id?: string
          unlocked?: boolean
          unlocked_at?: string | null
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
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      user_boosters: {
        Row: {
          booster_type: string
          created_at: string
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          booster_type: string
          created_at?: string
          expires_at: string
          id?: string
          user_id: string
        }
        Update: {
          booster_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_boosters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_boosters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          current_value: number
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          current_value?: number
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          current_value?: number
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "mining_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      user_characters: {
        Row: {
          character_id: string
          evolution_stage: number
          experience: number
          id: string
          is_active: boolean
          level: number
          purchased_at: string
          user_id: string
        }
        Insert: {
          character_id: string
          evolution_stage?: number
          experience?: number
          id?: string
          is_active?: boolean
          level?: number
          purchased_at?: string
          user_id: string
        }
        Update: {
          character_id?: string
          evolution_stage?: number
          experience?: number
          id?: string
          is_active?: boolean
          level?: number
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "mining_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_characters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_characters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      user_free_spins: {
        Row: {
          created_at: string
          daily_claimed: boolean
          id: string
          last_daily_claim: string | null
          total_spins: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_claimed?: boolean
          id?: string
          last_daily_claim?: string | null
          total_spins?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_claimed?: boolean
          id?: string
          last_daily_claim?: string | null
          total_spins?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_segments: {
        Row: {
          auto_update: boolean | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_updated: string | null
          name: string
          name_ar: string | null
          rules: Json
          segment_key: string
          user_count: number | null
        }
        Insert: {
          auto_update?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          name: string
          name_ar?: string | null
          rules?: Json
          segment_key: string
          user_count?: number | null
        }
        Update: {
          auto_update?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          name?: string
          name_ar?: string | null
          rules?: Json
          segment_key?: string
          user_count?: number | null
        }
        Relationships: []
      }
      user_servers: {
        Row: {
          daily_bolt_yield: number
          daily_usdt_yield: number
          hash_rate: string
          id: string
          is_active: boolean
          last_claim_at: string | null
          purchased_at: string
          server_name: string
          server_tier: string
          user_id: string
        }
        Insert: {
          daily_bolt_yield?: number
          daily_usdt_yield?: number
          hash_rate: string
          id?: string
          is_active?: boolean
          last_claim_at?: string | null
          purchased_at?: string
          server_name: string
          server_tier?: string
          user_id: string
        }
        Update: {
          daily_bolt_yield?: number
          daily_usdt_yield?: number
          hash_rate?: string
          id?: string
          is_active?: boolean
          last_claim_at?: string | null
          purchased_at?: string
          server_name?: string
          server_tier?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_servers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_servers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      user_spin_tickets: {
        Row: {
          created_at: string
          free_ticket_date: string | null
          id: string
          pro_tickets_count: number | null
          tickets_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          free_ticket_date?: string | null
          id?: string
          pro_tickets_count?: number | null
          tickets_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          free_ticket_date?: string | null
          id?: string
          pro_tickets_count?: number | null
          tickets_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_spin_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_spin_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      user_upgrades: {
        Row: {
          id: string
          purchased_at: string
          upgrade_id: string
          user_id: string
        }
        Insert: {
          id?: string
          purchased_at?: string
          upgrade_id: string
          user_id: string
        }
        Update: {
          id?: string
          purchased_at?: string
          upgrade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_upgrades_upgrade_id_fkey"
            columns: ["upgrade_id"]
            isOneToOne: false
            referencedRelation: "character_upgrades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_upgrades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_upgrades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          currency: string
          id: string
          processed_at: string | null
          status: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          currency: string
          id?: string
          processed_at?: string | null
          status?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          processed_at?: string | null
          status?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bolt_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_leaderboard: {
        Row: {
          display_name: string | null
          id: string | null
          mining_power: number | null
          photo_url: string | null
          token_balance: number | null
          total_referrals: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_action: string
          p_identifier: string
          p_max_requests?: number
          p_window_seconds?: number
        }
        Returns: boolean
      }
      get_contest_leaderboard: {
        Args: { contest: string; limit_count?: number }
        Returns: {
          first_name: string
          photo_url: string
          rank: number
          referral_count: number
          telegram_username: string
        }[]
      }
      get_current_telegram_id: { Args: never; Returns: string }
      get_current_user_uuid: { Args: never; Returns: string }
      get_my_user_data: {
        Args: { p_telegram_id: number }
        Returns: {
          created_at: string
          first_name: string
          id: string
          last_name: string
          mining_duration_hours: number
          mining_power: number
          photo_url: string
          referral_bonus: number
          telegram_username: string
          token_balance: number
          total_referrals: number
          updated_at: string
          usdt_balance: number
        }[]
      }
      get_scores_leaderboard: {
        Args: { game?: string; limit_count?: number }
        Returns: {
          created_at: string
          score: number
          username: string
        }[]
      }
      get_telegram_user_id: { Args: never; Returns: string }
      get_telegram_user_id_text: { Args: never; Returns: string }
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
