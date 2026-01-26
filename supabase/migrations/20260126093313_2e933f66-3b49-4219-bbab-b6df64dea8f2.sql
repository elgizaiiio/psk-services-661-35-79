-- Add CRUD policies for bolt_daily_tasks table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert on bolt_daily_tasks" ON bolt_daily_tasks;
DROP POLICY IF EXISTS "Allow public update on bolt_daily_tasks" ON bolt_daily_tasks;
DROP POLICY IF EXISTS "Allow public delete on bolt_daily_tasks" ON bolt_daily_tasks;

-- Create policies for full CRUD operations on bolt_daily_tasks
CREATE POLICY "Allow public insert on bolt_daily_tasks"
ON bolt_daily_tasks FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public update on bolt_daily_tasks"
ON bolt_daily_tasks FOR UPDATE
TO public
USING (true);

CREATE POLICY "Allow public delete on bolt_daily_tasks"
ON bolt_daily_tasks FOR DELETE
TO public
USING (true);