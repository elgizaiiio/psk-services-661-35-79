-- Add daily_ton_yield column to user_servers table
ALTER TABLE user_servers 
ADD COLUMN IF NOT EXISTS daily_ton_yield numeric DEFAULT 0 NOT NULL;

-- Update existing servers with TON yields (servers >= 5 TON get 1% daily)
UPDATE user_servers SET daily_ton_yield = 0.05 WHERE server_name = 'Advanced I' AND is_active = true;
UPDATE user_servers SET daily_ton_yield = 0.09 WHERE server_name = 'Advanced II' AND is_active = true;
UPDATE user_servers SET daily_ton_yield = 0.16 WHERE server_name = 'Elite I' AND is_active = true;
UPDATE user_servers SET daily_ton_yield = 0.30 WHERE server_name = 'Elite II' AND is_active = true;
UPDATE user_servers SET daily_ton_yield = 0.50 WHERE server_name = 'Legend' AND is_active = true;
UPDATE user_servers SET daily_ton_yield = 1.00 WHERE server_name = 'Mythic' AND is_active = true;