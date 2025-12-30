
-- جدول البوسترات النشطة للمستخدمين
CREATE TABLE public.user_boosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  booster_type TEXT NOT NULL CHECK (booster_type IN ('mining_x2', 'task_x2')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول سجل السبين
CREATE TABLE public.spin_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  reward_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول السبين اليومي
CREATE TABLE public.daily_spins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  spin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  free_spin_used BOOLEAN DEFAULT false,
  paid_spins_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, spin_date)
);

-- جدول طلبات السحب
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL CHECK (currency IN ('TON', 'USDT', 'BOLT')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  wallet_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- جدول مدفوعات النجوم
CREATE TABLE public.stars_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  amount_stars INTEGER NOT NULL,
  amount_usd NUMERIC,
  product_type TEXT NOT NULL,
  product_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  telegram_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_boosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stars_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_boosters
CREATE POLICY "Users can view their own boosters" ON public.user_boosters
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own boosters" ON public.user_boosters
  FOR INSERT WITH CHECK (true);

-- RLS Policies for spin_history
CREATE POLICY "Users can view all spin history" ON public.spin_history
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own spin history" ON public.spin_history
  FOR INSERT WITH CHECK (true);

-- RLS Policies for daily_spins
CREATE POLICY "Users can view their own daily spins" ON public.daily_spins
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own daily spins" ON public.daily_spins
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own daily spins" ON public.daily_spins
  FOR UPDATE USING (true);

-- RLS Policies for withdrawal_requests
CREATE POLICY "Users can view their own withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (true);

-- RLS Policies for stars_payments
CREATE POLICY "Users can view their own stars payments" ON public.stars_payments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own stars payments" ON public.stars_payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own stars payments" ON public.stars_payments
  FOR UPDATE USING (true);

-- Indexes for performance
CREATE INDEX idx_user_boosters_user_id ON public.user_boosters(user_id);
CREATE INDEX idx_user_boosters_expires_at ON public.user_boosters(expires_at);
CREATE INDEX idx_spin_history_user_id ON public.spin_history(user_id);
CREATE INDEX idx_spin_history_created_at ON public.spin_history(created_at DESC);
CREATE INDEX idx_daily_spins_user_date ON public.daily_spins(user_id, spin_date);
CREATE INDEX idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX idx_stars_payments_user_id ON public.stars_payments(user_id);
