-- Create notification queue table for incremental processing
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  telegram_id bigint NOT NULL,
  message text NOT NULL,
  time_slot text,
  status text DEFAULT 'pending',
  attempts int DEFAULT 0,
  last_error text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  scheduled_for timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_notification_queue_status ON public.notification_queue(status);
CREATE INDEX idx_notification_queue_scheduled ON public.notification_queue(scheduled_for) WHERE status = 'pending';

-- Policy for service role only (edge functions)
CREATE POLICY "Service role can manage notification queue"
ON public.notification_queue
FOR ALL
USING (true)
WITH CHECK (true);