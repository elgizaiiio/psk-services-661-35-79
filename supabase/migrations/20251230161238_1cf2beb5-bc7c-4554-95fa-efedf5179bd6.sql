-- The view already exists without SECURITY DEFINER
-- Let's check and fix any remaining security definer views

-- First, ensure the view is properly set up (it should already be SECURITY INVOKER by default)
-- Views are SECURITY INVOKER by default in PostgreSQL, so this should be fine

-- Let's also add security_invoker explicitly
DROP VIEW IF EXISTS public.public_leaderboard;

CREATE VIEW public.public_leaderboard
WITH (security_invoker = true)
AS
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