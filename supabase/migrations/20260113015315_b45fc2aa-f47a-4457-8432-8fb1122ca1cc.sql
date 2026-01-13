-- Add internal_route column to promo_banners for internal navigation
ALTER TABLE public.promo_banners 
ADD COLUMN IF NOT EXISTS internal_route TEXT DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.promo_banners.internal_route IS 'Internal route path for navigation within the app (e.g., /mining-servers, /spin)';

-- Make title nullable since we only need image now
ALTER TABLE public.promo_banners 
ALTER COLUMN title DROP NOT NULL;