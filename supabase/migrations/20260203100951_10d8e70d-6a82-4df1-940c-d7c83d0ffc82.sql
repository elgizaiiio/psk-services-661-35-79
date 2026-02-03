-- Add is_pinned column to bolt_tasks table
ALTER TABLE public.bolt_tasks 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Add pin_order column for ordering pinned tasks
ALTER TABLE public.bolt_tasks 
ADD COLUMN IF NOT EXISTS pin_order INTEGER DEFAULT 0;