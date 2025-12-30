-- Drop policies that may have been created
DROP POLICY IF EXISTS "Users can view own profile" ON public.bolt_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.bolt_users;
DROP POLICY IF EXISTS "Service can insert users" ON public.bolt_users;
DROP POLICY IF EXISTS "Users can view own payments" ON public.ton_payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.ton_payments;
DROP POLICY IF EXISTS "Users can update own payments" ON public.ton_payments;
DROP POLICY IF EXISTS "Users can view own stars payments" ON public.stars_payments;
DROP POLICY IF EXISTS "Users can insert own stars payments" ON public.stars_payments;
DROP POLICY IF EXISTS "Users can view own servers" ON public.user_servers;
DROP POLICY IF EXISTS "Users can insert own servers" ON public.user_servers;
DROP POLICY IF EXISTS "Users can update own servers" ON public.user_servers;
DROP POLICY IF EXISTS "Users can view own spin history" ON public.spin_history;
DROP POLICY IF EXISTS "Users can insert own spin history" ON public.spin_history;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.user_spin_tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.user_spin_tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.user_spin_tickets;
DROP POLICY IF EXISTS "Users can view own boosters" ON public.user_boosters;
DROP POLICY IF EXISTS "Users can insert own boosters" ON public.user_boosters;
DROP POLICY IF EXISTS "Users can view own daily spins" ON public.daily_spins;
DROP POLICY IF EXISTS "Users can insert own daily spins" ON public.daily_spins;
DROP POLICY IF EXISTS "Users can update own daily spins" ON public.daily_spins;

-- Create helper function that returns UUID
CREATE OR REPLACE FUNCTION public.get_telegram_user_id()
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
  LIMIT 1;
$$;

-- Create helper function that returns text for ton_payments
CREATE OR REPLACE FUNCTION public.get_telegram_user_id_text()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id::text FROM public.bolt_users 
  WHERE telegram_id = COALESCE(
    (current_setting('request.headers', true)::json->>'x-telegram-id')::bigint,
    0
  )
  LIMIT 1;
$$;

-- bolt_users: Only allow users to view/update their own data
CREATE POLICY "Users can view own profile"
ON public.bolt_users FOR SELECT
USING (telegram_id = COALESCE((current_setting('request.headers', true)::json->>'x-telegram-id')::bigint, 0));

CREATE POLICY "Users can update own profile"
ON public.bolt_users FOR UPDATE
USING (telegram_id = COALESCE((current_setting('request.headers', true)::json->>'x-telegram-id')::bigint, 0));

CREATE POLICY "Service can insert users"
ON public.bolt_users FOR INSERT
WITH CHECK (true);

-- ton_payments: user_id is TEXT type
CREATE POLICY "Users can view own payments"
ON public.ton_payments FOR SELECT
USING (user_id = public.get_telegram_user_id_text());

CREATE POLICY "Users can insert own payments"
ON public.ton_payments FOR INSERT
WITH CHECK (user_id = public.get_telegram_user_id_text());

CREATE POLICY "Users can update own payments"
ON public.ton_payments FOR UPDATE
USING (user_id = public.get_telegram_user_id_text());

-- stars_payments: user_id is UUID type
CREATE POLICY "Users can view own stars payments"
ON public.stars_payments FOR SELECT
USING (user_id = public.get_telegram_user_id());

CREATE POLICY "Users can insert own stars payments"
ON public.stars_payments FOR INSERT
WITH CHECK (user_id = public.get_telegram_user_id());

-- user_servers: user_id is UUID type
CREATE POLICY "Users can view own servers"
ON public.user_servers FOR SELECT
USING (user_id = public.get_telegram_user_id());

CREATE POLICY "Users can insert own servers"
ON public.user_servers FOR INSERT
WITH CHECK (user_id = public.get_telegram_user_id());

CREATE POLICY "Users can update own servers"
ON public.user_servers FOR UPDATE
USING (user_id = public.get_telegram_user_id());

-- spin_history: user_id is UUID type
CREATE POLICY "Users can view own spin history"
ON public.spin_history FOR SELECT
USING (user_id = public.get_telegram_user_id());

CREATE POLICY "Users can insert own spin history"
ON public.spin_history FOR INSERT
WITH CHECK (user_id = public.get_telegram_user_id());

-- user_spin_tickets: user_id is UUID type
CREATE POLICY "Users can view own tickets"
ON public.user_spin_tickets FOR SELECT
USING (user_id = public.get_telegram_user_id());

CREATE POLICY "Users can update own tickets"
ON public.user_spin_tickets FOR UPDATE
USING (user_id = public.get_telegram_user_id());

CREATE POLICY "Users can insert own tickets"
ON public.user_spin_tickets FOR INSERT
WITH CHECK (user_id = public.get_telegram_user_id());

-- user_boosters: user_id is UUID type
CREATE POLICY "Users can view own boosters"
ON public.user_boosters FOR SELECT
USING (user_id = public.get_telegram_user_id());

CREATE POLICY "Users can insert own boosters"
ON public.user_boosters FOR INSERT
WITH CHECK (user_id = public.get_telegram_user_id());

-- daily_spins: user_id is UUID type
CREATE POLICY "Users can view own daily spins"
ON public.daily_spins FOR SELECT
USING (user_id = public.get_telegram_user_id());

CREATE POLICY "Users can insert own daily spins"
ON public.daily_spins FOR INSERT
WITH CHECK (user_id = public.get_telegram_user_id());

CREATE POLICY "Users can update own daily spins"
ON public.daily_spins FOR UPDATE
USING (user_id = public.get_telegram_user_id());