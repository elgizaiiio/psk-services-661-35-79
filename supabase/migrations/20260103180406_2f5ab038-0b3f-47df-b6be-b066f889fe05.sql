-- Create ad_views table to track ad views and rewards
CREATE TABLE public.ad_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  ad_type TEXT NOT NULL DEFAULT 'task_reward',
  reward_bolt INTEGER DEFAULT 10,
  reward_usdt NUMERIC DEFAULT 0.01,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient daily count queries
CREATE INDEX idx_ad_views_telegram_date ON public.ad_views(telegram_id, created_at);
CREATE INDEX idx_ad_views_user_date ON public.ad_views(user_id, created_at);

-- Enable RLS
ALTER TABLE public.ad_views ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own ad history
CREATE POLICY "Users can view own ad views" 
  ON public.ad_views 
  FOR SELECT 
  USING (user_id IN (
    SELECT id FROM public.bolt_users WHERE telegram_id = ad_views.telegram_id
  ));

-- Policy for service role to insert ad views (edge function)
CREATE POLICY "Service role can insert ad views" 
  ON public.ad_views 
  FOR INSERT 
  WITH CHECK (true);