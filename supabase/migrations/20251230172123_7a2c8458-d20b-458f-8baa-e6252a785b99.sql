-- Create table for admin task creation state (for multi-step bot conversation)
CREATE TABLE public.admin_task_creation_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint NOT NULL UNIQUE,
  step text NOT NULL DEFAULT 'title',
  task_title text,
  task_url text,
  task_image text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_task_creation_state ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (for edge functions)
CREATE POLICY "Service role only" ON public.admin_task_creation_state
  FOR ALL USING (false);

-- Add index for telegram_id lookups
CREATE INDEX idx_admin_task_state_telegram_id ON public.admin_task_creation_state(telegram_id);