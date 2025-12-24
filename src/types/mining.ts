export interface MiningCharacter {
  id: string;
  name: string;
  name_ar: string;
  name_ru: string;
  description: string | null;
  description_ar: string | null;
  description_ru: string | null;
  tier: 'beginner' | 'professional' | 'expert' | 'master' | 'legendary';
  mining_speed_multiplier: number;
  boost_percentage: number;
  boost_duration_minutes: number;
  extra_coins: number;
  jackpot_chance_bonus: number;
  price_ton: number;
  price_tokens: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UserCharacter {
  id: string;
  user_id: string;
  character_id: string;
  level: number;
  experience: number;
  is_active: boolean;
  purchased_at: string;
  character?: MiningCharacter;
}

export interface CharacterUpgrade {
  id: string;
  character_id: string | null;
  name: string;
  name_ar: string;
  name_ru: string;
  description: string | null;
  description_ar: string | null;
  description_ru: string | null;
  upgrade_type: 'speed' | 'boost' | 'coins' | 'jackpot';
  bonus_value: number;
  required_level: number;
  price_ton: number;
  price_tokens: number;
  is_active: boolean;
  created_at: string;
}

export interface UserUpgrade {
  id: string;
  user_id: string;
  upgrade_id: string;
  purchased_at: string;
  upgrade?: CharacterUpgrade;
}

export interface MiningChallenge {
  id: string;
  title: string;
  title_ar: string;
  title_ru: string;
  description: string | null;
  description_ar: string | null;
  description_ru: string | null;
  challenge_type: 'daily' | 'weekly' | 'special';
  target_value: number;
  reward_tokens: number;
  reward_ton: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  current_value: number;
  completed: boolean;
  completed_at: string | null;
  joined_at: string;
  challenge?: MiningChallenge;
}

export interface Achievement {
  id: string;
  name: string;
  name_ar: string;
  name_ru: string;
  description: string | null;
  description_ar: string | null;
  description_ru: string | null;
  icon: string | null;
  category: 'mining' | 'characters' | 'challenges' | 'social';
  target_value: number;
  reward_tokens: number;
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  current_value: number;
  unlocked: boolean;
  unlocked_at: string | null;
  created_at: string;
  achievement?: Achievement;
}

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  user_character_id: string;
  price_ton: number;
  price_tokens: number;
  status: 'active' | 'sold' | 'cancelled';
  created_at: string;
  sold_at: string | null;
  buyer_id: string | null;
  user_character?: UserCharacter;
  seller?: {
    telegram_username: string | null;
    first_name: string | null;
  };
}
