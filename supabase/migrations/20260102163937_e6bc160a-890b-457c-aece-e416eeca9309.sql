-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create notification templates table
CREATE TABLE public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_slot TEXT NOT NULL CHECK (time_slot IN ('morning', 'afternoon', 'evening')),
  theme TEXT NOT NULL CHECK (theme IN ('spin', 'mining', 'referral', 'general')),
  prompt_context TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Admin read policy (public read for edge functions)
CREATE POLICY "Allow public read for notification templates"
ON public.notification_templates FOR SELECT
USING (true);

-- Insert default templates
INSERT INTO public.notification_templates (time_slot, theme, prompt_context) VALUES
('morning', 'spin', 'Encourage users to start their day with a lucky spin on the slots'),
('morning', 'mining', 'Remind users to check their mining progress and claim rewards'),
('morning', 'general', 'Motivate users to explore the app features today'),
('afternoon', 'referral', 'Encourage users to invite friends and earn TON/USDT rewards'),
('afternoon', 'spin', 'Perfect afternoon break - try your luck on the slots'),
('afternoon', 'general', 'Remind users about daily tasks and rewards'),
('evening', 'spin', 'End the day with one more spin for big rewards'),
('evening', 'mining', 'Check mining rewards before sleep and start a new session'),
('evening', 'referral', 'Share your referral link with friends tonight');

-- Add tracking columns to ai_scheduled_notifications
ALTER TABLE public.ai_scheduled_notifications 
ADD COLUMN IF NOT EXISTS notification_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS time_slot TEXT;