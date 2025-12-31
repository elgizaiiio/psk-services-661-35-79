-- Allow admin to view all stars payments (via service role or specific check)
-- First, drop existing SELECT policies if any that allow public access
DROP POLICY IF EXISTS "Users can view own stars payments" ON public.stars_payments;

-- Create policy for users to view only their own payments
CREATE POLICY "Users view own stars payments" 
ON public.stars_payments 
FOR SELECT 
USING (user_id = get_current_user_uuid());

-- Create policy for admins to view all payments (using a simple admin check)
-- Note: In production, you should use a proper user_roles table
CREATE POLICY "Admins view all stars payments" 
ON public.stars_payments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bolt_users 
    WHERE telegram_id IN (6090594286, 6657246146, 7018562521)
    AND id = get_current_user_uuid()
  )
);