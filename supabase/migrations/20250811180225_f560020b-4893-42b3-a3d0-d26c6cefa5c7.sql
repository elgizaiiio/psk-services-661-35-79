-- Harden functions: set security definer and fixed search_path
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.calculate_mining_reward(session_id uuid)
returns numeric
language plpgsql
security definer set search_path = ''
as $$
declare
  s record;
  now_time timestamptz := now();
  hours_elapsed numeric;
  reward numeric;
begin
  select * into s from public.viral_mining_sessions where id = session_id; 
  if not found then
    return 0;
  end if;
  hours_elapsed := greatest(0, extract(epoch from (least(s.end_time, now_time) - s.start_time)) / 3600.0);
  reward := hours_elapsed * s.tokens_per_hour * s.mining_power_multiplier;
  return reward;
end;
$$;