-- Fix RLS policies for bolt_tasks to allow admin operations
CREATE POLICY "Allow public insert on bolt_tasks" 
ON public.bolt_tasks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on bolt_tasks" 
ON public.bolt_tasks 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on bolt_tasks" 
ON public.bolt_tasks 
FOR DELETE 
USING (true);

-- Fix RLS policies for bolt_daily_codes to allow admin operations
CREATE POLICY "Allow public insert on bolt_daily_codes" 
ON public.bolt_daily_codes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on bolt_daily_codes" 
ON public.bolt_daily_codes 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on bolt_daily_codes" 
ON public.bolt_daily_codes 
FOR DELETE 
USING (true);

-- Add free server to inventory
INSERT INTO public.server_inventory (server_id, server_name, total_stock, sold_count)
VALUES ('free-starter', 'Free Starter', 10000, 0)
ON CONFLICT (server_id) DO NOTHING;