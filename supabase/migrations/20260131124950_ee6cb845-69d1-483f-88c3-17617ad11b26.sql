-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the Bolt Town daily reset to run at midnight UTC
SELECT cron.schedule(
  'bolt-town-daily-reset',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://pxerqticmmpurwmumhyw.supabase.co/functions/v1/bolt-town-daily-reset',
    headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4ZXJxdGljbW1wdXJ3bXVtaHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NTY4MzgsImV4cCI6MjA4MjAzMjgzOH0.upUJaS2frlePfEk-9z3jnHpyX5s55Y3-_ovBpiIn1ik", "Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);