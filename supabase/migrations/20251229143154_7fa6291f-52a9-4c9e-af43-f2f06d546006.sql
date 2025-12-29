-- Drop existing restrictive policies on ton_payments
DROP POLICY IF EXISTS "Users insert own payments" ON public.ton_payments;
DROP POLICY IF EXISTS "Users view own payments" ON public.ton_payments;

-- Create new permissive policies that allow anyone with a wallet
CREATE POLICY "Anyone can insert payments" 
ON public.ton_payments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view payments by wallet" 
ON public.ton_payments 
FOR SELECT 
USING (true);

-- Update user_servers policies to be more permissive
DROP POLICY IF EXISTS "Users view own servers" ON public.user_servers;

-- Keep existing permissive policies, they already have WITH CHECK (true)