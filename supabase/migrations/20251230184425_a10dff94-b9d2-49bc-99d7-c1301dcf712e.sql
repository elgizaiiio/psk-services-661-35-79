-- Add pro_tickets_count column for PRO wheel tickets
ALTER TABLE user_spin_tickets 
ADD COLUMN IF NOT EXISTS pro_tickets_count INTEGER DEFAULT 0;

-- Add wheel_type column to track which wheel was used
ALTER TABLE spin_history 
ADD COLUMN IF NOT EXISTS wheel_type TEXT DEFAULT 'normal';