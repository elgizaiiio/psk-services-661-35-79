export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export interface ViralUser {
  id: string;
  telegram_id: number;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  token_balance: number;
  mining_power_multiplier: number;
  mining_duration_hours: number;
  created_at: string;
  updated_at: string;
}

export interface MiningSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  tokens_per_hour: number;
  mining_power_multiplier: number;
  total_tokens_mined: number;
  is_active: boolean;
  completed_at?: string;
  created_at: string;
}

export interface UpgradeType {
  id: string;
  user_id: string;
  upgrade_type: 'mining_power' | 'mining_duration';
  upgrade_level: number;
  cost_ton: number;
  transaction_hash?: string;
  created_at: string;
}