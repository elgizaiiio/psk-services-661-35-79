-- Drop old policies on bolt_completed_tasks
DROP POLICY IF EXISTS "Users insert own completed tasks" ON public.bolt_completed_tasks;
DROP POLICY IF EXISTS "Users view own completed tasks" ON public.bolt_completed_tasks;

-- Create new RLS policies using telegram_id
CREATE POLICY "Users can view own completed tasks"
ON public.bolt_completed_tasks FOR SELECT
USING (user_id IN (
  SELECT id FROM public.bolt_users 
  WHERE telegram_id = NULLIF(current_setting('request.jwt.claims', true)::json->>'telegram_id', '')::bigint
));

CREATE POLICY "Users can insert own completed tasks"
ON public.bolt_completed_tasks FOR INSERT
WITH CHECK (user_id IN (
  SELECT id FROM public.bolt_users 
  WHERE telegram_id = NULLIF(current_setting('request.jwt.claims', true)::json->>'telegram_id', '')::bigint
));

CREATE POLICY "Users can delete own completed tasks"
ON public.bolt_completed_tasks FOR DELETE
USING (user_id IN (
  SELECT id FROM public.bolt_users 
  WHERE telegram_id = NULLIF(current_setting('request.jwt.claims', true)::json->>'telegram_id', '')::bigint
));