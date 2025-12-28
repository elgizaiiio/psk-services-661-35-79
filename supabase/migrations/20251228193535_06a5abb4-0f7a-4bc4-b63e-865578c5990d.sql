-- Add payment_method column to ton_payments table
ALTER TABLE public.ton_payments 
ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'ton';

-- Add payment_currency column for multi-currency support
ALTER TABLE public.ton_payments 
ADD COLUMN IF NOT EXISTS payment_currency text DEFAULT 'TON';

-- Add nowpayments_id for tracking NOWPayments transactions
ALTER TABLE public.ton_payments 
ADD COLUMN IF NOT EXISTS nowpayments_id text;

-- Add eth_tx_hash for MetaMask transactions
ALTER TABLE public.ton_payments 
ADD COLUMN IF NOT EXISTS eth_tx_hash text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ton_payments_payment_method ON public.ton_payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_ton_payments_nowpayments_id ON public.ton_payments(nowpayments_id);