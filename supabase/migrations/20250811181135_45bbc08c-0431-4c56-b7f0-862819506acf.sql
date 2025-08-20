
-- 1) Events table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  start_time timestamptz,
  end_time timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger if not exists trg_events_updated
before update on public.events
for each row execute function public.update_updated_at_column();

alter table public.events enable row level security;

-- قراءة عامة للأحداث المفعلة فقط
create policy if not exists "Public can read active events"
on public.events for select
using (is_active = true);

-- وصول كامل للتطوير (سنشدد لاحقاً)
create policy if not exists "Dev all access events"
on public.events for all
using (true)
with check (true);

------------------------------------------------------------

-- 2) Servers table (20 سيرفر بسعر TON)
create table if not exists public.servers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  ton_price numeric not null check (ton_price >= 0),
  is_active boolean not null default true,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create trigger if not exists trg_servers_updated
before update on public.servers
for each row execute function public.update_updated_at_column();

alter table public.servers enable row level security;

-- قراءة عامة للخوادم المفعلة
create policy if not exists "Public can read active servers"
on public.servers for select
using (is_active = true);

-- وصول كامل للتطوير
create policy if not exists "Dev all access servers"
on public.servers for all
using (true)
with check (true);

-- بذور: 20 سيرفر
insert into public.servers (name, description, image_url, ton_price, is_active, order_index)
values
('Server 1', 'خادم أساسي', null, 0.5, true, 1),
('Server 2', 'خادم أساسي', null, 0.75, true, 2),
('Server 3', 'خادم أساسي', null, 1.0, true, 3),
('Server 4', 'خادم أساسي', null, 1.25, true, 4),
('Server 5', 'خادم أساسي', null, 1.5, true, 5),
('Server 6', 'خادم متوسط', null, 1.75, true, 6),
('Server 7', 'خادم متوسط', null, 2.0, true, 7),
('Server 8', 'خادم متوسط', null, 2.25, true, 8),
('Server 9', 'خادم متوسط', null, 2.5, true, 9),
('Server 10', 'خادم متوسط', null, 2.75, true, 10),
('Server 11', 'خادم متقدم', null, 3.0, true, 11),
('Server 12', 'خادم متقدم', null, 3.5, true, 12),
('Server 13', 'خادم متقدم', null, 4.0, true, 13),
('Server 14', 'خادم متقدم', null, 4.5, true, 14),
('Server 15', 'خادم متقدم', null, 5.0, true, 15),
('Server 16', 'خادم احترافي', null, 6.0, true, 16),
('Server 17', 'خادم احترافي', null, 7.0, true, 17),
('Server 18', 'خادم احترافي', null, 8.0, true, 18),
('Server 19', 'خادم احترافي', null, 9.0, true, 19),
('Server 20', 'خادم احترافي', null, 10.0, true, 20)
on conflict (name) do nothing;

------------------------------------------------------------

-- 3) TON payments table (لتسجيل المدفوعات)
create table if not exists public.ton_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.viral_users(id) on delete cascade,
  destination_address text not null,
  amount_ton numeric not null check (amount_ton > 0),
  comment text, -- مرجع فريد نستخدمه للتحقق
  status text not null default 'pending', -- pending | confirmed | failed
  tx_hash text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  metadata jsonb
);

create unique index if not exists uq_ton_payments_tx_hash
on public.ton_payments(tx_hash)
where tx_hash is not null;

create index if not exists idx_ton_payments_user on public.ton_payments(user_id);
create index if not exists idx_ton_payments_status on public.ton_payments(status);

alter table public.ton_payments enable row level security;

-- وصول كامل للتطوير
create policy if not exists "Dev all access ton_payments"
on public.ton_payments for all
using (true)
with check (true);

------------------------------------------------------------

-- 4) Server purchases (ربط المستخدم بالسيرفر والدفع)
create table if not exists public.server_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.viral_users(id) on delete cascade,
  server_id uuid not null references public.servers(id) on delete restrict,
  payment_id uuid references public.ton_payments(id) on delete set null,
  status text not null default 'pending', -- pending | paid | activated | cancelled
  created_at timestamptz not null default now(),
  activated_at timestamptz
);

create index if not exists idx_server_purchases_user on public.server_purchases(user_id);
create index if not exists idx_server_purchases_status on public.server_purchases(status);

alter table public.server_purchases enable row level security;

-- وصول كامل للتطوير
create policy if not exists "Dev all access server_purchases"
on public.server_purchases for all
using (true)
with check (true);

------------------------------------------------------------

-- 5) تحسينات على جداول موجودة

-- تتبع النشاط الأخير للمستخدمين
alter table public.viral_users
  add column if not exists last_active_at timestamptz;

create index if not exists idx_viral_users_last_active_at
on public.viral_users(last_active_at);

-- السماح بالتحكم بالمهام من الأدمن أثناء التطوير
create policy if not exists "Dev all access tasks"
on public.tasks for all
using (true)
with check (true);

-- السماح بتعديل أكواد اليوم أثناء التطوير
create policy if not exists "Dev all access daily codes"
on public.daily_codes for all
using (true)
with check (true);

-- فهرس لعدد محاولات الأكواد آخر 24 ساعة
create index if not exists idx_daily_attempts_completed_at
on public.user_daily_code_attempts(completed_at);
