-- Add reward columns for TON and USDT
ALTER TABLE public.bolt_tasks 
ADD COLUMN IF NOT EXISTS reward_ton numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward_usdt numeric DEFAULT 0;