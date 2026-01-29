-- Add column to track referral tickets
ALTER TABLE public.user_spin_tickets 
ADD COLUMN IF NOT EXISTS referral_tickets_count INTEGER NOT NULL DEFAULT 0;

-- Add comment
COMMENT ON COLUMN public.user_spin_tickets.referral_tickets_count IS 'Free spin tickets earned from referrals (1 ticket per referral)';