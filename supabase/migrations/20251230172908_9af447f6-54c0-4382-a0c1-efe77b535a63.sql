-- Add columns to admin_task_creation_state for broadcast support
ALTER TABLE public.admin_task_creation_state 
ADD COLUMN IF NOT EXISTS action_type text DEFAULT 'task',
ADD COLUMN IF NOT EXISTS broadcast_message text,
ADD COLUMN IF NOT EXISTS task_reward integer;