-- Create a table for promo configuration
CREATE TABLE IF NOT EXISTS promo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_key TEXT UNIQUE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_hours INTEGER NOT NULL DEFAULT 48,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the initial promo settings
INSERT INTO promo_settings (promo_key, start_time, duration_hours, is_active)
VALUES ('monthly_winner_48h', NOW(), 48, true)
ON CONFLICT (promo_key) DO NOTHING;

-- Enable RLS
ALTER TABLE promo_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read promo settings
CREATE POLICY "Anyone can view promo settings"
ON promo_settings FOR SELECT
USING (true);