-- Create table for tracking user free spins
CREATE TABLE public.user_free_spins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  total_spins INTEGER NOT NULL DEFAULT 0,
  daily_claimed BOOLEAN NOT NULL DEFAULT false,
  last_daily_claim TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_free_spins ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view their spins" 
ON public.user_free_spins 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert their spins" 
ON public.user_free_spins 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update their spins" 
ON public.user_free_spins 
FOR UPDATE 
USING (true);