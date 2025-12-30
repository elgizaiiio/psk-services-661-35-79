-- Create daily login rewards table
CREATE TABLE IF NOT EXISTS public.daily_login_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  streak_day integer NOT NULL DEFAULT 1,
  reward_claimed numeric NOT NULL DEFAULT 0,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_login_rewards ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only see their own rewards
CREATE POLICY "Users can view own login rewards"
ON public.daily_login_rewards FOR SELECT
USING (user_id = public.get_telegram_user_id());

CREATE POLICY "Users can insert own login rewards"
ON public.daily_login_rewards FOR INSERT
WITH CHECK (user_id = public.get_telegram_user_id());

-- Add streak columns to bolt_user_streaks if not exist (check if table exists)
-- If bolt_user_streaks already has streak data, we'll use that

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_daily_login_rewards_user_id ON public.daily_login_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_login_rewards_claimed_at ON public.daily_login_rewards(claimed_at DESC);