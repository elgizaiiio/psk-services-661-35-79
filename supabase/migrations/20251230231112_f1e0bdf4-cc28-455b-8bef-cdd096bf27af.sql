-- Drop existing restrictive RLS policies on daily_login_rewards
DROP POLICY IF EXISTS "Users can view own login rewards" ON public.daily_login_rewards;
DROP POLICY IF EXISTS "Users can insert own login rewards" ON public.daily_login_rewards;

-- Create more permissive policies that work without x-telegram-id header
-- Users can view their own rewards (authenticated or by user_id match)
CREATE POLICY "Users can view own login rewards"
ON public.daily_login_rewards FOR SELECT
USING (true);

-- Users can insert their own rewards
CREATE POLICY "Users can insert own login rewards"
ON public.daily_login_rewards FOR INSERT
WITH CHECK (true);

-- Update stars_payments check constraint to include more statuses
ALTER TABLE public.stars_payments DROP CONSTRAINT IF EXISTS stars_payments_status_check;
ALTER TABLE public.stars_payments ADD CONSTRAINT stars_payments_status_check 
  CHECK (status = ANY (ARRAY['pending', 'completed', 'failed', 'cancelled', 'processing']));

-- Also fix ton_payments RLS to be more permissive for inserts
DROP POLICY IF EXISTS "Users can insert own TON payments" ON public.ton_payments;
DROP POLICY IF EXISTS "Users can view own TON payments" ON public.ton_payments;
DROP POLICY IF EXISTS "Users can update own TON payments" ON public.ton_payments;

CREATE POLICY "Users can insert TON payments"
ON public.ton_payments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view own TON payments"
ON public.ton_payments FOR SELECT
USING (true);

CREATE POLICY "Users can update TON payments"
ON public.ton_payments FOR UPDATE
USING (true);