-- Create core tables for HTML5 2048-like game with monetization via TON
-- 1) game_players: player state (energy, balances, skin)
-- 2) game_purchases: record of in-game purchases (energy, boosters, skins, streak restore, tournament entry)
-- 3) game_scores: scores for weekly leaderboard
-- 4) game_skins: available skins
-- 5) game_daily_rewards: track daily rewards and streaks
-- 6) game_tournaments (minimal) and game_tournament_entries (optional for MVP)

-- Use validation triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- game_players
CREATE TABLE IF NOT EXISTS public.game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL,
  telegram_id BIGINT NULL,
  username TEXT NULL,
  energy INTEGER NOT NULL DEFAULT 5,
  max_energy INTEGER NOT NULL DEFAULT 5,
  energy_refill_rate_minutes INTEGER NOT NULL DEFAULT 10,
  last_energy_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ton_balance NUMERIC(20,8) NOT NULL DEFAULT 0,
  coins NUMERIC(20,8) NOT NULL DEFAULT 0,
  current_skin TEXT NOT NULL DEFAULT 'classic',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_players_telegram ON public.game_players (telegram_id);
CREATE INDEX IF NOT EXISTS idx_game_players_user ON public.game_players (user_id);

CREATE TRIGGER trg_game_players_updated_at
BEFORE UPDATE ON public.game_players
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- game_purchases
CREATE TABLE IF NOT EXISTS public.game_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.game_players(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- energy | booster | skin | streak_restore | tournament_entry | energy_spend
  item_key TEXT NULL,
  amount_ton NUMERIC(20,8) NOT NULL DEFAULT 0,
  tx_hash TEXT NULL,
  status TEXT NOT NULL DEFAULT 'completed', -- pending|completed|failed
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_purchases_player ON public.game_purchases (player_id);

-- game_scores (weekly)
CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.game_players(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  week_start DATE NOT NULL DEFAULT date_trunc('week', now())::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_scores_week ON public.game_scores (week_start);
CREATE INDEX IF NOT EXISTS idx_game_scores_player ON public.game_scores (player_id);

-- game_skins (catalog)
CREATE TABLE IF NOT EXISTS public.game_skins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skin_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price_ton NUMERIC(20,8) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- game_daily_rewards
CREATE TABLE IF NOT EXISTS public.game_daily_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.game_players(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  day_index INTEGER NOT NULL DEFAULT 1, -- 1..7 streak position
  streak_count INTEGER NOT NULL DEFAULT 1,
  reward_type TEXT NOT NULL DEFAULT 'coins',
  reward_amount NUMERIC(20,8) NOT NULL DEFAULT 1,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_daily_rewards_player_date ON public.game_daily_rewards (player_id, date);

-- Minimal tournaments (optional)
CREATE TABLE IF NOT EXISTS public.game_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  week_start DATE NOT NULL DEFAULT date_trunc('week', now())::date,
  entry_fee_ton NUMERIC(20,8) NOT NULL DEFAULT 0.1,
  prize_pool_ton NUMERIC(20,8) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.game_tournament_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.game_tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.game_players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_tournament_entries ENABLE ROW LEVEL SECURITY;

-- Policies
-- Public can read skins and weekly leaderboard; writes happen via service-role in Edge Functions
CREATE POLICY "Public can read active skins" ON public.game_skins
FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read weekly leaderboard" ON public.game_scores
FOR SELECT USING (true);

-- Block direct writes from anon by default (no permissive write policies). Edge Functions will use service role.
-- Minimal read policy for tournaments
CREATE POLICY "Public can read active tournaments" ON public.game_tournaments
FOR SELECT USING (is_active = true);

-- Optional read-only for purchases for the owner if authenticated; here we disable until auth is used
-- All other tables will be accessed via Edge Functions with service role key.
