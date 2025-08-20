-- Fix security warning: set search_path for function
CREATE OR REPLACE FUNCTION public.update_referral_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    -- Update referrer stats
    UPDATE public.viral_users 
    SET 
      total_referrals = total_referrals + 1,
      successful_referrals = successful_referrals + 1,
      referral_bonus_earned = referral_bonus_earned + 100
    WHERE id = NEW.referrer_id;
  END IF;
  
  RETURN NEW;
END;
$$;