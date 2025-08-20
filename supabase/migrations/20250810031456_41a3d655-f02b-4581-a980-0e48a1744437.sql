-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  task_url TEXT,
  category TEXT NOT NULL DEFAULT 'main', -- 'main', 'partners', 'viral'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_completed_tasks table
CREATE TABLE public.user_completed_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  points_earned INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, task_id)
);

-- Create daily_codes table for viral tasks
CREATE TABLE public.daily_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code1 TEXT NOT NULL,
  code2 TEXT NOT NULL,
  code3 TEXT NOT NULL,
  code4 TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(date)
);

-- Create user_daily_code_attempts table
CREATE TABLE public.user_daily_code_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  points_earned INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_completed_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_code_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Anyone can view active tasks" 
ON public.tasks 
FOR SELECT 
USING (is_active = true);

-- Create policies for user_completed_tasks
CREATE POLICY "Users can view their own completed tasks" 
ON public.user_completed_tasks 
FOR SELECT 
USING (user_id IN (
  SELECT viral_users.id FROM viral_users 
  WHERE viral_users.telegram_id = ((current_setting('request.jwt.claims', true))::json ->> 'telegram_id')::bigint
));

CREATE POLICY "Users can insert their own completed tasks" 
ON public.user_completed_tasks 
FOR INSERT 
WITH CHECK (user_id IN (
  SELECT viral_users.id FROM viral_users 
  WHERE viral_users.telegram_id = ((current_setting('request.jwt.claims', true))::json ->> 'telegram_id')::bigint
));

-- Create policies for daily_codes
CREATE POLICY "Anyone can view current daily codes" 
ON public.daily_codes 
FOR SELECT 
USING (date = CURRENT_DATE);

-- Create policies for user_daily_code_attempts
CREATE POLICY "Users can manage their own daily code attempts" 
ON public.user_daily_code_attempts 
FOR ALL 
USING (user_id IN (
  SELECT viral_users.id FROM viral_users 
  WHERE viral_users.telegram_id = ((current_setting('request.jwt.claims', true))::json ->> 'telegram_id')::bigint
));

-- Create triggers for updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample tasks
INSERT INTO public.tasks (title, description, image_url, points, task_url, category) VALUES
('متابعة حساب تيليجرام', 'اتبع حساب تيليجرام الرسمي للحصول على 100 نقطة', '/lovable-uploads/d5ab6436-f277-4e06-a42f-a2222223c620.png', 100, 'https://t.me/viral_official', 'main'),
('مشاركة المنشور', 'شارك هذا المنشور في قصتك للحصول على 50 نقطة', '/lovable-uploads/d5ab6436-f277-4e06-a42f-a2222223c620.png', 50, 'https://t.me/viral_official/1', 'main'),
('انضم لمجموعة الشركاء', 'انضم إلى مجموعة شركائنا للحصول على 200 نقطة', '/lovable-uploads/d5ab6436-f277-4e06-a42f-a2222223c620.png', 200, 'https://t.me/viral_partners', 'partners'),
('مهمة يومية سرية', 'أدخل الأكواد السرية اليومية للحصول على 500 نقطة', '/lovable-uploads/d5ab6436-f277-4e06-a42f-a2222223c620.png', 500, '', 'viral');

-- Insert sample daily codes
INSERT INTO public.daily_codes (code1, code2, code3, code4, date) VALUES
('1234', '5678', '9012', '3456', CURRENT_DATE);