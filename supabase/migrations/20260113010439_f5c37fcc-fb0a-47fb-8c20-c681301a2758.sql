-- Add VIRAL currency balance to users
ALTER TABLE public.bolt_users ADD COLUMN IF NOT EXISTS viral_balance NUMERIC DEFAULT 0;

-- Add VIRAL yield to user servers
ALTER TABLE public.user_servers ADD COLUMN IF NOT EXISTS daily_viral_yield NUMERIC DEFAULT 0;

-- Create promo_banners table for admin-managed banners
CREATE TABLE IF NOT EXISTS public.promo_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on promo_banners
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

-- Anyone can view active banners
CREATE POLICY "Anyone can view active banners" ON public.promo_banners 
FOR SELECT USING (is_active = true);

-- Service role can manage banners
CREATE POLICY "Service role can manage banners" ON public.promo_banners 
FOR ALL USING (true);

-- Delete old limited server offers
DELETE FROM public.limited_server_offers;

-- Insert new bundle packages with 50% discount
INSERT INTO public.limited_server_offers (name, name_ar, price_ton, daily_bolt_yield, daily_usdt_yield, daily_ton_yield, max_purchases, is_active) VALUES
('Starter Bundle', 'باقة المبتدئين', 1.5, 5000, 0.05, 0.001, 500, true),
('Pro Bundle', 'باقة المحترفين', 3.0, 15000, 0.15, 0.003, 300, true),
('Elite Bundle', 'باقة النخبة', 5.0, 50000, 0.5, 0.01, 150, true),
('VIP Bundle', 'باقة VIP', 10.0, 150000, 1.5, 0.03, 50, true);