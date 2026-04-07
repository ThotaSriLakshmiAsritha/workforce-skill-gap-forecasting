-- Ensure one known HR manager credential exists and is usable.

create extension if not exists pgcrypto;

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_sent_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '9d63f0d0-2e85-4f1a-8e8f-1c5f1b6f4d7a',
  'authenticated',
  'authenticated',
  'hr.manager@company.com',
  extensions.crypt('TempPass#2026', extensions.gen_salt('bf')),
  now(),
  now(),
  now(),
  jsonb_build_object('provider','email','providers',array['email']),
  jsonb_build_object('full_name','HR Manager','role','hr_manager'),
  now(),
  now()
)
on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = now(),
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  created_at,
  updated_at
)
values (
  gen_random_uuid(),
  '9d63f0d0-2e85-4f1a-8e8f-1c5f1b6f4d7a',
  'hr.manager@company.com',
  jsonb_build_object('sub','9d63f0d0-2e85-4f1a-8e8f-1c5f1b6f4d7a','email','hr.manager@company.com'),
  'email',
  now(),
  now()
)
on conflict do nothing;

insert into public.profiles (id, full_name, email, role, department, job_title, years_of_experience)
values (
  '9d63f0d0-2e85-4f1a-8e8f-1c5f1b6f4d7a',
  'HR Manager',
  'hr.manager@company.com',
  'hr_manager',
  'HR',
  'HR Manager',
  8
)
on conflict (id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  role = excluded.role,
  department = excluded.department,
  job_title = excluded.job_title,
  years_of_experience = excluded.years_of_experience,
  updated_at = now();
