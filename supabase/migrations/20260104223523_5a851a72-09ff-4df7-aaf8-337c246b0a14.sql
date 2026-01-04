-- Add unique constraint to prevent duplicate task completions
ALTER TABLE bolt_completed_tasks 
ADD CONSTRAINT unique_user_task UNIQUE (user_id, task_id);

-- Delete any existing duplicate entries (keep the first one)
DELETE FROM bolt_completed_tasks a
USING bolt_completed_tasks b
WHERE a.id > b.id 
  AND a.user_id = b.user_id 
  AND a.task_id = b.task_id;