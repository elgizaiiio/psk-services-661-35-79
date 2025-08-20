-- Enable required extension for UUID generation
create extension if not exists pgcrypto;

-- Utility function to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Users table for Viral app
create table if not exists public.viral_users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null unique,
  telegram_username text,
  first_name text,
  last_name text,
  photo_url text,
  token_balance numeric not null default 0,
  mining_power_multiplier numeric not null default 1,
  mining_duration_hours int not null default 4,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_viral_users_updated
before update on public.viral_users
for each row execute function public.update_updated_at_column();

-- Mining sessions
create table if not exists public.viral_mining_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.viral_users(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  tokens_per_hour numeric not null default 1,
  mining_power_multiplier numeric not null default 1,
  is_active boolean not null default true,
  completed_at timestamptz,
  total_tokens_mined numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_user_active on public.viral_mining_sessions(user_id, is_active);

-- Function to calculate reward
create or replace function public.calculate_mining_reward(session_id uuid)
returns numeric as $$
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
$$ language plpgsql volatile;

-- Upgrades audit table
create table if not exists public.viral_upgrades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.viral_users(id) on delete cascade,
  upgrade_type text not null check (upgrade_type in ('mining_power','mining_duration')),
  upgrade_level numeric not null,
  cost_ton numeric not null default 0,
  transaction_hash text,
  created_at timestamptz not null default now()
);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  points int not null,
  task_url text,
  category text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_tasks_updated
before update on public.tasks
for each row execute function public.update_updated_at_column();

-- Completed tasks
create table if not exists public.user_completed_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.viral_users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  completed_at timestamptz not null default now(),
  points_earned int not null default 0
);
create unique index if not exists uq_user_task_once on public.user_completed_tasks(user_id, task_id);

-- Daily codes
create table if not exists public.daily_codes (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  code1 text not null,
  code2 text not null,
  code3 text not null,
  code4 text not null,
  created_at timestamptz not null default now()
);

-- Daily code attempts
create table if not exists public.user_daily_code_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.viral_users(id) on delete cascade,
  date date not null,
  completed_at timestamptz,
  points_earned int not null default 0
);
create unique index if not exists uq_user_daily_attempt on public.user_daily_code_attempts(user_id, date);

-- Referrals
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.viral_users(id) on delete cascade,
  referred_id uuid not null references public.viral_users(id) on delete cascade,
  status text not null default 'active',
  commission_rate numeric not null default 10,
  created_at timestamptz not null default now()
);

-- RLS: enable and temporarily allow broad access (to be tightened when auth is added)
alter table public.viral_users enable row level security;
alter table public.viral_mining_sessions enable row level security;
alter table public.viral_upgrades enable row level security;
alter table public.tasks enable row level security;
alter table public.user_completed_tasks enable row level security;
alter table public.daily_codes enable row level security;
alter table public.user_daily_code_attempts enable row level security;
alter table public.referrals enable row level security;

-- Public read for non-sensitive tables
create policy "Public can read tasks" on public.tasks for select using (true);
create policy "Public can read daily codes" on public.daily_codes for select using (true);

-- Broad access for development (replace with proper auth later)
create policy "Dev all access viral_users" on public.viral_users for all using (true) with check (true);
create policy "Dev all access sessions" on public.viral_mining_sessions for all using (true) with check (true);
create policy "Dev all access upgrades" on public.viral_upgrades for all using (true) with check (true);
create policy "Dev all access completed tasks" on public.user_completed_tasks for all using (true) with check (true);
create policy "Dev all access daily attempts" on public.user_daily_code_attempts for all using (true) with check (true);
create policy "Dev all access referrals" on public.referrals for all using (true) with check (true);
