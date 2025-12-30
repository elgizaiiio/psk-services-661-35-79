-- Drop all old permissive policies
DROP POLICY IF EXISTS "Anyone can view bolt users" ON public.bolt_users;
DROP POLICY IF EXISTS "Anyone can view payments by wallet" ON public.ton_payments;
DROP POLICY IF EXISTS "Users can view their own servers" ON public.user_servers;
DROP POLICY IF EXISTS "Users can view all spin history" ON public.spin_history;
DROP POLICY IF EXISTS "Users can view their own daily spins" ON public.daily_spins;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.user_spin_tickets;
DROP POLICY IF EXISTS "Users can view their own boosters" ON public.user_boosters;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.bolt_users;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.bolt_users;
DROP POLICY IF EXISTS "Enable update for all users" ON public.bolt_users;
DROP POLICY IF EXISTS "Public read access" ON public.bolt_users;
DROP POLICY IF EXISTS "Public read access" ON public.ton_payments;
DROP POLICY IF EXISTS "Public read access" ON public.stars_payments;
DROP POLICY IF EXISTS "Public read access" ON public.user_servers;
DROP POLICY IF EXISTS "Public read access" ON public.spin_history;
DROP POLICY IF EXISTS "Public read access" ON public.daily_spins;
DROP POLICY IF EXISTS "Public read access" ON public.user_spin_tickets;
DROP POLICY IF EXISTS "Public read access" ON public.user_boosters;