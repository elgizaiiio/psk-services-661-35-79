-- Create daily tasks table
CREATE TABLE IF NOT EXISTS public.bolt_daily_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  task_type TEXT NOT NULL DEFAULT 'action', -- action, social, mining, referral
  reward_tokens INTEGER NOT NULL DEFAULT 50,
  required_action TEXT, -- e.g., 'mine_once', 'invite_friend', 'claim_streak'
  action_url TEXT,
  icon TEXT DEFAULT 'star',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily task completions table (tracks daily completions per user)
CREATE TABLE IF NOT EXISTS public.bolt_daily_task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES bolt_users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES bolt_daily_tasks(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_id, completed_date)
);

-- Enable RLS
ALTER TABLE public.bolt_daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolt_daily_task_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily tasks
CREATE POLICY "Daily tasks are viewable by everyone" 
ON public.bolt_daily_tasks 
FOR SELECT 
USING (true);

-- RLS Policies for completions
CREATE POLICY "Users can view their completions" 
ON public.bolt_daily_task_completions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their completions" 
ON public.bolt_daily_task_completions 
FOR INSERT 
WITH CHECK (true);

-- Insert sample daily tasks
INSERT INTO public.bolt_daily_tasks (title, title_ar, description, description_ar, task_type, reward_tokens, required_action, icon) VALUES
('Start Mining', 'ابدأ التعدين', 'Start a mining session today', 'ابدأ جلسة تعدين اليوم', 'mining', 100, 'start_mining', 'zap'),
('Claim Daily Streak', 'اجمع المكافأة اليومية', 'Claim your daily streak reward', 'اجمع مكافأة الخط اليومي', 'action', 50, 'claim_streak', 'flame'),
('Invite a Friend', 'ادعُ صديقاً', 'Invite someone to join', 'ادعُ شخصاً للانضمام', 'referral', 200, 'invite_friend', 'users'),
('Visit Achievements', 'زُر الإنجازات', 'Check your achievements page', 'تفقد صفحة إنجازاتك', 'action', 30, 'visit_achievements', 'trophy'),
('Spin Lucky Wheel', 'أدر عجلة الحظ', 'Use the lucky spin feature', 'استخدم ميزة الدوران المحظوظ', 'action', 75, 'lucky_spin', 'sparkles'),
('Complete Any Task', 'أكمل أي مهمة', 'Complete any task from the tasks page', 'أكمل أي مهمة من صفحة المهام', 'action', 50, 'complete_task', 'check'),
('Join Telegram Channel', 'انضم لقناة تيليجرام', 'Follow our official channel', 'تابع قناتنا الرسمية', 'social', 150, 'join_telegram', 'send'),
('Check Leaderboard', 'تفقد لوحة المتصدرين', 'View the leaderboard', 'شاهد لوحة المتصدرين', 'action', 25, 'view_leaderboard', 'bar-chart');