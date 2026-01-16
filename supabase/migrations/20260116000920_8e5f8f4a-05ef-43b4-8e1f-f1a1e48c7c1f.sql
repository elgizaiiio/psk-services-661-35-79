
-- Create mining_server_types table for configurable servers
CREATE TABLE public.mining_server_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  image_url TEXT,
  tier TEXT DEFAULT 'basic',
  category TEXT DEFAULT 'farming',
  level INTEGER DEFAULT 1,
  max_level INTEGER DEFAULT 10,
  base_income_per_hour NUMERIC DEFAULT 0,
  upgrade_cost_per_level NUMERIC DEFAULT 100,
  price_ton NUMERIC DEFAULT 0,
  price_bolt INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create cooling_systems table
CREATE TABLE public.cooling_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  image_url TEXT,
  efficiency_boost NUMERIC DEFAULT 0.1,
  price_ton NUMERIC DEFAULT 0,
  price_bolt INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_server_levels table for tracking user server progress
CREATE TABLE public.user_server_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.bolt_users(id) ON DELETE CASCADE,
  server_type_id UUID REFERENCES public.mining_server_types(id) ON DELETE CASCADE,
  current_level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  cooling_system_id UUID REFERENCES public.cooling_systems(id),
  purchased_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, server_type_id)
);

-- Create mining_images table for rotating images
CREATE TABLE public.mining_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.mining_server_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooling_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_server_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mining_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for mining_server_types (public read)
CREATE POLICY "Anyone can view active server types"
ON public.mining_server_types FOR SELECT
USING (is_active = true);

-- RLS policies for cooling_systems (public read)
CREATE POLICY "Anyone can view active cooling systems"
ON public.cooling_systems FOR SELECT
USING (is_active = true);

-- RLS policies for user_server_levels
CREATE POLICY "Users can view their own server levels"
ON public.user_server_levels FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own server levels"
ON public.user_server_levels FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own server levels"
ON public.user_server_levels FOR UPDATE
USING (true);

-- RLS policies for mining_images (public read)
CREATE POLICY "Anyone can view active mining images"
ON public.mining_images FOR SELECT
USING (is_active = true);

-- Insert default server types
INSERT INTO public.mining_server_types (name, name_ar, tier, category, base_income_per_hour, upgrade_cost_per_level, price_bolt, display_order) VALUES
('OTC Pool', 'مجمع OTC', 'basic', 'farming', 10, 280, 280, 1),
('Crypto Index', 'مؤشر العملات', 'basic', 'farming', 15, 1500, 1500, 2),
('Syndicate', 'النقابة', 'standard', 'farming', 20, 350, 350, 3),
('$MBASE Pool', 'مجمع MBASE', 'standard', 'farming', 12, 125, 125, 4),
('Cloud Mining', 'التعدين السحابي', 'premium', 'distance', 25, 500, 500, 5),
('GPU Farm', 'مزرعة GPU', 'premium', 'distance', 30, 800, 800, 6);

-- Insert default cooling systems
INSERT INTO public.cooling_systems (name, name_ar, efficiency_boost, price_bolt, display_order) VALUES
('Basic Fan', 'مروحة بسيطة', 0.05, 100, 1),
('Water Cooling', 'تبريد مائي', 0.15, 500, 2),
('Nitrogen Cooling', 'تبريد نيتروجين', 0.30, 1500, 3);

-- Insert default mining image
INSERT INTO public.mining_images (image_url, display_order) VALUES
('/lovable-uploads/8acfad30-aa90-4edd-b779-aafd43058584.png', 1);
