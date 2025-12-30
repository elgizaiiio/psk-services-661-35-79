-- Drop existing user_free_spins policies first
DROP POLICY IF EXISTS "Users view own free spins" ON public.user_free_spins;
DROP POLICY IF EXISTS "Users insert own free spins" ON public.user_free_spins;
DROP POLICY IF EXISTS "Users update own free spins" ON public.user_free_spins;

-- Recreate with proper restrictions
CREATE POLICY "Users view own free spins"
ON public.user_free_spins
FOR SELECT
USING (user_id = get_current_telegram_id());

CREATE POLICY "Users insert own free spins"
ON public.user_free_spins
FOR INSERT
WITH CHECK (user_id = get_current_telegram_id());

CREATE POLICY "Users update own free spins"
ON public.user_free_spins
FOR UPDATE
USING (user_id = get_current_telegram_id());

-- Fix game_scores - create leaderboard function
DROP POLICY IF EXISTS "Anyone can view game scores" ON public.game_scores;
DROP POLICY IF EXISTS "Anyone can insert game scores" ON public.game_scores;
DROP POLICY IF EXISTS "Users view own game scores" ON public.game_scores;
DROP POLICY IF EXISTS "Users insert own game scores" ON public.game_scores;

CREATE POLICY "Users view own game scores"
ON public.game_scores
FOR SELECT
USING (user_id = get_current_telegram_id());

CREATE POLICY "Users insert own game scores"
ON public.game_scores
FOR INSERT
WITH CHECK (user_id = get_current_telegram_id());

-- Create secure leaderboard function for game scores
CREATE OR REPLACE FUNCTION get_scores_leaderboard(game text DEFAULT '2048', limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  username text,
  score bigint,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(gp.username, 'Anonymous'),
    gs.score,
    gs.created_at
  FROM game_scores gs
  LEFT JOIN game_players gp ON gs.user_id = gp.user_id
  WHERE gs.game_type = game
  ORDER BY gs.score DESC
  LIMIT limit_count;
$$;

-- Create contest leaderboard function
CREATE OR REPLACE FUNCTION get_contest_leaderboard(contest uuid, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  rank bigint,
  telegram_username text,
  first_name text,
  photo_url text,
  referral_count integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ROW_NUMBER() OVER (ORDER BY cp.referral_count DESC),
    bu.telegram_username,
    bu.first_name,
    bu.photo_url,
    cp.referral_count
  FROM contest_participants cp
  JOIN bolt_users bu ON cp.user_id = bu.id
  WHERE cp.contest_id = contest
  ORDER BY cp.referral_count DESC
  LIMIT limit_count;
$$;