-- Create referral contests table
CREATE TABLE public.referral_contests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  prize_pool_usd NUMERIC NOT NULL DEFAULT 10000,
  prizes_config JSONB NOT NULL DEFAULT '[
    {"rank": 1, "prize_usd": 3000},
    {"rank": 2, "prize_usd": 2000},
    {"rank": 3, "prize_usd": 1500},
    {"rank": 4, "prize_usd": 500},
    {"rank": 5, "prize_usd": 500},
    {"rank": 6, "prize_usd": 500},
    {"rank": 7, "prize_usd": 500},
    {"rank": 8, "prize_usd": 500},
    {"rank": 9, "prize_usd": 500},
    {"rank": 10, "prize_usd": 500}
  ]'::jsonb,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contest participants table
CREATE TABLE public.contest_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id UUID NOT NULL REFERENCES public.referral_contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  referral_count INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_referral_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(contest_id, user_id)
);

-- Enable RLS
ALTER TABLE public.referral_contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_contests
CREATE POLICY "Anyone can view active contests"
  ON public.referral_contests FOR SELECT
  USING (is_active = true);

-- RLS policies for contest_participants
CREATE POLICY "Anyone can view contest participants"
  ON public.contest_participants FOR SELECT
  USING (true);

CREATE POLICY "Service role inserts participants"
  ON public.contest_participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role updates participants"
  ON public.contest_participants FOR UPDATE
  USING (true);

-- Enable realtime for live leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_participants;

-- Create indexes for performance
CREATE INDEX idx_contest_participants_contest_id ON public.contest_participants(contest_id);
CREATE INDEX idx_contest_participants_referral_count ON public.contest_participants(referral_count DESC);
CREATE INDEX idx_referral_contests_active ON public.referral_contests(is_active, status);

-- Insert the first contest (2 months starting from now)
INSERT INTO public.referral_contests (
  name,
  name_ar,
  description,
  description_ar,
  prize_pool_usd,
  start_date,
  end_date,
  status,
  is_active
) VALUES (
  'BOLT Referral Championship',
  'بطولة إحالات BOLT',
  'Invite friends and compete for $10,000 in TON! Top 10 referrers win amazing prizes.',
  'قم بدعوة أصدقائك وتنافس على 10,000$ بعملة TON! أفضل 10 محيلين يفوزون بجوائز رائعة.',
  10000,
  now(),
  now() + INTERVAL '2 months',
  'active',
  true
);