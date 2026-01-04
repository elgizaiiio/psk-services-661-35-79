-- Create increment_referral_stats function
CREATE OR REPLACE FUNCTION increment_referral_stats(
  referrer_uuid UUID,
  bonus_amount NUMERIC DEFAULT 100
)
RETURNS void AS $$
BEGIN
  UPDATE bolt_users
  SET 
    total_referrals = COALESCE(total_referrals, 0) + 1,
    referral_bonus = COALESCE(referral_bonus, 0) + bonus_amount,
    token_balance = COALESCE(token_balance, 0) + bonus_amount,
    updated_at = NOW()
  WHERE id = referrer_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix missing referrals: Insert missing records into bolt_referrals
INSERT INTO bolt_referrals (referrer_id, referred_id, bonus_earned, status, created_at)
SELECT 
  bu.referred_by as referrer_id,
  bu.id as referred_id,
  100 as bonus_earned,
  'completed' as status,
  bu.created_at
FROM bolt_users bu
WHERE bu.referred_by IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM bolt_referrals br 
  WHERE br.referrer_id = bu.referred_by 
  AND br.referred_id = bu.id
);

-- Update referrer stats based on actual referrals count
WITH referral_counts AS (
  SELECT referrer_id, COUNT(*) as ref_count
  FROM bolt_referrals
  WHERE status = 'completed' OR status = 'active'
  GROUP BY referrer_id
)
UPDATE bolt_users
SET 
  total_referrals = rc.ref_count,
  referral_bonus = rc.ref_count * 100,
  token_balance = token_balance + (rc.ref_count * 100 - COALESCE(referral_bonus, 0)),
  updated_at = NOW()
FROM referral_counts rc
WHERE bolt_users.id = rc.referrer_id
AND (bolt_users.total_referrals IS NULL OR bolt_users.total_referrals != rc.ref_count);