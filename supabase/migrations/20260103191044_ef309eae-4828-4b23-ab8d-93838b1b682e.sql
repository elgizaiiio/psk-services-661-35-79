-- Create table to track ad progress for free server unlock
CREATE TABLE public.free_server_ad_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  ads_watched INTEGER DEFAULT 0,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.free_server_ad_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies using telegram_id from JWT
CREATE POLICY "Users can view own ad progress"
ON public.free_server_ad_progress FOR SELECT
USING (user_id IN (
  SELECT id FROM public.bolt_users 
  WHERE telegram_id = NULLIF(current_setting('request.jwt.claims', true)::json->>'telegram_id', '')::bigint
));

CREATE POLICY "Users can insert own ad progress"
ON public.free_server_ad_progress FOR INSERT
WITH CHECK (user_id IN (
  SELECT id FROM public.bolt_users 
  WHERE telegram_id = NULLIF(current_setting('request.jwt.claims', true)::json->>'telegram_id', '')::bigint
));

CREATE POLICY "Users can update own ad progress"
ON public.free_server_ad_progress FOR UPDATE
USING (user_id IN (
  SELECT id FROM public.bolt_users 
  WHERE telegram_id = NULLIF(current_setting('request.jwt.claims', true)::json->>'telegram_id', '')::bigint
));

-- Add is_doubled column to daily_login_rewards
ALTER TABLE public.daily_login_rewards 
ADD COLUMN IF NOT EXISTS is_doubled BOOLEAN DEFAULT FALSE;