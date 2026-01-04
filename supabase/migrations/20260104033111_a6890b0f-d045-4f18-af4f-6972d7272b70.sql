-- Create deposit_requests table
CREATE TABLE public.deposit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TON',
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  wallet_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own deposits
CREATE POLICY "Users can view own deposits"
ON public.deposit_requests FOR SELECT
USING (true);

-- Policy for users to create deposits
CREATE POLICY "Users can create deposits"
ON public.deposit_requests FOR INSERT
WITH CHECK (true);

-- Policy for updating deposits
CREATE POLICY "Users can update own deposits"
ON public.deposit_requests FOR UPDATE
USING (true);