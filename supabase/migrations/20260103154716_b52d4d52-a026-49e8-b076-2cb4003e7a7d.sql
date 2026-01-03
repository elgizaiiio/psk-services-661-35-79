-- Create partnership_requests table for managing partnership task requests
CREATE TABLE IF NOT EXISTS public.partnership_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL,
  telegram_username TEXT,
  task_title TEXT NOT NULL,
  task_url TEXT NOT NULL,
  task_image TEXT,
  points INTEGER DEFAULT 10,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by BIGINT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  task_id UUID REFERENCES public.bolt_tasks(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add partnership tracking columns to bolt_tasks
ALTER TABLE public.bolt_tasks ADD COLUMN IF NOT EXISTS partnership_id UUID REFERENCES public.partnership_requests(id);
ALTER TABLE public.bolt_tasks ADD COLUMN IF NOT EXISTS partner_telegram_id BIGINT;

-- Enable RLS on partnership_requests
ALTER TABLE public.partnership_requests ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage all partnership requests
CREATE POLICY "Allow public read for approved partnerships"
  ON public.partnership_requests
  FOR SELECT
  USING (status = 'approved');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_partnership_requests_telegram_id ON public.partnership_requests(telegram_id);
CREATE INDEX IF NOT EXISTS idx_partnership_requests_status ON public.partnership_requests(status);
CREATE INDEX IF NOT EXISTS idx_bolt_tasks_partner_telegram_id ON public.bolt_tasks(partner_telegram_id);