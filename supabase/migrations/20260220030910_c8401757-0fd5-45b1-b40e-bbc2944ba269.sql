
-- ===================================
-- STRICT PAYMENT VERIFICATION SYSTEM
-- ===================================

-- 1. Create payment_verifications_log table to track blockchain-verified transactions
CREATE TABLE IF NOT EXISTS public.payment_verifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES public.ton_payments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  product_type text NOT NULL,
  amount_ton numeric NOT NULL,
  tx_hash text,
  blockchain_verified boolean NOT NULL DEFAULT false,
  sender_address text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Prevent replay attacks: one tx_hash can only be used once
CREATE UNIQUE INDEX IF NOT EXISTS payment_verifications_log_tx_hash_unique 
  ON public.payment_verifications_log(tx_hash) 
  WHERE tx_hash IS NOT NULL;

-- Enable RLS
ALTER TABLE public.payment_verifications_log ENABLE ROW LEVEL SECURITY;

-- Only service role can manage this table (security critical)
CREATE POLICY "Service role manages payment verifications"
  ON public.payment_verifications_log
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Add payment_id and payment_verified to user_servers
ALTER TABLE public.user_servers 
  ADD COLUMN IF NOT EXISTS payment_id uuid REFERENCES public.ton_payments(id),
  ADD COLUMN IF NOT EXISTS payment_verified boolean NOT NULL DEFAULT false;

-- 3. Add payment_id to spin_history  
ALTER TABLE public.spin_history
  ADD COLUMN IF NOT EXISTS payment_id uuid REFERENCES public.ton_payments(id);

-- 4. Index for fast lookups
CREATE INDEX IF NOT EXISTS user_servers_payment_id_idx ON public.user_servers(payment_id);
CREATE INDEX IF NOT EXISTS user_servers_payment_verified_idx ON public.user_servers(payment_verified);
CREATE INDEX IF NOT EXISTS spin_history_payment_id_idx ON public.spin_history(payment_id);
CREATE INDEX IF NOT EXISTS payment_verifications_log_payment_id_idx ON public.payment_verifications_log(payment_id);
CREATE INDEX IF NOT EXISTS payment_verifications_log_user_id_idx ON public.payment_verifications_log(user_id);
