-- Create ton_payments table for tracking TON cryptocurrency payments
CREATE TABLE public.ton_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount_ton NUMERIC NOT NULL,
  description TEXT,
  product_type TEXT NOT NULL DEFAULT 'general',
  product_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  destination_address TEXT NOT NULL,
  tx_hash TEXT,
  wallet_address TEXT,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for ton_payments
ALTER TABLE public.ton_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for ton_payments
CREATE POLICY "Anyone can view payments" ON public.ton_payments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert payments" ON public.ton_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update payments" ON public.ton_payments FOR UPDATE USING (true);

-- Create server_purchases table for tracking server purchases
CREATE TABLE public.server_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  server_name TEXT NOT NULL,
  server_tier TEXT NOT NULL DEFAULT 'standard',
  hash_rate TEXT,
  price_ton NUMERIC NOT NULL,
  payment_id UUID REFERENCES public.ton_payments(id),
  status TEXT NOT NULL DEFAULT 'pending',
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for server_purchases
ALTER TABLE public.server_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies for server_purchases
CREATE POLICY "Anyone can view server purchases" ON public.server_purchases FOR SELECT USING (true);
CREATE POLICY "Anyone can insert server purchases" ON public.server_purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update server purchases" ON public.server_purchases FOR UPDATE USING (true);

-- Create game_players table for game user profiles
CREATE TABLE public.game_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  username TEXT,
  total_score BIGINT NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  highest_score BIGINT NOT NULL DEFAULT 0,
  current_skin TEXT DEFAULT 'default',
  coins INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for game_players
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;

-- RLS policies for game_players
CREATE POLICY "Anyone can view game players" ON public.game_players FOR SELECT USING (true);
CREATE POLICY "Anyone can insert game players" ON public.game_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update game players" ON public.game_players FOR UPDATE USING (true);

-- Create game_scores table for storing game scores
CREATE TABLE public.game_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES public.game_players(id),
  user_id TEXT NOT NULL,
  game_type TEXT NOT NULL DEFAULT '2048',
  score BIGINT NOT NULL,
  level INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for game_scores
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies for game_scores
CREATE POLICY "Anyone can view game scores" ON public.game_scores FOR SELECT USING (true);
CREATE POLICY "Anyone can insert game scores" ON public.game_scores FOR INSERT WITH CHECK (true);

-- Create game_skins table for available game skins
CREATE TABLE public.game_skins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price_coins INTEGER NOT NULL DEFAULT 0,
  price_ton NUMERIC,
  rarity TEXT NOT NULL DEFAULT 'common',
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for game_skins
ALTER TABLE public.game_skins ENABLE ROW LEVEL SECURITY;

-- RLS policies for game_skins
CREATE POLICY "Anyone can view game skins" ON public.game_skins FOR SELECT USING (true);

-- Create game_purchases table for in-game purchases
CREATE TABLE public.game_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES public.game_players(id),
  user_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  price_coins INTEGER,
  price_ton NUMERIC,
  payment_method TEXT NOT NULL DEFAULT 'coins',
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for game_purchases
ALTER TABLE public.game_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies for game_purchases
CREATE POLICY "Anyone can view game purchases" ON public.game_purchases FOR SELECT USING (true);
CREATE POLICY "Anyone can insert game purchases" ON public.game_purchases FOR INSERT WITH CHECK (true);

-- Create game_daily_rewards table for daily reward tracking
CREATE TABLE public.game_daily_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES public.game_players(id),
  user_id TEXT NOT NULL,
  day_number INTEGER NOT NULL DEFAULT 1,
  reward_type TEXT NOT NULL,
  reward_amount INTEGER NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for game_daily_rewards
ALTER TABLE public.game_daily_rewards ENABLE ROW LEVEL SECURITY;

-- RLS policies for game_daily_rewards
CREATE POLICY "Anyone can view daily rewards" ON public.game_daily_rewards FOR SELECT USING (true);
CREATE POLICY "Anyone can insert daily rewards" ON public.game_daily_rewards FOR INSERT WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX idx_ton_payments_user_id ON public.ton_payments(user_id);
CREATE INDEX idx_ton_payments_status ON public.ton_payments(status);
CREATE INDEX idx_server_purchases_user_id ON public.server_purchases(user_id);
CREATE INDEX idx_game_players_user_id ON public.game_players(user_id);
CREATE INDEX idx_game_scores_user_id ON public.game_scores(user_id);
CREATE INDEX idx_game_scores_game_type ON public.game_scores(game_type);
CREATE INDEX idx_game_purchases_user_id ON public.game_purchases(user_id);