begin;

alter table public.profiles
  add column if not exists plan text default 'free' check (plan in ('free','essential','guardian')),
  add column if not exists stripe_customer_id text unique;

alter table public.subscriptions
  add column if not exists stripe_subscription_id text unique;

alter table public.subscriptions enable row level security;

drop policy if exists "Users view own subscription" on public.subscriptions;
create policy "Users view own subscription" on public.subscriptions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Service role manages subscriptions" on public.subscriptions;
create policy "Service role manages subscriptions" on public.subscriptions
  for all to service_role using (true) with check (true);

create index if not exists idx_subscriptions_stripe_id
  on public.subscriptions(stripe_subscription_id);

create table if not exists public.subscription_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  old_plan text,
  new_plan text,
  stripe_event_id text unique,
  details jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_subscription_audit_user_id
  on public.subscription_audit_log(user_id);
create index if not exists idx_subscription_audit_stripe_event
  on public.subscription_audit_log(stripe_event_id);

alter table public.subscription_audit_log enable row level security;

drop policy if exists "Users view own audit log" on public.subscription_audit_log;
create policy "Users view own audit log" on public.subscription_audit_log
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Service role writes audit log" on public.subscription_audit_log;
create policy "Service role writes audit log" on public.subscription_audit_log
  for insert to service_role with check (true);

grant usage on schema public to anon, authenticated;
grant select on public.subscriptions to anon, authenticated;
grant select on public.subscription_audit_log to anon, authenticated;

commit;
