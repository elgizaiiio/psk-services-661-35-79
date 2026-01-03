-- Drop existing policies for bolt_completed_tasks
DROP POLICY IF EXISTS "Users can delete own completed tasks" ON public.bolt_completed_tasks;
DROP POLICY IF EXISTS "Users can insert own completed tasks" ON public.bolt_completed_tasks;
DROP POLICY IF EXISTS "Users can view own completed tasks" ON public.bolt_completed_tasks;

-- Drop existing policies for user_spin_tickets
DROP POLICY IF EXISTS "Allow insert for own tickets" ON public.user_spin_tickets;
DROP POLICY IF EXISTS "Allow select for own tickets" ON public.user_spin_tickets;
DROP POLICY IF EXISTS "Allow update for own tickets" ON public.user_spin_tickets;

-- Create new permissive policies for bolt_completed_tasks (allow all operations for now)
CREATE POLICY "Enable all access for bolt_completed_tasks"
ON public.bolt_completed_tasks
FOR ALL
USING (true)
WITH CHECK (true);

-- Create new permissive policies for user_spin_tickets (allow all operations for now)
CREATE POLICY "Enable all access for user_spin_tickets"
ON public.user_spin_tickets
FOR ALL
USING (true)
WITH CHECK (true);