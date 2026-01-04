-- Create automatic referral record function as safety net
CREATE OR REPLACE FUNCTION public.auto_create_referral_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only on INSERT when referred_by is set
  IF TG_OP = 'INSERT' AND NEW.referred_by IS NOT NULL THEN
    -- Check if referral record already exists
    IF NOT EXISTS (
      SELECT 1 FROM bolt_referrals 
      WHERE referrer_id = NEW.referred_by 
        AND referred_id = NEW.id
    ) THEN
      -- Create referral record
      INSERT INTO bolt_referrals (referrer_id, referred_id, bonus_earned, status)
      VALUES (NEW.referred_by, NEW.id, 100, 'active');
      
      -- Update referrer stats
      UPDATE bolt_users
      SET 
        total_referrals = COALESCE(total_referrals, 0) + 1,
        referral_bonus = COALESCE(referral_bonus, 0) + 100,
        token_balance = COALESCE(token_balance, 0) + 100,
        updated_at = NOW()
      WHERE id = NEW.referred_by;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_auto_create_referral ON public.bolt_users;

-- Create the trigger
CREATE TRIGGER trg_auto_create_referral
AFTER INSERT ON public.bolt_users
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_referral_record();