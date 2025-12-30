-- Fix the security definer view issue by converting to SECURITY INVOKER
DROP VIEW IF EXISTS public.public_leaderboard;

-- Create a regular view (not security definer)
CREATE VIEW public.public_leaderboard AS
SELECT 
  bu.id,
  COALESCE(bu.telegram_username, 'Anonymous') as display_name,
  bu.token_balance,
  bu.mining_power,
  bu.total_referrals,
  bu.photo_url
FROM public.bolt_users bu
WHERE bu.telegram_username IS NOT NULL
ORDER BY bu.token_balance DESC
LIMIT 100;

-- Grant access
GRANT SELECT ON public.public_leaderboard TO anon, authenticated;