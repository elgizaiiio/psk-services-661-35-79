-- Prevent blocked users from creating or confirming TON payments

CREATE OR REPLACE FUNCTION public.enforce_blocked_user_ton_payments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blocked boolean;
BEGIN
  SELECT bu.bot_blocked
    INTO v_blocked
  FROM public.bolt_users bu
  WHERE bu.id::text = NEW.user_id;

  v_blocked := COALESCE(v_blocked, false);

  IF v_blocked THEN
    -- Block creation entirely
    IF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'USER_BLOCKED';
    END IF;

    -- If user gets blocked later, prevent any confirmation
    IF TG_OP = 'UPDATE' THEN
      IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('confirmed') THEN
        NEW.status := 'cancelled';
        NEW.confirmed_at := NULL;
        NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb)
          || jsonb_build_object(
            'blocked_reason', 'user_blocked',
            'blocked_at', now(),
            'blocked_original_status', OLD.status,
            'blocked_attempted_status', NEW.status
          );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_blocked_user_ton_payments_insert ON public.ton_payments;
DROP TRIGGER IF EXISTS trg_enforce_blocked_user_ton_payments_update ON public.ton_payments;

CREATE TRIGGER trg_enforce_blocked_user_ton_payments_insert
BEFORE INSERT ON public.ton_payments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_blocked_user_ton_payments();

CREATE TRIGGER trg_enforce_blocked_user_ton_payments_update
BEFORE UPDATE ON public.ton_payments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_blocked_user_ton_payments();
