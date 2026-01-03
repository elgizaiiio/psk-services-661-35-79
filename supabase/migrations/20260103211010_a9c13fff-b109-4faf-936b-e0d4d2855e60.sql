-- Add notifications_enabled and bot_blocked columns to bolt_users
ALTER TABLE public.bolt_users 
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS bot_blocked BOOLEAN DEFAULT false;