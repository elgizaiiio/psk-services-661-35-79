-- Add evolution stages column to user_characters for tracking current evolution level
ALTER TABLE public.user_characters ADD COLUMN IF NOT EXISTS evolution_stage integer NOT NULL DEFAULT 1;

-- Add max_evolution_stages to mining_characters
ALTER TABLE public.mining_characters ADD COLUMN IF NOT EXISTS max_evolution_stages integer NOT NULL DEFAULT 3;

-- Add evolution_costs as JSONB array to mining_characters (e.g. [100, 200, 400])
ALTER TABLE public.mining_characters ADD COLUMN IF NOT EXISTS evolution_costs jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Update existing characters or insert new ones with the new character system
-- First, delete all existing characters to start fresh
DELETE FROM public.user_characters;
DELETE FROM public.mining_characters;

-- Insert the new characters as per user's request
INSERT INTO public.mining_characters (
  name, name_ar, name_ru, 
  description, description_ar, description_ru,
  tier, mining_speed_multiplier, boost_percentage, boost_duration_minutes,
  extra_coins, jackpot_chance_bonus, 
  price_ton, price_tokens, 
  image_url, is_active,
  max_evolution_stages, evolution_costs
) VALUES
-- Bolt Starter (FREE)
(
  'Bolt Starter', 'بولت ستارتر', 'Болт Стартер',
  'Your first mining companion. Free to claim!', 'رفيقك الأول في التعدين. مجاني!', 'Ваш первый помощник в майнинге. Бесплатно!',
  'beginner', 1.0, 10, 10,
  0, 0,
  0, 0,
  '⚡', true,
  3, '[100, 200, 400]'
),
-- Shadow Runner (1000 BOLT)
(
  'Shadow Runner', 'شادو رانر', 'Теневой Бегун',
  'A mysterious character with enhanced speed', 'شخصية غامضة ذات سرعة محسنة', 'Загадочный персонаж с улучшенной скоростью',
  'professional', 1.5, 20, 15,
  10, 2,
  0, 1000,
  '🥷', true,
  5, '[300, 600, 1200, 2400, 4800]'
),
-- Crystal Mage (2000 BOLT)
(
  'Crystal Mage', 'كريستال ماج', 'Кристальный Маг',
  'A magical character with bonus rewards', 'شخصية سحرية مع مكافآت إضافية', 'Магический персонаж с бонусными наградами',
  'expert', 2.0, 30, 20,
  25, 5,
  0, 2000,
  '🔮', true,
  4, '[500, 1000, 2000, 4000]'
),
-- Cyber Ninja (3000 BOLT)
(
  'Cyber Ninja', 'سايبر نينجا', 'Кибер Ниндзя',
  'Futuristic ninja with maximum mining power', 'نينجا مستقبلي بأقصى قوة تعدين', 'Футуристический ниндзя с максимальной мощностью майнинга',
  'legendary', 3.0, 50, 30,
  50, 10,
  0, 3000,
  '🤖', true,
  6, '[600, 1200, 2400, 4800, 9600, 19200]'
);