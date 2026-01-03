-- Create ad_clicks table for AdsGram tracking
CREATE TABLE public.ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT,
  banner_id TEXT,
  publisher_id TEXT,
  click_id TEXT UNIQUE,
  telegram_id BIGINT,
  user_id UUID REFERENCES public.bolt_users(id),
  paid BOOLEAN DEFAULT FALSE,
  paid_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

-- Service role can manage all ad clicks
CREATE POLICY "Service role manages ad clicks"
ON public.ad_clicks
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_ad_clicks_telegram_id ON public.ad_clicks(telegram_id);
CREATE INDEX idx_ad_clicks_created_at ON public.ad_clicks(created_at);
CREATE INDEX idx_ad_clicks_click_id ON public.ad_clicks(click_id);