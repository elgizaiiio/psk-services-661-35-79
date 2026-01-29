-- Add daily_eth_yield to limited_server_offers if not exists
ALTER TABLE public.limited_server_offers 
ADD COLUMN IF NOT EXISTS daily_eth_yield numeric DEFAULT 0;

-- Create ETH withdrawals table
CREATE TABLE IF NOT EXISTS public.eth_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bolt_users(id),
  wallet_address text NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  tx_hash text,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.eth_withdrawals ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawals
CREATE POLICY "Users can view own eth withdrawals"
ON public.eth_withdrawals
FOR SELECT
USING (user_id = get_current_user_uuid());

-- Users can create their own withdrawals
CREATE POLICY "Users can create own eth withdrawals"
ON public.eth_withdrawals
FOR INSERT
WITH CHECK (user_id = get_current_user_uuid());

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_eth_withdrawals_user_id ON public.eth_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_eth_withdrawals_status ON public.eth_withdrawals(status);

-- Update existing server offers with ETH yields
UPDATE public.limited_server_offers 
SET daily_eth_yield = CASE 
  WHEN price_ton >= 50 THEN 0.0005
  WHEN price_ton >= 20 THEN 0.0002
  WHEN price_ton >= 10 THEN 0.0001
  ELSE 0.00005
END
WHERE daily_eth_yield IS NULL OR daily_eth_yield = 0;