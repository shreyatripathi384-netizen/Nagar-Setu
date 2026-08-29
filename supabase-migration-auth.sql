-- Run this in Supabase SQL Editor AFTER the original schema (departments,
-- system_codes, profiles, issues) has already been created.
-- This adds the fields needed for the Department Admin approval workflow
-- and Worker registration described in the auth hierarchy.

alter table profiles add column if not exists status text default 'active'
  check (status in ('pending', 'active', 'rejected'));
alter table profiles add column if not exists designation text;
alter table profiles add column if not exists employee_id text;
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists aadhaar_number text;

-- Allow a logged-in department admin or municipal head to see all
-- pending department profiles that need approval.
create policy if not exists "Municipal can view all profiles" on profiles
  for select using (
    (select role from profiles where id = auth.uid()) = 'municipal'
  );

create policy if not exists "Municipal can update department status" on profiles
  for update using (
    (select role from profiles where id = auth.uid()) = 'municipal'
  );

-- Anyone (even logged out) needs to read department names + codes to
-- populate the dropdown on signup and to validate worker codes.
create policy if not exists "Anyone can view departments" on departments
  for select using (true);

alter table departments enable row level security;
