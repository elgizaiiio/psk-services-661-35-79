-- Fix function search path security warning
CREATE OR REPLACE FUNCTION increment_referral_stats(
  referrer_uuid UUID,
  bonus_amount NUMERIC DEFAULT 100
)
RETURNS void AS $$
BEGIN
  UPDATE public.bolt_users
  SET 
    total_referrals = COALESCE(total_referrals, 0) + 1,
    referral_bonus = COALESCE(referral_bonus, 0) + bonus_amount,
    token_balance = COALESCE(token_balance, 0) + bonus_amount,
    updated_at = NOW()
  WHERE id = referrer_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;