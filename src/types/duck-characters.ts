export type DuckRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type DuckMood = 'happy' | 'cool' | 'smart' | 'sleepy' | 'excited' | 'angry' | 'loving' | 'greedy' | 'heroic' | 'mystical' | 'adventurous' | 'royal';

export interface DuckStats {
  power: number;
  speed: number;
  luck: number;
}

export interface DuckCharacter {
  id: string;
  name: string;
  nameAr: string;
  personality: string;
  personalityAr: string;
  emoji: string;
  color: string;
  mood: DuckMood;
  description: string;
  descriptionAr: string;
  rarity: DuckRarity;
  stats: DuckStats;
  stickerId: string;
  stickerUrl: string;
}
