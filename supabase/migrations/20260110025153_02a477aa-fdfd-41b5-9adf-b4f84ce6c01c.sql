-- Create wallet_verifications table to track verified wallets
CREATE TABLE IF NOT EXISTS public.wallet_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TON',
  verification_fee NUMERIC NOT NULL DEFAULT 0.5,
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint for user + wallet combination
ALTER TABLE public.wallet_verifications 
ADD CONSTRAINT wallet_verifications_user_wallet_unique 
UNIQUE (user_id, wallet_address, currency);

-- Enable RLS
ALTER TABLE public.wallet_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own wallet verifications"
ON public.wallet_verifications
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own wallet verifications"
ON public.wallet_verifications
FOR INSERT
WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX idx_wallet_verifications_user_id ON public.wallet_verifications(user_id);
CREATE INDEX idx_wallet_verifications_wallet ON public.wallet_verifications(wallet_address);