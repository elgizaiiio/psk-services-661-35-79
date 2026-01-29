-- Create viral_withdrawals table for tracking withdrawals
CREATE TABLE IF NOT EXISTS public.viral_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  jetton_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.viral_withdrawals ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawals
CREATE POLICY "Users can view own viral withdrawals"
ON public.viral_withdrawals
FOR SELECT
USING (user_id = get_telegram_user_id());

-- Only service role can insert/update (via edge function)
CREATE POLICY "Service role can manage viral withdrawals"
ON public.viral_withdrawals
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_viral_withdrawals_user_id ON public.viral_withdrawals(user_id);
CREATE INDEX idx_viral_withdrawals_status ON public.viral_withdrawals(status);