-- Create viral token users table
CREATE TABLE public.viral_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  telegram_username TEXT,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  token_balance DECIMAL(20, 8) DEFAULT 0,
  mining_power_multiplier INTEGER DEFAULT 2,
  mining_duration_hours INTEGER DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create mining sessions table
CREATE TABLE public.viral_mining_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES viral_users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  tokens_per_hour DECIMAL(10, 4) NOT NULL DEFAULT 1.0,
  mining_power_multiplier INTEGER NOT NULL DEFAULT 2,
  total_tokens_mined DECIMAL(20, 8) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create upgrade purchases table
CREATE TABLE public.viral_upgrades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES viral_users(id) ON DELETE CASCADE,
  upgrade_type TEXT NOT NULL CHECK (upgrade_type IN ('mining_power', 'mining_duration')),
  upgrade_level INTEGER NOT NULL DEFAULT 1,
  cost_ton DECIMAL(10, 4) NOT NULL DEFAULT 0.5,
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.viral_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viral_mining_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viral_upgrades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for viral_users
CREATE POLICY "Users can view their own profile" 
ON public.viral_users 
FOR SELECT 
USING (telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint);

CREATE POLICY "Users can update their own profile" 
ON public.viral_users 
FOR UPDATE 
USING (telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint);

CREATE POLICY "Users can insert their own profile" 
ON public.viral_users 
FOR INSERT 
WITH CHECK (telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint);

-- Create RLS policies for mining sessions
CREATE POLICY "Users can view their own mining sessions" 
ON public.viral_mining_sessions 
FOR SELECT 
USING (user_id IN (SELECT id FROM viral_users WHERE telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint));

CREATE POLICY "Users can create their own mining sessions" 
ON public.viral_mining_sessions 
FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM viral_users WHERE telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint));

CREATE POLICY "Users can update their own mining sessions" 
ON public.viral_mining_sessions 
FOR UPDATE 
USING (user_id IN (SELECT id FROM viral_users WHERE telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint));

-- Create RLS policies for upgrades
CREATE POLICY "Users can view their own upgrades" 
ON public.viral_upgrades 
FOR SELECT 
USING (user_id IN (SELECT id FROM viral_users WHERE telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint));

CREATE POLICY "Users can create their own upgrades" 
ON public.viral_upgrades 
FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM viral_users WHERE telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER viral_users_updated_at
  BEFORE UPDATE ON public.viral_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to calculate mining rewards
CREATE OR REPLACE FUNCTION public.calculate_mining_reward(
  session_id UUID
) RETURNS DECIMAL(20, 8) AS $$
DECLARE
  session_record RECORD;
  elapsed_hours DECIMAL;
  reward DECIMAL(20, 8);
BEGIN
  SELECT * INTO session_record
  FROM viral_mining_sessions
  WHERE id = session_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate elapsed time in hours
  elapsed_hours := EXTRACT(EPOCH FROM (
    LEAST(now(), session_record.end_time) - session_record.start_time
  )) / 3600.0;
  
  -- Calculate reward: base rate * multiplier * elapsed time
  reward := session_record.tokens_per_hour * session_record.mining_power_multiplier * elapsed_hours;
  
  RETURN GREATEST(0, reward);
END;
$$ LANGUAGE plpgsql;