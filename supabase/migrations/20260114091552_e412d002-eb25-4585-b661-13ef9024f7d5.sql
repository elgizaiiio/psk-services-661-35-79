-- Create storage bucket for home sections images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'home-images',
  'home-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for home-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'home-images');

-- Allow authenticated/admin upload
CREATE POLICY "Admin upload access for home-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'home-images');

-- Allow admin update
CREATE POLICY "Admin update access for home-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'home-images');

-- Allow admin delete
CREATE POLICY "Admin delete access for home-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'home-images');