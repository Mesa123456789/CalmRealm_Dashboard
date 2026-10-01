-- Seed 20 dashboard test participants.
-- Run this in Supabase SQL Editor.

insert into public."User" (
  "userId",
  name,
  lastname,
  school,
  age,
  gender,
  "Watch",
  email,
  created_at,
  "updatedAt"
)
values
  (9001, 'Test Female 01', 'Calm', 'Calm Realm School A', 15, 'female', 'TEST-WATCH-9001', 'test.user9001@example.com', now(), now()),
  (9002, 'Test Male 02', 'Calm', 'Calm Realm School A', 15, 'male', 'TEST-WATCH-9002', 'test.user9002@example.com', now(), now()),
  (9003, 'Test Other 03', 'Calm', 'Calm Realm School B', 16, 'other', 'TEST-WATCH-9003', 'test.user9003@example.com', now(), now()),
  (9004, 'Test Female 04', 'Calm', 'Calm Realm School B', 16, 'female', 'TEST-WATCH-9004', 'test.user9004@example.com', now(), now()),
  (9005, 'Test Male 05', 'Calm', 'Calm Realm School C', 17, 'male', 'TEST-WATCH-9005', 'test.user9005@example.com', now(), now()),
  (9006, 'Test Female 06', 'Calm', 'Calm Realm School C', 17, 'female', 'TEST-WATCH-9006', 'test.user9006@example.com', now(), now()),
  (9007, 'Test Other 07', 'Calm', 'Calm Realm School A', 18, 'other', 'TEST-WATCH-9007', 'test.user9007@example.com', now(), now()),
  (9008, 'Test Male 08', 'Calm', 'Calm Realm School A', 18, 'male', 'TEST-WATCH-9008', 'test.user9008@example.com', now(), now()),
  (9009, 'Test Female 09', 'Calm', 'Calm Realm School B', 19, 'female', 'TEST-WATCH-9009', 'test.user9009@example.com', now(), now()),
  (9010, 'Test Male 10', 'Calm', 'Calm Realm School B', 19, 'male', 'TEST-WATCH-9010', 'test.user9010@example.com', now(), now()),
  (9011, 'Test Other 11', 'Calm', 'Calm Realm School C', 20, 'other', 'TEST-WATCH-9011', 'test.user9011@example.com', now(), now()),
  (9012, 'Test Female 12', 'Calm', 'Calm Realm School C', 20, 'female', 'TEST-WATCH-9012', 'test.user9012@example.com', now(), now()),
  (9013, 'Test Male 13', 'Calm', 'Calm Realm School A', 21, 'male', 'TEST-WATCH-9013', 'test.user9013@example.com', now(), now()),
  (9014, 'Test Female 14', 'Calm', 'Calm Realm School A', 21, 'female', 'TEST-WATCH-9014', 'test.user9014@example.com', now(), now()),
  (9015, 'Test Male 15', 'Calm', 'Calm Realm School B', 15, 'male', 'TEST-WATCH-9015', 'test.user9015@example.com', now(), now()),
  (9016, 'Test Female 16', 'Calm', 'Calm Realm School B', 16, 'female', 'TEST-WATCH-9016', 'test.user9016@example.com', now(), now()),
  (9017, 'Test Other 17', 'Calm', 'Calm Realm School C', 17, 'other', 'TEST-WATCH-9017', 'test.user9017@example.com', now(), now()),
  (9018, 'Test Male 18', 'Calm', 'Calm Realm School C', 18, 'male', 'TEST-WATCH-9018', 'test.user9018@example.com', now(), now()),
  (9019, 'Test Female 19', 'Calm', 'Calm Realm School A', 19, 'female', 'TEST-WATCH-9019', 'test.user9019@example.com', now(), now()),
  (9020, 'Test Other 20', 'Calm', 'Calm Realm School B', 20, 'other', 'TEST-WATCH-9020', 'test.user9020@example.com', now(), now())
on conflict ("userId") do update
set
  name = excluded.name,
  lastname = excluded.lastname,
  school = excluded.school,
  age = excluded.age,
  gender = excluded.gender,
  "Watch" = excluded."Watch",
  email = excluded.email,
  "updatedAt" = now();

