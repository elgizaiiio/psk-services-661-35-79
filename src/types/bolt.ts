export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export interface BoltUser {
  id: string;
  telegram_id: number;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  token_balance: number;
  mining_power: number;
  mining_duration_hours: number;
  total_referrals: number;
  referral_bonus: number;
  created_at: string;
  updated_at: string;
}

export interface BoltMiningSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  tokens_per_hour: number;
  mining_power: number;
  total_mined: number;
  is_active: boolean;
  completed_at?: string;
  created_at: string;
}

export interface BoltTask {
  id: string;
  title: string;
  description?: string;
  points: number;
  task_url?: string;
  icon?: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface BoltCompletedTask {
  id: string;
  user_id: string;
  task_id: string;
  points_earned: number;
  completed_at: string;
}

export interface BoltReferral {
  id: string;
  referrer_id: string;
  referred_id: string;
  bonus_earned: number;
  status: string;
  created_at: string;
}

export interface BoltDailyCode {
  id: string;
  code1: string;
  code2: string;
  code3: string;
  code4: string;
  points_reward: number;
  date: string;
  created_at: string;
}

export interface BoltDailyCodeAttempt {
  id: string;
  user_id: string;
  date: string;
  points_earned: number;
  completed_at?: string;
  created_at: string;
}
