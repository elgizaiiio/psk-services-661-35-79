-- Create triggers to automatically update bolt_town_daily_points when activities occur
-- This ensures points are tracked even if frontend code fails

-- Helper function to get or create today's points record for a user
CREATE OR REPLACE FUNCTION ensure_bolt_town_today_record(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (timezone('utc', now()))::date;
  v_record_id uuid;
BEGIN
  -- Try to get existing record
  SELECT id INTO v_record_id
  FROM bolt_town_daily_points
  WHERE user_id = p_user_id AND date = v_today;
  
  -- If not exists, create it
  IF v_record_id IS NULL THEN
    INSERT INTO bolt_town_daily_points (user_id, date)
    VALUES (p_user_id, v_today)
    ON CONFLICT (user_id, date) DO NOTHING
    RETURNING id INTO v_record_id;
    
    -- If still null (race condition), fetch again
    IF v_record_id IS NULL THEN
      SELECT id INTO v_record_id
      FROM bolt_town_daily_points
      WHERE user_id = p_user_id AND date = v_today;
    END IF;
  END IF;
  
  RETURN v_record_id;
END;
$$;

-- Trigger function: Add task points when bolt_completed_tasks is inserted
CREATE OR REPLACE FUNCTION trg_add_task_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (timezone('utc', now()))::date;
BEGIN
  -- Ensure today's record exists and add +5 task points
  PERFORM ensure_bolt_town_today_record(NEW.user_id);
  
  UPDATE bolt_town_daily_points
  SET task_points = task_points + 5
  WHERE user_id = NEW.user_id AND date = v_today;
  
  RETURN NEW;
END;
$$;

-- Trigger function: Add task points for daily tasks
CREATE OR REPLACE FUNCTION trg_add_daily_task_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (timezone('utc', now()))::date;
BEGIN
  PERFORM ensure_bolt_town_today_record(NEW.user_id);
  
  UPDATE bolt_town_daily_points
  SET task_points = task_points + 5
  WHERE user_id = NEW.user_id AND date = v_today;
  
  RETURN NEW;
END;
$$;

-- Trigger function: Add ad points when ad_views is inserted
CREATE OR REPLACE FUNCTION trg_add_ad_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (timezone('utc', now()))::date;
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    PERFORM ensure_bolt_town_today_record(NEW.user_id);
    
    UPDATE bolt_town_daily_points
    SET ad_points = ad_points + 2
    WHERE user_id = NEW.user_id AND date = v_today;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function: Add referral points when bolt_referrals is inserted
CREATE OR REPLACE FUNCTION trg_add_referral_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (timezone('utc', now()))::date;
BEGIN
  PERFORM ensure_bolt_town_today_record(NEW.referrer_id);
  
  UPDATE bolt_town_daily_points
  SET referral_points = referral_points + 10
  WHERE user_id = NEW.referrer_id AND date = v_today;
  
  RETURN NEW;
END;
$$;

-- Trigger function: Add server purchase points when user_servers is inserted
CREATE OR REPLACE FUNCTION trg_add_server_purchase_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (timezone('utc', now()))::date;
BEGIN
  PERFORM ensure_bolt_town_today_record(NEW.user_id);
  
  UPDATE bolt_town_daily_points
  SET task_points = task_points + 100
  WHERE user_id = NEW.user_id AND date = v_today;
  
  RETURN NEW;
END;
$$;

-- Trigger function: Add activity points when mining starts (once per day)
CREATE OR REPLACE FUNCTION trg_add_mining_activity_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (timezone('utc', now()))::date;
  v_current_activity integer;
BEGIN
  PERFORM ensure_bolt_town_today_record(NEW.user_id);
  
  -- Get current activity points to check if already awarded today
  SELECT activity_points INTO v_current_activity
  FROM bolt_town_daily_points
  WHERE user_id = NEW.user_id AND date = v_today;
  
  -- Only add 1 activity point if not already awarded today
  IF v_current_activity = 0 THEN
    UPDATE bolt_town_daily_points
    SET activity_points = 1
    WHERE user_id = NEW.user_id AND date = v_today;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist (to avoid conflicts)
DROP TRIGGER IF EXISTS trg_bolt_completed_tasks_points ON bolt_completed_tasks;
DROP TRIGGER IF EXISTS trg_bolt_daily_task_completions_points ON bolt_daily_task_completions;
DROP TRIGGER IF EXISTS trg_ad_views_points ON ad_views;
DROP TRIGGER IF EXISTS trg_bolt_referrals_points ON bolt_referrals;
DROP TRIGGER IF EXISTS trg_user_servers_points ON user_servers;
DROP TRIGGER IF EXISTS trg_bolt_mining_sessions_points ON bolt_mining_sessions;

-- Create triggers
CREATE TRIGGER trg_bolt_completed_tasks_points
  AFTER INSERT ON bolt_completed_tasks
  FOR EACH ROW EXECUTE FUNCTION trg_add_task_points();

CREATE TRIGGER trg_bolt_daily_task_completions_points
  AFTER INSERT ON bolt_daily_task_completions
  FOR EACH ROW EXECUTE FUNCTION trg_add_daily_task_points();

CREATE TRIGGER trg_ad_views_points
  AFTER INSERT ON ad_views
  FOR EACH ROW EXECUTE FUNCTION trg_add_ad_points();

CREATE TRIGGER trg_bolt_referrals_points
  AFTER INSERT ON bolt_referrals
  FOR EACH ROW EXECUTE FUNCTION trg_add_referral_points();

CREATE TRIGGER trg_user_servers_points
  AFTER INSERT ON user_servers
  FOR EACH ROW EXECUTE FUNCTION trg_add_server_purchase_points();

CREATE TRIGGER trg_bolt_mining_sessions_points
  AFTER INSERT ON bolt_mining_sessions
  FOR EACH ROW EXECUTE FUNCTION trg_add_mining_activity_points();