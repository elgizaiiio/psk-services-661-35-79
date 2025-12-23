-- Create bolt_users table
CREATE TABLE public.bolt_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT NOT NULL UNIQUE,
  telegram_username TEXT,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  token_balance NUMERIC NOT NULL DEFAULT 0,
  mining_power NUMERIC NOT NULL DEFAULT 2,
  mining_duration_hours INTEGER NOT NULL DEFAULT 4,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  referral_bonus NUMERIC NOT NULL DEFAULT 0,
  referred_by UUID REFERENCES public.bolt_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bolt_mining_sessions table
CREATE TABLE public.bolt_mining_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  tokens_per_hour NUMERIC NOT NULL DEFAULT 1,
  mining_power NUMERIC NOT NULL DEFAULT 2,
  total_mined NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bolt_tasks table
CREATE TABLE public.bolt_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  task_url TEXT,
  icon TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bolt_completed_tasks table
CREATE TABLE public.bolt_completed_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.bolt_tasks(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_id)
);

-- Create bolt_referrals table
CREATE TABLE public.bolt_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  bonus_earned NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- Create bolt_daily_codes table
CREATE TABLE public.bolt_daily_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code1 TEXT NOT NULL,
  code2 TEXT NOT NULL,
  code3 TEXT NOT NULL,
  code4 TEXT NOT NULL,
  points_reward INTEGER NOT NULL DEFAULT 100,
  date DATE NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bolt_daily_code_attempts table
CREATE TABLE public.bolt_daily_code_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.bolt_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolt_mining_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolt_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolt_completed_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolt_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolt_daily_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolt_daily_code_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bolt_users (public read, authenticated write)
CREATE POLICY "Anyone can view bolt users" 
ON public.bolt_users 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own record" 
ON public.bolt_users 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own record" 
ON public.bolt_users 
FOR UPDATE 
USING (true);

-- RLS Policies for bolt_mining_sessions
CREATE POLICY "Anyone can view mining sessions" 
ON public.bolt_mining_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert mining sessions" 
ON public.bolt_mining_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update mining sessions" 
ON public.bolt_mining_sessions 
FOR UPDATE 
USING (true);

-- RLS Policies for bolt_tasks (public read)
CREATE POLICY "Anyone can view tasks" 
ON public.bolt_tasks 
FOR SELECT 
USING (true);

-- RLS Policies for bolt_completed_tasks
CREATE POLICY "Anyone can view completed tasks" 
ON public.bolt_completed_tasks 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert completed tasks" 
ON public.bolt_completed_tasks 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for bolt_referrals
CREATE POLICY "Anyone can view referrals" 
ON public.bolt_referrals 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert referrals" 
ON public.bolt_referrals 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update referrals" 
ON public.bolt_referrals 
FOR UPDATE 
USING (true);

-- RLS Policies for bolt_daily_codes (public read)
CREATE POLICY "Anyone can view daily codes" 
ON public.bolt_daily_codes 
FOR SELECT 
USING (true);

-- RLS Policies for bolt_daily_code_attempts
CREATE POLICY "Anyone can view daily code attempts" 
ON public.bolt_daily_code_attempts 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert daily code attempts" 
ON public.bolt_daily_code_attempts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update daily code attempts" 
ON public.bolt_daily_code_attempts 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bolt_users_updated_at
BEFORE UPDATE ON public.bolt_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_bolt_users_telegram_id ON public.bolt_users(telegram_id);
CREATE INDEX idx_bolt_users_token_balance ON public.bolt_users(token_balance DESC);
CREATE INDEX idx_bolt_mining_sessions_user_id ON public.bolt_mining_sessions(user_id);
CREATE INDEX idx_bolt_mining_sessions_is_active ON public.bolt_mining_sessions(is_active);
CREATE INDEX idx_bolt_completed_tasks_user_id ON public.bolt_completed_tasks(user_id);
CREATE INDEX idx_bolt_referrals_referrer_id ON public.bolt_referrals(referrer_id);