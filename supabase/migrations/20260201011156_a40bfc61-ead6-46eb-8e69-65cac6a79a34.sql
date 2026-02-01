
-- Fix RLS policies for bolt_town_daily_points

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own points" ON public.bolt_town_daily_points;
DROP POLICY IF EXISTS "Users can update their own points" ON public.bolt_town_daily_points;
DROP POLICY IF EXISTS "Users can view all daily points for leaderboard" ON public.bolt_town_daily_points;

-- Create function to get current user's bolt_user id
CREATE OR REPLACE FUNCTION public.get_current_bolt_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  telegram_user_id BIGINT;
  bolt_user_id UUID;
BEGIN
  -- Get telegram_id from the current session's telegram user
  telegram_user_id := get_telegram_user_id();
  
  IF telegram_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the bolt_user id
  SELECT id INTO bolt_user_id
  FROM bolt_users
  WHERE telegram_id = telegram_user_id;
  
  RETURN bolt_user_id;
END;
$$;

-- Recreate policies with proper security
CREATE POLICY "Users can view all daily points for leaderboard" 
ON public.bolt_town_daily_points 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own points" 
ON public.bolt_town_daily_points 
FOR INSERT 
WITH CHECK (user_id = get_current_bolt_user_id());

CREATE POLICY "Users can update their own points" 
ON public.bolt_town_daily_points 
FOR UPDATE 
USING (user_id = get_current_bolt_user_id())
WITH CHECK (user_id = get_current_bolt_user_id());

-- Also allow service role to manage all records
CREATE POLICY "Service role can manage all points" 
ON public.bolt_town_daily_points 
FOR ALL 
USING (auth.role() = 'service_role');
