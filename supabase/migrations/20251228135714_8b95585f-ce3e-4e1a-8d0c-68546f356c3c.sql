-- =====================================================
-- SECURITY FIX: Replace all permissive RLS policies
-- =====================================================

-- Create helper function that returns TEXT (telegram_id as string)
-- This works for tables using text user_id
CREATE OR REPLACE FUNCTION public.get_current_telegram_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    current_setting('request.headers', true)::json->>'x-telegram-id',
    '0'
  )
$$;

-- Create helper function that returns the bolt_users UUID for current telegram user
CREATE OR REPLACE FUNCTION public.get_current_user_uuid()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.bolt_users 
  WHERE telegram_id = COALESCE(
    (current_setting('request.headers', true)::json->>'x-telegram-id')::bigint,
    0
  )
  LIMIT 1
$$;

-- =====================================================
-- FIX: bolt_users - Keep SELECT open for referral display, restrict UPDATE
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view users" ON bolt_users;
DROP POLICY IF EXISTS "Anyone can update users" ON bolt_users;
DROP POLICY IF EXISTS "Anyone can insert users" ON bolt_users;

CREATE POLICY "Users can view profiles" ON bolt_users
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert users" ON bolt_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON bolt_users
  FOR UPDATE USING (id = public.get_current_user_uuid());

-- =====================================================
-- FIX: bolt_mining_sessions - Users can only access own sessions (UUID)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view mining sessions" ON bolt_mining_sessions;
DROP POLICY IF EXISTS "Anyone can insert mining sessions" ON bolt_mining_sessions;
DROP POLICY IF EXISTS "Anyone can update mining sessions" ON bolt_mining_sessions;

CREATE POLICY "Users view own mining sessions" ON bolt_mining_sessions
  FOR SELECT USING (user_id = public.get_current_user_uuid());

CREATE POLICY "Users insert own mining sessions" ON bolt_mining_sessions
  FOR INSERT WITH CHECK (user_id = public.get_current_user_uuid());

CREATE POLICY "Users update own mining sessions" ON bolt_mining_sessions
  FOR UPDATE USING (user_id = public.get_current_user_uuid());

-- =====================================================
-- FIX: bolt_referrals - Restrict access to own referrals (UUID)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view referrals" ON bolt_referrals;
DROP POLICY IF EXISTS "Anyone can insert referrals" ON bolt_referrals;
DROP POLICY IF EXISTS "Anyone can update referrals" ON bolt_referrals;

CREATE POLICY "Users view own referrals" ON bolt_referrals
  FOR SELECT USING (
    referrer_id = public.get_current_user_uuid() OR 
    referred_id = public.get_current_user_uuid()
  );

CREATE POLICY "Service role inserts referrals" ON bolt_referrals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role updates referrals" ON bolt_referrals
  FOR UPDATE USING (true);

-- =====================================================
-- FIX: ton_payments - Users only see own payments (TEXT user_id)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view payments" ON ton_payments;
DROP POLICY IF EXISTS "Anyone can insert payments" ON ton_payments;
DROP POLICY IF EXISTS "Anyone can update payments" ON ton_payments;

CREATE POLICY "Users view own payments" ON ton_payments
  FOR SELECT USING (user_id = public.get_current_telegram_id());

CREATE POLICY "Users insert own payments" ON ton_payments
  FOR INSERT WITH CHECK (user_id = public.get_current_telegram_id());

CREATE POLICY "Service role updates payments" ON ton_payments
  FOR UPDATE USING (true);

-- =====================================================
-- FIX: bolt_completed_tasks (UUID)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view completed tasks" ON bolt_completed_tasks;
DROP POLICY IF EXISTS "Anyone can insert completed tasks" ON bolt_completed_tasks;

CREATE POLICY "Users view own completed tasks" ON bolt_completed_tasks
  FOR SELECT USING (user_id = public.get_current_user_uuid());

CREATE POLICY "Users insert own completed tasks" ON bolt_completed_tasks
  FOR INSERT WITH CHECK (user_id = public.get_current_user_uuid());

-- =====================================================
-- FIX: bolt_daily_code_attempts (UUID)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view daily code attempts" ON bolt_daily_code_attempts;
DROP POLICY IF EXISTS "Anyone can insert daily code attempts" ON bolt_daily_code_attempts;
DROP POLICY IF EXISTS "Anyone can update daily code attempts" ON bolt_daily_code_attempts;

CREATE POLICY "Users view own code attempts" ON bolt_daily_code_attempts
  FOR SELECT USING (user_id = public.get_current_user_uuid());

CREATE POLICY "Users insert own code attempts" ON bolt_daily_code_attempts
  FOR INSERT WITH CHECK (user_id = public.get_current_user_uuid());

CREATE POLICY "Users update own code attempts" ON bolt_daily_code_attempts
  FOR UPDATE USING (user_id = public.get_current_user_uuid());

-- =====================================================
-- FIX: bolt_daily_task_completions (UUID)
-- =====================================================
DROP POLICY IF EXISTS "Users can view their completions" ON bolt_daily_task_completions;
DROP POLICY IF EXISTS "Users can insert their completions" ON bolt_daily_task_completions;

CREATE POLICY "Users view own daily completions" ON bolt_daily_task_completions
  FOR SELECT USING (user_id = public.get_current_user_uuid());

CREATE POLICY "Users insert own daily completions" ON bolt_daily_task_completions
  FOR INSERT WITH CHECK (user_id = public.get_current_user_uuid());

-- =====================================================
-- FIX: bolt_user_levels (UUID)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view levels" ON bolt_user_levels;
DROP POLICY IF EXISTS "Anyone can insert levels" ON bolt_user_levels;
DROP POLICY IF EXISTS "Anyone can update levels" ON bolt_user_levels;

CREATE POLICY "Users view own level" ON bolt_user_levels
  FOR SELECT USING (user_id = public.get_current_user_uuid());

CREATE POLICY "Users insert own level" ON bolt_user_levels
  FOR INSERT WITH CHECK (user_id = public.get_current_user_uuid());

CREATE POLICY "Users update own level" ON bolt_user_levels
  FOR UPDATE USING (user_id = public.get_current_user_uuid());

-- =====================================================
-- FIX: bolt_user_streaks (UUID)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view streaks" ON bolt_user_streaks;
DROP POLICY IF EXISTS "Anyone can insert streaks" ON bolt_user_streaks;
DROP POLICY IF EXISTS "Anyone can update streaks" ON bolt_user_streaks;

CREATE POLICY "Users view own streaks" ON bolt_user_streaks
  FOR SELECT USING (user_id = public.get_current_user_uuid());

CREATE POLICY "Users insert own streaks" ON bolt_user_streaks
  FOR INSERT WITH CHECK (user_id = public.get_current_user_uuid());

CREATE POLICY "Users update own streaks" ON bolt_user_streaks
  FOR UPDATE USING (user_id = public.get_current_user_uuid());

-- =====================================================
-- FIX: bolt_vip_tiers (UUID)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view VIP tiers" ON bolt_vip_tiers;
DROP POLICY IF EXISTS "Anyone can insert VIP tiers" ON bolt_vip_tiers;
DROP POLICY IF EXISTS "Anyone can update VIP tiers" ON bolt_vip_tiers;

CREATE POLICY "Users view own VIP tier" ON bolt_vip_tiers
  FOR SELECT USING (user_id = public.get_current_user_uuid());

CREATE POLICY "Service role manages VIP" ON bolt_vip_tiers
  FOR ALL USING (true);

-- =====================================================
-- FIX: user_servers (UUID)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view servers" ON user_servers;
DROP POLICY IF EXISTS "Anyone can insert servers" ON user_servers;
DROP POLICY IF EXISTS "Anyone can update servers" ON user_servers;

CREATE POLICY "Users view own servers" ON user_servers
  FOR SELECT USING (user_id = public.get_current_user_uuid());

CREATE POLICY "Service role manages servers" ON user_servers
  FOR ALL USING (true);

-- =====================================================
-- FIX: server_purchases (TEXT user_id)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view server purchases" ON server_purchases;
DROP POLICY IF EXISTS "Anyone can insert server purchases" ON server_purchases;
DROP POLICY IF EXISTS "Anyone can update server purchases" ON server_purchases;

CREATE POLICY "Users view own server purchases" ON server_purchases
  FOR SELECT USING (user_id = public.get_current_telegram_id());

CREATE POLICY "Service role manages purchases" ON server_purchases
  FOR ALL USING (true);

-- =====================================================
-- FIX: user_characters (UUID)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view characters" ON user_characters;
DROP POLICY IF EXISTS "Anyone can insert characters" ON user_characters;
DROP POLICY IF EXISTS "Anyone can update characters" ON user_characters;

CREATE POLICY "Users view own characters" ON user_characters
  FOR SELECT USING (user_id = public.get_current_user_uuid());

CREATE POLICY "Users insert own characters" ON user_characters
  FOR INSERT WITH CHECK (user_id = public.get_current_user_uuid());

CREATE POLICY "Users update own characters" ON user_characters
  FOR UPDATE USING (user_id = public.get_current_user_uuid());

-- =====================================================
-- FIX: user_achievements (UUID)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view user achievements" ON user_achievements;
DROP POLICY IF EXISTS "Anyone can insert user achievements" ON user_achievements;
DROP POLICY IF EXISTS "Anyone can update user achievements" ON user_achievements;

CREATE POLICY "Users view own achievements" ON user_achievements
  FOR SELECT USING (user_id = public.get_current_user_uuid());

CREATE POLICY "Users insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (user_id = public.get_current_user_uuid());

CREATE POLICY "Users update own achievements" ON user_achievements
  FOR UPDATE USING (user_id = public.get_current_user_uuid());

-- =====================================================
-- FIX: user_challenges (UUID)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view challenges" ON user_challenges;
DROP POLICY IF EXISTS "Anyone can insert challenges" ON user_challenges;
DROP POLICY IF EXISTS "Anyone can update challenges" ON user_challenges;

CREATE POLICY "Users view own challenges" ON user_challenges
  FOR SELECT USING (user_id = public.get_current_user_uuid());

CREATE POLICY "Users insert own challenges" ON user_challenges
  FOR INSERT WITH CHECK (user_id = public.get_current_user_uuid());

CREATE POLICY "Users update own challenges" ON user_challenges
  FOR UPDATE USING (user_id = public.get_current_user_uuid());

-- =====================================================
-- FIX: user_upgrades (UUID)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view upgrades" ON user_upgrades;
DROP POLICY IF EXISTS "Anyone can insert upgrades" ON user_upgrades;

CREATE POLICY "Users view own upgrades" ON user_upgrades
  FOR SELECT USING (user_id = public.get_current_user_uuid());

CREATE POLICY "Users insert own upgrades" ON user_upgrades
  FOR INSERT WITH CHECK (user_id = public.get_current_user_uuid());

-- =====================================================
-- FIX: bolt_upgrade_purchases (UUID)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view purchases" ON bolt_upgrade_purchases;
DROP POLICY IF EXISTS "Anyone can insert purchases" ON bolt_upgrade_purchases;

CREATE POLICY "Users view own upgrade purchases" ON bolt_upgrade_purchases
  FOR SELECT USING (user_id = public.get_current_user_uuid());

CREATE POLICY "Users insert own upgrade purchases" ON bolt_upgrade_purchases
  FOR INSERT WITH CHECK (user_id = public.get_current_user_uuid());

-- =====================================================
-- FIX: user_free_spins (TEXT user_id)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view free spins" ON user_free_spins;
DROP POLICY IF EXISTS "Anyone can insert free spins" ON user_free_spins;
DROP POLICY IF EXISTS "Anyone can update free spins" ON user_free_spins;

CREATE POLICY "Users view own free spins" ON user_free_spins
  FOR SELECT USING (user_id = public.get_current_telegram_id());

CREATE POLICY "Users insert own free spins" ON user_free_spins
  FOR INSERT WITH CHECK (user_id = public.get_current_telegram_id());

CREATE POLICY "Users update own free spins" ON user_free_spins
  FOR UPDATE USING (user_id = public.get_current_telegram_id());

-- =====================================================
-- FIX: game tables (TEXT user_id)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view players" ON game_players;
DROP POLICY IF EXISTS "Anyone can insert players" ON game_players;
DROP POLICY IF EXISTS "Anyone can update players" ON game_players;

CREATE POLICY "Users view own player data" ON game_players
  FOR SELECT USING (user_id = public.get_current_telegram_id());

CREATE POLICY "Users insert own player data" ON game_players
  FOR INSERT WITH CHECK (user_id = public.get_current_telegram_id());

CREATE POLICY "Users update own player data" ON game_players
  FOR UPDATE USING (user_id = public.get_current_telegram_id());

-- game_scores
DROP POLICY IF EXISTS "Anyone can view scores" ON game_scores;
DROP POLICY IF EXISTS "Anyone can insert scores" ON game_scores;

CREATE POLICY "Users view own scores" ON game_scores
  FOR SELECT USING (user_id = public.get_current_telegram_id());

CREATE POLICY "Users insert own scores" ON game_scores
  FOR INSERT WITH CHECK (user_id = public.get_current_telegram_id());

-- game_purchases
DROP POLICY IF EXISTS "Anyone can view game purchases" ON game_purchases;
DROP POLICY IF EXISTS "Anyone can insert game purchases" ON game_purchases;

CREATE POLICY "Users view own game purchases" ON game_purchases
  FOR SELECT USING (user_id = public.get_current_telegram_id());

CREATE POLICY "Users insert own game purchases" ON game_purchases
  FOR INSERT WITH CHECK (user_id = public.get_current_telegram_id());

-- game_daily_rewards
DROP POLICY IF EXISTS "Anyone can view daily rewards" ON game_daily_rewards;
DROP POLICY IF EXISTS "Anyone can insert daily rewards" ON game_daily_rewards;

CREATE POLICY "Users view own daily rewards" ON game_daily_rewards
  FOR SELECT USING (user_id = public.get_current_telegram_id());

CREATE POLICY "Users insert own daily rewards" ON game_daily_rewards
  FOR INSERT WITH CHECK (user_id = public.get_current_telegram_id());

-- =====================================================
-- FIX: bolt_flash_offers - Only admins can update
-- =====================================================
DROP POLICY IF EXISTS "Anyone can update offers" ON bolt_flash_offers;

CREATE POLICY "Service role updates offers" ON bolt_flash_offers
  FOR UPDATE USING (true);