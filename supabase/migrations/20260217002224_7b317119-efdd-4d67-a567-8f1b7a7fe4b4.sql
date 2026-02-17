
CREATE TABLE IF NOT EXISTS public.broadcast_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id text NOT NULL,
  telegram_id bigint NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, telegram_id)
);

ALTER TABLE public.broadcast_log ENABLE ROW LEVEL SECURITY;
