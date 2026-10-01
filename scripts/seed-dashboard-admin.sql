-- Seed one dashboard admin profile.
--
-- Before running:
-- 1. Create the admin user in Supabase Dashboard > Authentication > Users.
-- 2. Copy that user's UUID.
-- 3. Replace AUTH_USER_UUID_HERE and the profile values below.
--
-- Use role = 'admin' for normal admin, or 'super_admin' for export/account management.

update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  confirmed_at = coalesce(confirmed_at, now()),
  updated_at = now()
where id = 'AUTH_USER_UUID_HERE';

insert into public."DashboardAccount" (
  id,
  username,
  email,
  name,
  role
)
values (
  'AUTH_USER_UUID_HERE',
  'admin',
  'admin@example.com',
  'Dashboard Admin',
  'admin'
)
on conflict (id) do update
set
  username = excluded.username,
  email = excluded.email,
  name = excluded.name,
  role = excluded.role;
