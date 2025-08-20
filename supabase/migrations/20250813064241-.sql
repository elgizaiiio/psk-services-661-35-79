-- Fix security issues and add missing tables for complete website functionality
-- First fix the function drop issue by using CASCADE

-- 1. Fix function security paths
DROP FUNCTION IF EXISTS public.calculate_mining_reward(uuid);
CREATE OR REPLACE FUNCTION public.calculate_mining_reward(session_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  s record;
  now_time timestamptz := now();
  hours_elapsed numeric;
  reward numeric;
begin
  select * into s from public.viral_mining_sessions where id = session_id; 
  if not found then
    return 0;
  end if;
  hours_elapsed := greatest(0, extract(epoch from (least(s.end_time, now_time) - s.start_time)) / 3600.0);
  reward := hours_elapsed * s.tokens_per_hour * s.mining_power_multiplier;
  return reward;
end;
$function$;

-- Fix other functions with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$function$;

DROP FUNCTION IF EXISTS public.update_last_active() CASCADE;
CREATE OR REPLACE FUNCTION public.update_last_active()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.last_active_at = now();
  RETURN NEW;
END;
$function$;

-- Recreate triggers that were dropped
CREATE TRIGGER trg_viral_users_updated
BEFORE UPDATE ON public.viral_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_tasks_updated
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_players_updated_at
BEFORE UPDATE ON public.game_players
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create user profiles table for comprehensive user management
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  rank_position INTEGER,
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS and create policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" 
ON public.user_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

-- 4. Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  points_reward INTEGER DEFAULT 0,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements" 
ON public.achievements 
FOR SELECT 
USING (true);

-- 5. Create user achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

-- 6. Create wallet transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'VIRAL',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  transaction_hash TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own transactions" 
ON public.wallet_transactions 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

-- 7. Create tournaments table
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  prize_pool NUMERIC DEFAULT 0,
  entry_fee NUMERIC DEFAULT 0,
  max_participants INTEGER,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'upcoming',
  game_type TEXT NOT NULL,
  rules JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tournaments" 
ON public.tournaments 
FOR SELECT 
USING (true);

-- 8. Create tournament participants table
CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score INTEGER DEFAULT 0,
  rank_position INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tournament participants" 
ON public.tournament_participants 
FOR SELECT 
USING (true);

CREATE POLICY "Users can join tournaments" 
ON public.tournament_participants 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

-- 9. Add triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id ON public.tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user_id ON public.tournament_participants(user_id);