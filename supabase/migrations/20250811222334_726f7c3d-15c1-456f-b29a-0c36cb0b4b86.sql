-- Add last_active_at column to viral_users table for better tracking
ALTER TABLE public.viral_users 
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing users to have a last_active_at timestamp
UPDATE public.viral_users 
SET last_active_at = updated_at 
WHERE last_active_at IS NULL;

-- Create function to automatically update last_active_at
CREATE OR REPLACE FUNCTION public.update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_active_at on any update
DROP TRIGGER IF EXISTS update_viral_users_last_active ON public.viral_users;
CREATE TRIGGER update_viral_users_last_active
  BEFORE UPDATE ON public.viral_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_active();

-- Add indexes for better performance on admin queries
CREATE INDEX IF NOT EXISTS idx_viral_users_last_active_at ON public.viral_users(last_active_at);
CREATE INDEX IF NOT EXISTS idx_viral_users_telegram_id ON public.viral_users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_viral_mining_sessions_user_id ON public.viral_mining_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_viral_mining_sessions_is_active ON public.viral_mining_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_viral_upgrades_user_id ON public.viral_upgrades(user_id);
CREATE INDEX IF NOT EXISTS idx_viral_upgrades_upgrade_type ON public.viral_upgrades(upgrade_type);

-- Add RLS policies for admin access (you'll need to create an admin role system)
-- For now, keeping the dev access policies as they are