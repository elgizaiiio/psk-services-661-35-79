-- Fix RLS policy on bolt_referrals to allow users to see their referrals
-- The current policy uses get_current_user_uuid() which doesn't work with standard PostgREST requests

DROP POLICY IF EXISTS "Users view own referrals" ON bolt_referrals;

CREATE POLICY "Public can view referrals" ON bolt_referrals
FOR SELECT
USING (true);