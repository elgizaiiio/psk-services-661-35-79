-- Add USDT balance to bolt_users
ALTER TABLE public.bolt_users 
ADD COLUMN IF NOT EXISTS usdt_balance numeric NOT NULL DEFAULT 0;

-- Create user_servers table for mining servers
CREATE TABLE public.user_servers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  server_tier text NOT NULL DEFAULT 'basic',
  server_name text NOT NULL,
  hash_rate text NOT NULL,
  daily_bolt_yield numeric NOT NULL DEFAULT 5,
  daily_usdt_yield numeric NOT NULL DEFAULT 0.01,
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  last_claim_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_servers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own servers" 
ON public.user_servers 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own servers" 
ON public.user_servers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own servers" 
ON public.user_servers 
FOR UPDATE 
USING (true);

-- Create index for faster queries
CREATE INDEX idx_user_servers_user_id ON public.user_servers(user_id);
CREATE INDEX idx_user_servers_is_active ON public.user_servers(is_active);