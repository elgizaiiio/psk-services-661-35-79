-- Create home_sections table for image-based navigation
CREATE TABLE IF NOT EXISTS public.home_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  internal_route TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 1,
  layout_type TEXT NOT NULL DEFAULT 'square' CHECK (layout_type IN ('rectangle', 'square')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;

-- Public read access for all users
CREATE POLICY "Anyone can view active home sections"
  ON public.home_sections
  FOR SELECT
  USING (is_active = true);

-- Admin full access (using service role or authenticated)
CREATE POLICY "Admins can manage home sections"
  ON public.home_sections
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert default sections
INSERT INTO public.home_sections (image_url, internal_route, display_order, layout_type, is_active) VALUES
  ('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=400&fit=crop', '/mining-servers', 1, 'rectangle', true),
  ('https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&h=400&fit=crop', '/vip', 2, 'square', true),
  ('https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=400&h=400&fit=crop', '/contest', 3, 'square', true),
  ('https://images.unsplash.com/photo-1605792657660-596af9009e82?w=400&h=400&fit=crop', '/leaderboard', 4, 'square', true),
  ('https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop', '/spin', 5, 'square', true),
  ('https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop', '/server-store', 6, 'square', true);