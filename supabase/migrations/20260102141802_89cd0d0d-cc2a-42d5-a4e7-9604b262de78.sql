-- Add ton_balance column to bolt_users
ALTER TABLE public.bolt_users ADD COLUMN IF NOT EXISTS ton_balance NUMERIC DEFAULT 0;

-- Create referral milestone rewards table
CREATE TABLE IF NOT EXISTS public.referral_milestone_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL, -- 'invite_3' or 'invite_10'
  reward_currency TEXT NOT NULL, -- 'TON' or 'USDT'
  reward_amount NUMERIC NOT NULL,
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, milestone_type)
);

-- Enable RLS
ALTER TABLE public.referral_milestone_rewards ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_milestone_rewards
CREATE POLICY "Users can view their own milestone rewards"
ON public.referral_milestone_rewards
FOR SELECT
USING (user_id = public.get_telegram_user_id());

-- Create AI dynamic offers table
CREATE TABLE IF NOT EXISTS public.ai_dynamic_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_type TEXT NOT NULL, -- 'slots_discount', 'spin_bonus', 'token_multiplier'
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  discount_percent NUMERIC DEFAULT 0,
  bonus_multiplier NUMERIC DEFAULT 1,
  min_purchase NUMERIC DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_by_ai BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for offers (public read)
ALTER TABLE public.ai_dynamic_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active offers"
ON public.ai_dynamic_offers
FOR SELECT
USING (is_active = true);

-- Create AI scheduled notifications table
CREATE TABLE IF NOT EXISTS public.ai_scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  target_all_users BOOLEAN DEFAULT false,
  message_text TEXT NOT NULL,
  message_text_ar TEXT,
  notification_type TEXT DEFAULT 'general', -- 'offer', 'reminder', 'achievement', 'general'
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Only service role can manage notifications
CREATE POLICY "Service role can manage notifications"
ON public.ai_scheduled_notifications
FOR ALL
USING (true)
WITH CHECK (true);