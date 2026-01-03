
-- Create marketing_campaigns table
CREATE TABLE public.marketing_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  campaign_type TEXT NOT NULL DEFAULT 'general',
  trigger_type TEXT NOT NULL DEFAULT 'scheduled',
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  message_template TEXT,
  message_template_ar TEXT,
  ai_prompt_context TEXT,
  target_segment TEXT NOT NULL DEFAULT 'all',
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 0,
  send_hour INTEGER DEFAULT 12,
  cooldown_hours INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_segments table
CREATE TABLE public.user_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  segment_key TEXT NOT NULL UNIQUE,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  auto_update BOOLEAN DEFAULT true,
  user_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create marketing_events table
CREATE TABLE public.marketing_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  message_sent TEXT,
  delivery_status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create campaign_analytics table
CREATE TABLE public.campaign_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  messages_sent INTEGER DEFAULT 0,
  messages_delivered INTEGER DEFAULT 0,
  messages_opened INTEGER DEFAULT 0,
  messages_clicked INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campaign_id, date)
);

-- Enable RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Service role only for admin management
CREATE POLICY "Service role manages campaigns" ON public.marketing_campaigns FOR ALL USING (true);
CREATE POLICY "Service role manages segments" ON public.user_segments FOR ALL USING (true);
CREATE POLICY "Service role manages events" ON public.marketing_events FOR ALL USING (true);
CREATE POLICY "Service role manages analytics" ON public.campaign_analytics FOR ALL USING (true);

-- Allow users to view their own marketing events
CREATE POLICY "Users view own events" ON public.marketing_events FOR SELECT USING (user_id = get_current_user_uuid());

-- Insert default segments
INSERT INTO public.user_segments (name, name_ar, segment_key, description, rules) VALUES
('New Users', 'المستخدمون الجدد', 'new_users', 'Users who joined in the last 7 days', '{"days_since_signup": {"max": 7}}'::jsonb),
('Inactive 3 Days', 'غير نشط 3 أيام', 'inactive_3d', 'Users inactive for 3+ days', '{"days_inactive": {"min": 3}}'::jsonb),
('Inactive 7 Days', 'غير نشط 7 أيام', 'inactive_7d', 'Users inactive for 7+ days', '{"days_inactive": {"min": 7}}'::jsonb),
('VIP Users', 'مستخدمو VIP', 'vip_users', 'Users with high balance or referrals', '{"min_balance": 10000, "min_referrals": 5}'::jsonb),
('Referral Champions', 'أبطال الإحالة', 'referral_champions', 'Users with 10+ referrals', '{"min_referrals": 10}'::jsonb),
('Low Balance', 'رصيد منخفض', 'low_balance', 'Users with balance under 100', '{"max_balance": 100}'::jsonb),
('Active Miners', 'المعدنون النشطون', 'active_miners', 'Users who mined in the last 24 hours', '{"last_mining_hours": 24}'::jsonb),
('All Users', 'جميع المستخدمين', 'all', 'All registered users', '{}'::jsonb);

-- Insert default campaigns
INSERT INTO public.marketing_campaigns (name, name_ar, campaign_type, trigger_type, target_segment, ai_prompt_context, priority) VALUES
('Welcome Sequence', 'سلسلة الترحيب', 'onboarding', 'event_based', 'new_users', 'Welcome new user to the mining app. Encourage them to start mining and complete daily tasks. Be friendly and helpful.', 10),
('Re-engagement 3 Days', 'إعادة التفاعل 3 أيام', 're_engagement', 'scheduled', 'inactive_3d', 'User has been inactive for 3 days. Remind them about mining rewards and daily tasks. Create urgency without being pushy.', 8),
('Win Back 7 Days', 'استعادة 7 أيام', 're_engagement', 'scheduled', 'inactive_7d', 'User has been away for a week. Offer a special comeback bonus. Highlight what they have missed.', 9),
('Referral Boost', 'تعزيز الإحالة', 'referral_boost', 'scheduled', 'all', 'Encourage users to invite friends. Highlight referral rewards and bonuses. Make it exciting.', 5),
('Daily Reminder', 'تذكير يومي', 'daily', 'scheduled', 'all', 'Friendly daily reminder about mining, tasks, and rewards. Keep it short and engaging.', 3);

-- Create updated_at trigger
CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
