-- Create server inventory table
CREATE TABLE public.server_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id TEXT UNIQUE NOT NULL,
  server_name TEXT NOT NULL,
  total_stock INTEGER NOT NULL,
  sold_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.server_inventory ENABLE ROW LEVEL SECURITY;

-- Everyone can view inventory
CREATE POLICY "Anyone can view server inventory"
ON public.server_inventory FOR SELECT
USING (true);

-- Anyone can update inventory (for purchase increments)
CREATE POLICY "Anyone can update server inventory"
ON public.server_inventory FOR UPDATE
USING (true);

-- Insert initial stock data
INSERT INTO public.server_inventory (server_id, server_name, total_stock, sold_count) VALUES
  ('basic-1', 'Starter', 500, 0),
  ('basic-2', 'Basic', 400, 0),
  ('pro-1', 'Pro', 300, 0),
  ('pro-2', 'Advanced', 200, 0),
  ('elite-1', 'Elite', 100, 0),
  ('elite-2', 'Ultra', 50, 0);