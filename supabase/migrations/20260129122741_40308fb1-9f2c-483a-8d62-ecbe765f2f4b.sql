-- Create referral commissions table to track 50% commissions
CREATE TABLE public.referral_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'ton', -- 'ton', 'stars', etc.
  original_amount NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  commission_percent NUMERIC NOT NULL DEFAULT 50,
  currency TEXT NOT NULL DEFAULT 'TON', -- 'TON', 'USDT', 'STARS'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own commissions (as referrer)
CREATE POLICY "Users can view own commissions" 
ON public.referral_commissions 
FOR SELECT 
USING (referrer_id = get_telegram_user_id());

-- Create index for faster queries
CREATE INDEX idx_referral_commissions_referrer ON public.referral_commissions(referrer_id);
CREATE INDEX idx_referral_commissions_payment ON public.referral_commissions(payment_id);

-- Add total_commission column to bolt_users if not exists
ALTER TABLE public.bolt_users ADD COLUMN IF NOT EXISTS total_commission_ton NUMERIC DEFAULT 0;
ALTER TABLE public.bolt_users ADD COLUMN IF NOT EXISTS total_commission_usdt NUMERIC DEFAULT 0;