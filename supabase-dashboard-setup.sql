create table if not exists public."DashboardAccount" (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text not null unique,
  name text not null,
  role text not null check (role in ('super_admin', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public."DashboardAccount" enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public."DashboardAccount" to authenticated;
grant select on public."User" to authenticated;
grant select on public."GameData" to authenticated;
grant select on public."SceneData" to authenticated;
grant select on public."Watch Log" to authenticated;
grant select on public."Customize" to authenticated;

drop policy if exists "dashboard accounts can read own profile" on public."DashboardAccount";
create policy "dashboard accounts can read own profile"
on public."DashboardAccount"
for select
to authenticated
using (id = auth.uid());

create or replace function public.current_dashboard_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public."DashboardAccount"
  where id = auth.uid()
  limit 1;
$$;

grant execute on function public.current_dashboard_role() to authenticated;

drop policy if exists "super admins can read all dashboard accounts" on public."DashboardAccount";
create policy "super admins can read all dashboard accounts"
on public."DashboardAccount"
for select
to authenticated
using (public.current_dashboard_role() = 'super_admin');

create or replace function public.set_dashboard_account_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dashboard_account_updated_at on public."DashboardAccount";
create trigger dashboard_account_updated_at
before update on public."DashboardAccount"
for each row
execute function public.set_dashboard_account_updated_at();

create or replace function public.resolve_dashboard_account_email(account_name text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email
  from public."DashboardAccount"
  where username = account_name
  limit 1;
$$;

grant execute on function public.resolve_dashboard_account_email(text) to anon, authenticated;

-- Run these policy blocks only if Row Level Security is enabled on the data tables.
-- They allow signed-in dashboard accounts to read dashboard source data.
drop policy if exists "dashboard accounts can read users" on public."User";
create policy "dashboard accounts can read users"
on public."User"
for select
to authenticated
using (public.current_dashboard_role() in ('super_admin', 'admin'));

drop policy if exists "dashboard accounts can read game data" on public."GameData";
create policy "dashboard accounts can read game data"
on public."GameData"
for select
to authenticated
using (public.current_dashboard_role() in ('super_admin', 'admin'));

drop policy if exists "dashboard accounts can read scene data" on public."SceneData";
create policy "dashboard accounts can read scene data"
on public."SceneData"
for select
to authenticated
using (public.current_dashboard_role() in ('super_admin', 'admin'));

drop policy if exists "dashboard accounts can read watch log" on public."Watch Log";
create policy "dashboard accounts can read watch log"
on public."Watch Log"
for select
to authenticated
using (public.current_dashboard_role() in ('super_admin', 'admin'));

drop policy if exists "dashboard accounts can read customize" on public."Customize";
create policy "dashboard accounts can read customize"
on public."Customize"
for select
to authenticated
using (public.current_dashboard_role() in ('super_admin', 'admin'));

-- First super admin:
-- 1. Run this SQL file in Supabase SQL Editor.
-- 2. Set SUPABASE_SERVICE_ROLE_KEY and the FIRST_SUPER_ADMIN_* values locally.
-- 3. Run: npm run seed:super-admin
--
-- If you manually create a user in Supabase Auth instead, insert its UUID here:
-- insert into public."DashboardAccount" (id, username, email, name, role)
-- values (
--   'AUTH_USER_UUID_HERE',
--   'superadmin',
--   'superadmin@example.com',
--   'Super Admin',
--   'super_admin'
-- );
