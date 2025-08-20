-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_mining_reward(
  session_id UUID
) RETURNS DECIMAL(20, 8) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  session_record RECORD;
  elapsed_hours DECIMAL;
  reward DECIMAL(20, 8);
BEGIN
  SELECT * INTO session_record
  FROM public.viral_mining_sessions
  WHERE id = session_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate elapsed time in hours
  elapsed_hours := EXTRACT(EPOCH FROM (
    LEAST(now(), session_record.end_time) - session_record.start_time
  )) / 3600.0;
  
  -- Calculate reward: base rate * multiplier * elapsed time
  reward := session_record.tokens_per_hour * session_record.mining_power_multiplier * elapsed_hours;
  
  RETURN GREATEST(0, reward);
END;
$$;