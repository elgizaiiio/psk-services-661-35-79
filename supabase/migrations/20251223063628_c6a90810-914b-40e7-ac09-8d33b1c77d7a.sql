
-- جدول السلاسل اليومية (Daily Streaks)
CREATE TABLE public.bolt_user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  last_claim_at TIMESTAMP WITH TIME ZONE,
  streak_restored_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- جدول العروض المحدودة (Flash Offers)
CREATE TABLE public.bolt_flash_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  original_price NUMERIC NOT NULL,
  discounted_price NUMERIC NOT NULL,
  discount_percent INTEGER NOT NULL,
  product_type TEXT NOT NULL DEFAULT 'upgrade',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_claims INTEGER DEFAULT 100,
  current_claims INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول مستويات المستخدمين (User Levels)
CREATE TABLE public.bolt_user_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  rank_title TEXT NOT NULL DEFAULT 'Bronze Miner',
  unlocked_features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- جدول الإشعارات الاجتماعية (Social Notifications)
CREATE TABLE public.bolt_social_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT,
  action_type TEXT NOT NULL,
  amount NUMERIC,
  product_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول صناديق الحظ (Lucky Boxes)
CREATE TABLE public.bolt_lucky_boxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  possible_rewards JSONB NOT NULL DEFAULT '[]'::jsonb,
  price_ton NUMERIC NOT NULL DEFAULT 0.1,
  win_chance INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول VIP
CREATE TABLE public.bolt_vip_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tier TEXT NOT NULL DEFAULT 'bronze',
  benefits JSONB DEFAULT '[]'::jsonb,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- جدول سجل الترقيات المشتراة
CREATE TABLE public.bolt_upgrade_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  upgrade_type TEXT NOT NULL,
  amount_paid NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bolt_user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolt_flash_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolt_user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolt_social_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolt_lucky_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolt_vip_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolt_upgrade_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bolt_user_streaks
CREATE POLICY "Anyone can view streaks" ON public.bolt_user_streaks FOR SELECT USING (true);
CREATE POLICY "Anyone can insert streaks" ON public.bolt_user_streaks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update streaks" ON public.bolt_user_streaks FOR UPDATE USING (true);

-- RLS Policies for bolt_flash_offers
CREATE POLICY "Anyone can view offers" ON public.bolt_flash_offers FOR SELECT USING (true);
CREATE POLICY "Anyone can update offers" ON public.bolt_flash_offers FOR UPDATE USING (true);

-- RLS Policies for bolt_user_levels
CREATE POLICY "Anyone can view levels" ON public.bolt_user_levels FOR SELECT USING (true);
CREATE POLICY "Anyone can insert levels" ON public.bolt_user_levels FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update levels" ON public.bolt_user_levels FOR UPDATE USING (true);

-- RLS Policies for bolt_social_notifications
CREATE POLICY "Anyone can view notifications" ON public.bolt_social_notifications FOR SELECT USING (true);
CREATE POLICY "Anyone can insert notifications" ON public.bolt_social_notifications FOR INSERT WITH CHECK (true);

-- RLS Policies for bolt_lucky_boxes
CREATE POLICY "Anyone can view lucky boxes" ON public.bolt_lucky_boxes FOR SELECT USING (true);

-- RLS Policies for bolt_vip_tiers
CREATE POLICY "Anyone can view vip" ON public.bolt_vip_tiers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert vip" ON public.bolt_vip_tiers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update vip" ON public.bolt_vip_tiers FOR UPDATE USING (true);

-- RLS Policies for bolt_upgrade_purchases
CREATE POLICY "Anyone can view purchases" ON public.bolt_upgrade_purchases FOR SELECT USING (true);
CREATE POLICY "Anyone can insert purchases" ON public.bolt_upgrade_purchases FOR INSERT WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_bolt_user_streaks_updated_at BEFORE UPDATE ON public.bolt_user_streaks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bolt_user_levels_updated_at BEFORE UPDATE ON public.bolt_user_levels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bolt_vip_tiers_updated_at BEFORE UPDATE ON public.bolt_vip_tiers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample flash offers
INSERT INTO public.bolt_flash_offers (title, description, original_price, discounted_price, discount_percent, product_type, ends_at, max_claims)
VALUES 
  ('⚡ Power Boost Flash Sale', 'Double your mining power for 50% off!', 1.0, 0.5, 50, 'power_upgrade', now() + interval '24 hours', 50),
  ('🚀 Duration Mega Deal', 'Extend mining to 12h at 40% discount!', 0.8, 0.48, 40, 'duration_upgrade', now() + interval '12 hours', 30),
  ('👑 VIP Starter Pack', 'Get VIP status + bonus tokens!', 2.0, 1.2, 40, 'vip_pack', now() + interval '48 hours', 20);

-- Insert sample lucky boxes
INSERT INTO public.bolt_lucky_boxes (name, rarity, possible_rewards, price_ton, win_chance)
VALUES 
  ('Bronze Box', 'common', '[{"type": "tokens", "amount": 50}, {"type": "tokens", "amount": 100}, {"type": "power_boost", "duration": "1h"}]', 0.05, 70),
  ('Silver Box', 'rare', '[{"type": "tokens", "amount": 200}, {"type": "tokens", "amount": 500}, {"type": "power_boost", "duration": "4h"}]', 0.15, 50),
  ('Gold Box', 'epic', '[{"type": "tokens", "amount": 1000}, {"type": "duration_upgrade", "hours": 4}, {"type": "vip_day", "days": 1}]', 0.5, 30),
  ('Diamond Box', 'legendary', '[{"type": "tokens", "amount": 5000}, {"type": "power_upgrade", "multiplier": 2}, {"type": "vip_week", "days": 7}]', 1.0, 15);
