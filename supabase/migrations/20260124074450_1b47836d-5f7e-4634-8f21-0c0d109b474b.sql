-- Fix user_servers RLS policies - remove conflicting duplicates
DROP POLICY IF EXISTS "Users can insert their own servers" ON public.user_servers;
DROP POLICY IF EXISTS "Users can update their own servers" ON public.user_servers;
DROP POLICY IF EXISTS "Users can update own servers" ON public.user_servers;

-- Create proper UPDATE policy with user verification
CREATE POLICY "Users can update own servers" ON public.user_servers
FOR UPDATE USING (user_id = get_telegram_user_id());

-- Fix ad_views RLS - add INSERT policy for users (not just service role)
CREATE POLICY "Users can insert own ad views" ON public.ad_views
FOR INSERT WITH CHECK (
  telegram_id = COALESCE(
    (current_setting('request.headers', true)::json->>'x-telegram-id')::bigint,
    0
  )
);