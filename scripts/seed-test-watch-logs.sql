-- Seed Watch Log rows for test users 9001-9020.
-- Run this after scripts/seed-test-users.sql in Supabase SQL Editor.

delete from public."Watch Log"
where "userId" between 9001 and 9020
  and "watchId" like 'test-watch-%';

with test_users as (
  select
    u."userId",
    u."Watch",
    u.age,
    lower(coalesce(u.gender, 'other')) as gender,
    row_number() over (order by u."userId") as user_index
  from public."User" u
  where u."userId" between 9001 and 9020
),
acts as (
  select *
  from (
    values
      (1, 'start'),
      (2, 'minigame1'),
      (3, 'act1'),
      (4, 'minigame2'),
      (5, 'act2'),
      (6, 'minigame3'),
      (7, 'act3-4'),
      (8, 'minigame4'),
      (9, 'act5-6'),
      (10, 'end')
  ) as a(act_index, act)
),
seed_rows as (
  select
    format('test-watch-%s-%s', u."userId", a.act) as "watchId",
    a.act,
    (
      timestamp with time zone '2026-09-30 09:00:00+07'
      + ((u.user_index - 1) * interval '1 day')
      + ((a.act_index - 1) * interval '8 minutes')
    ) as "timestamp",
    round(
      (
        68
        + (u.age - 15) * 2.1
        + a.act_index * 1.35
        + case
            when u.gender in ('female', 'หญิง', 'ผู้หญิง') then 4.5
            when u.gender in ('male', 'ชาย', 'ผู้ชาย') then 1.5
            else 3.0
          end
        + mod(u.user_index * a.act_index, 5)
      )::numeric,
      1
    )::double precision as "PPG",
    round(
      (
        1.2
        + (u.age - 15) * 0.18
        + a.act_index * 0.42
        + case
            when u.gender in ('female', 'หญิง', 'ผู้หญิง') then 0.35
            when u.gender in ('male', 'ชาย', 'ผู้ชาย') then 0.12
            else 0.24
          end
        + mod(u.user_index + a.act_index, 4) * 0.17
      )::numeric,
      2
    )::double precision as "EDA",
    jsonb_build_object(
      'value',
      round(
        (
          0.45
          + (u.age - 15) * 0.04
          + a.act_index * 0.09
          + case
              when u.gender in ('female', 'หญิง', 'ผู้หญิง') then 0.08
              when u.gender in ('male', 'ชาย', 'ผู้ชาย') then 0.14
              else 0.11
            end
          + mod(u.user_index * 2 + a.act_index, 6) * 0.03
        )::numeric,
        2
      ),
      'sourceWatchId',
      coalesce(u."Watch", format('TEST-WATCH-%s', u."userId"))
    ) as "IMU",
    null::text as "emotionValue",
    u."userId",
    coalesce(u."Watch", format('TEST-WATCH-%s', u."userId")) as "Watch"
  from test_users u
  cross join acts a
)
insert into public."Watch Log" (
  "watchId",
  act,
  "timestamp",
  "PPG",
  "EDA",
  "IMU",
  "emotionValue",
  "userId",
  "Watch"
)
select
  "watchId",
  act,
  "timestamp",
  "PPG",
  "EDA",
  "IMU",
  "emotionValue",
  "userId",
  "Watch"
from seed_rows;

