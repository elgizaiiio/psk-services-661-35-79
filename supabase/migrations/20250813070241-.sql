-- Create referral attempts tracking table
CREATE TABLE public.referral_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  referral_param TEXT NOT NULL,
  referrer_found BOOLEAN DEFAULT false,
  referrer_id UUID,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  attempt_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.referral_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing attempts
CREATE POLICY "Dev all access referral attempts" 
ON public.referral_attempts 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create pending referrals queue table
CREATE TABLE public.pending_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  telegram_username TEXT,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  referral_param TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT now() + INTERVAL '1 hour',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Enable RLS
ALTER TABLE public.pending_referrals ENABLE ROW LEVEL SECURITY;

-- Create policy for pending referrals
CREATE POLICY "Dev all access pending referrals" 
ON public.pending_referrals 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX idx_referral_attempts_telegram_id ON public.referral_attempts(telegram_id);
CREATE INDEX idx_referral_attempts_referral_param ON public.referral_attempts(referral_param);
CREATE INDEX idx_pending_referrals_telegram_id ON public.pending_referrals(telegram_id);
CREATE INDEX idx_pending_referrals_referral_param ON public.pending_referrals(referral_param);
CREATE INDEX idx_pending_referrals_status ON public.pending_referrals(status);
CREATE INDEX idx_pending_referrals_next_retry ON public.pending_referrals(next_retry_at) WHERE status = 'pending';

-- Add referral statistics to viral_users
ALTER TABLE public.viral_users ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;
ALTER TABLE public.viral_users ADD COLUMN IF NOT EXISTS successful_referrals INTEGER DEFAULT 0;
ALTER TABLE public.viral_users ADD COLUMN IF NOT EXISTS referral_bonus_earned NUMERIC DEFAULT 0;

-- Function to update referral stats
CREATE OR REPLACE FUNCTION public.update_referral_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    -- Update referrer stats
    UPDATE public.viral_users 
    SET 
      total_referrals = total_referrals + 1,
      successful_referrals = successful_referrals + 1,
      referral_bonus_earned = referral_bonus_earned + 100
    WHERE id = NEW.referrer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update stats
CREATE TRIGGER update_referral_stats_trigger
  AFTER INSERT ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referral_stats();