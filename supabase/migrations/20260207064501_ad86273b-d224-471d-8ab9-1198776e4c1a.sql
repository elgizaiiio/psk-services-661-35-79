-- Create optimized indexes for high-traffic queries

-- Index for fast user lookup by telegram_id (most common query)
CREATE INDEX IF NOT EXISTS idx_bolt_users_telegram_id 
ON public.bolt_users(telegram_id);

-- Index for completed tasks lookup by user
CREATE INDEX IF NOT EXISTS idx_completed_tasks_user_id 
ON public.bolt_completed_tasks(user_id);

-- Index for active mining sessions (partial index for efficiency)
CREATE INDEX IF NOT EXISTS idx_mining_sessions_active 
ON public.bolt_mining_sessions(user_id) 
WHERE is_active = true;

-- Index for daily login rewards by user and date
CREATE INDEX IF NOT EXISTS idx_daily_login_rewards_user_date 
ON public.daily_login_rewards(user_id, claimed_at DESC);

-- Index for bolt town daily points
CREATE INDEX IF NOT EXISTS idx_bolt_town_daily_points_user_date 
ON public.bolt_town_daily_points(user_id, date);

-- Index for active tasks
CREATE INDEX IF NOT EXISTS idx_bolt_tasks_active 
ON public.bolt_tasks(is_active) 
WHERE is_active = true;

-- Index for notification queue cleanup (for scheduled cleanup job)
CREATE INDEX IF NOT EXISTS idx_notification_queue_created_at 
ON public.notification_queue(created_at);

-- Index for referrals by referrer
CREATE INDEX IF NOT EXISTS idx_bolt_referrals_referrer 
ON public.bolt_referrals(referrer_id);

-- Composite index for ad views (for Bolt Town points)
CREATE INDEX IF NOT EXISTS idx_ad_views_user_created 
ON public.ad_views(user_id, created_at DESC);