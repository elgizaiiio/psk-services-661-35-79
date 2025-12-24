-- جدول الشخصيات المتاحة
CREATE TABLE public.mining_characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  description_ru TEXT,
  tier TEXT NOT NULL DEFAULT 'beginner', -- beginner, professional, expert
  mining_speed_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  boost_percentage INTEGER NOT NULL DEFAULT 10,
  boost_duration_minutes INTEGER NOT NULL DEFAULT 10,
  extra_coins INTEGER NOT NULL DEFAULT 0,
  jackpot_chance_bonus NUMERIC NOT NULL DEFAULT 0,
  price_ton NUMERIC NOT NULL DEFAULT 0,
  price_tokens INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الشخصيات المملوكة للمستخدمين
CREATE TABLE public.user_characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.mining_characters(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  experience INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, character_id)
);

-- جدول الترقيات المتاحة
CREATE TABLE public.character_upgrades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID REFERENCES public.mining_characters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  description_ru TEXT,
  upgrade_type TEXT NOT NULL, -- speed, boost, coins, jackpot
  bonus_value NUMERIC NOT NULL DEFAULT 0,
  required_level INTEGER NOT NULL DEFAULT 1,
  price_ton NUMERIC NOT NULL DEFAULT 0,
  price_tokens INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الترقيات المملوكة
CREATE TABLE public.user_upgrades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  upgrade_id UUID NOT NULL REFERENCES public.character_upgrades(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, upgrade_id)
);

-- جدول التحديات
CREATE TABLE public.mining_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  description_ru TEXT,
  challenge_type TEXT NOT NULL, -- daily, weekly, special
  target_value INTEGER NOT NULL DEFAULT 100,
  reward_tokens INTEGER NOT NULL DEFAULT 0,
  reward_ton NUMERIC NOT NULL DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول تقدم التحديات للمستخدمين
CREATE TABLE public.user_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.mining_challenges(id) ON DELETE CASCADE,
  current_value INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- جدول الإنجازات
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  description_ru TEXT,
  icon TEXT,
  category TEXT NOT NULL, -- mining, characters, challenges, social
  target_value INTEGER NOT NULL DEFAULT 1,
  reward_tokens INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إنجازات المستخدمين
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  current_value INTEGER NOT NULL DEFAULT 0,
  unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- جدول السوق (عروض البيع)
CREATE TABLE public.marketplace_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  user_character_id UUID NOT NULL REFERENCES public.user_characters(id) ON DELETE CASCADE,
  price_ton NUMERIC NOT NULL,
  price_tokens INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active, sold, cancelled
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sold_at TIMESTAMP WITH TIME ZONE,
  buyer_id UUID REFERENCES public.bolt_users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.mining_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_upgrades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_upgrades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mining_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mining_characters (public read)
CREATE POLICY "Characters are viewable by everyone" ON public.mining_characters FOR SELECT USING (true);

-- RLS Policies for user_characters
CREATE POLICY "Users can view their own characters" ON public.user_characters FOR SELECT USING (true);
CREATE POLICY "Users can insert their own characters" ON public.user_characters FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own characters" ON public.user_characters FOR UPDATE USING (true);

-- RLS Policies for character_upgrades (public read)
CREATE POLICY "Upgrades are viewable by everyone" ON public.character_upgrades FOR SELECT USING (true);

-- RLS Policies for user_upgrades
CREATE POLICY "Users can view their own upgrades" ON public.user_upgrades FOR SELECT USING (true);
CREATE POLICY "Users can insert their own upgrades" ON public.user_upgrades FOR INSERT WITH CHECK (true);

-- RLS Policies for mining_challenges (public read)
CREATE POLICY "Challenges are viewable by everyone" ON public.mining_challenges FOR SELECT USING (true);

-- RLS Policies for user_challenges
CREATE POLICY "Users can view their own challenges" ON public.user_challenges FOR SELECT USING (true);
CREATE POLICY "Users can insert their own challenges" ON public.user_challenges FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own challenges" ON public.user_challenges FOR UPDATE USING (true);

-- RLS Policies for achievements (public read)
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements FOR SELECT USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own achievements" ON public.user_achievements FOR UPDATE USING (true);

-- RLS Policies for marketplace_listings
CREATE POLICY "Marketplace listings are viewable by everyone" ON public.marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Users can create listings" ON public.marketplace_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their listings" ON public.marketplace_listings FOR UPDATE USING (true);

-- Insert default characters
INSERT INTO public.mining_characters (name, name_ar, name_ru, tier, mining_speed_multiplier, boost_percentage, boost_duration_minutes, extra_coins, jackpot_chance_bonus, price_ton, price_tokens, image_url) VALUES
('Beginner Miner', 'المعدّن المبتدئ', 'Начинающий майнер', 'beginner', 1.0, 10, 10, 0, 0, 0, 0, '🧑‍🔧'),
('Professional Miner', 'المعدّن المحترف', 'Профессиональный майнер', 'professional', 2.0, 20, 30, 1, 0, 0.5, 5000, '👷'),
('Expert Miner', 'المعدّن الخبير', 'Эксперт майнер', 'expert', 3.0, 30, 60, 2, 10, 1.0, 15000, '🦸'),
('Master Miner', 'المعدّن الأسطوري', 'Мастер майнер', 'master', 5.0, 50, 120, 5, 25, 2.5, 50000, '🧙'),
('Legendary Miner', 'المعدّن الأسطوري', 'Легендарный майнер', 'legendary', 10.0, 100, 240, 10, 50, 5.0, 100000, '👑');

-- Insert default achievements
INSERT INTO public.achievements (name, name_ar, name_ru, description, description_ar, description_ru, icon, category, target_value, reward_tokens) VALUES
('First Mining', 'التعدين الأول', 'Первый майнинг', 'Complete your first mining session', 'أكمل جلسة التعدين الأولى', 'Завершите первую сессию майнинга', '⛏️', 'mining', 1, 100),
('Mining Veteran', 'محارب التعدين', 'Ветеран майнинга', 'Complete 100 mining sessions', 'أكمل 100 جلسة تعدين', 'Завершите 100 сессий майнинга', '🏆', 'mining', 100, 5000),
('Character Collector', 'جامع الشخصيات', 'Коллекционер персонажей', 'Own 5 different characters', 'امتلك 5 شخصيات مختلفة', 'Владейте 5 разными персонажами', '🎭', 'characters', 5, 2000),
('Challenge Master', 'سيد التحديات', 'Мастер вызовов', 'Complete 10 challenges', 'أكمل 10 تحديات', 'Завершите 10 вызовов', '🎯', 'challenges', 10, 3000),
('Social Butterfly', 'الفراشة الاجتماعية', 'Социальная бабочка', 'Refer 10 friends', 'قم بدعوة 10 أصدقاء', 'Пригласите 10 друзей', '🦋', 'social', 10, 5000);