-- Allow authenticated users to create tasks
CREATE POLICY "Authenticated users can create tasks" 
ON public.tasks 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update tasks
CREATE POLICY "Authenticated users can update tasks" 
ON public.tasks 
FOR UPDATE 
TO authenticated
USING (true);