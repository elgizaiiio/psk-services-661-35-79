-- Add columns for daily message limit tracking
ALTER TABLE bolt_users ADD COLUMN IF NOT EXISTS daily_message_count INTEGER DEFAULT 0;
ALTER TABLE bolt_users ADD COLUMN IF NOT EXISTS last_message_date DATE;

-- Create notification run logs table for monitoring
CREATE TABLE IF NOT EXISTS notification_run_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  run_type TEXT NOT NULL, -- 'daily' or 'marketing'
  time_slot TEXT,
  total_eligible INTEGER DEFAULT 0,
  sent INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  blocked INTEGER DEFAULT 0,
  rate_limits INTEGER DEFAULT 0,
  skipped_daily_limit INTEGER DEFAULT 0,
  average_delay_ms NUMERIC DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  stopped_early BOOLEAN DEFAULT false,
  stop_reason TEXT
);

-- Enable RLS
ALTER TABLE notification_run_logs ENABLE ROW LEVEL SECURITY;

-- Only allow service role to insert/read (no public access)
CREATE POLICY "Service role only" ON notification_run_logs
  FOR ALL USING (false);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notification_run_logs_created_at ON notification_run_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bolt_users_last_message_date ON bolt_users(last_message_date);