-- Add ETH balance to bolt_users
ALTER TABLE public.bolt_users ADD COLUMN IF NOT EXISTS eth_balance numeric DEFAULT 0;

-- Add ETH and Viral yields to user_servers
ALTER TABLE public.user_servers ADD COLUMN IF NOT EXISTS daily_eth_yield numeric DEFAULT 0;
ALTER TABLE public.user_servers ADD COLUMN IF NOT EXISTS daily_viral_yield numeric DEFAULT 0;