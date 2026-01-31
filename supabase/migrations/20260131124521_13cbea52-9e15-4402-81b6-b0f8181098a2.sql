-- Bolt Town Daily Competition Tables

-- Table for daily points tracking
CREATE TABLE public.bolt_town_daily_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  referral_points INTEGER NOT NULL DEFAULT 0,
  referral_bonus_points INTEGER NOT NULL DEFAULT 0,
  task_points INTEGER NOT NULL DEFAULT 0,
  special_task_points INTEGER NOT NULL DEFAULT 0,
  ad_points INTEGER NOT NULL DEFAULT 0,
  activity_points INTEGER NOT NULL DEFAULT 0,
  streak_bonus INTEGER NOT NULL DEFAULT 0,
  special_task_done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bolt_town_daily_points_user_date_unique UNIQUE(user_id, date)
);

-- Add generated column for total points
ALTER TABLE public.bolt_town_daily_points 
ADD COLUMN total_points INTEGER GENERATED ALWAYS AS 
  (referral_points + referral_bonus_points + task_points + special_task_points + ad_points + activity_points + streak_bonus) STORED;

-- Table for daily winners history
CREATE TABLE public.bolt_town_daily_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  telegram_username TEXT,
  wallet_address TEXT,
  date DATE NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  prize_usdt NUMERIC(10,2) NOT NULL DEFAULT 2.5,
  admin_notified BOOLEAN NOT NULL DEFAULT FALSE,
  all_users_notified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_bolt_town_points_date ON public.bolt_town_daily_points(date, total_points DESC);
CREATE INDEX idx_bolt_town_points_user ON public.bolt_town_daily_points(user_id, date);
CREATE INDEX idx_bolt_town_winners_date ON public.bolt_town_daily_winners(date DESC);

-- Enable RLS
ALTER TABLE public.bolt_town_daily_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolt_town_daily_winners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bolt_town_daily_points
CREATE POLICY "Users can view all daily points for leaderboard"
  ON public.bolt_town_daily_points
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own points"
  ON public.bolt_town_daily_points
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own points"
  ON public.bolt_town_daily_points
  FOR UPDATE
  USING (true);

-- RLS Policies for bolt_town_daily_winners
CREATE POLICY "Anyone can view winners"
  ON public.bolt_town_daily_winners
  FOR SELECT
  USING (true);

CREATE POLICY "System can insert winners"
  ON public.bolt_town_daily_winners
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update winners"
  ON public.bolt_town_daily_winners
  FOR UPDATE
  USING (true);

-- Enable realtime for leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.bolt_town_daily_points;