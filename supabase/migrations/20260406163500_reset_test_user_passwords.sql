-- Reset known test credentials directly in auth.users for reliable password login.

update auth.users
set
  encrypted_password = extensions.crypt('TempPass#2026', extensions.gen_salt('bf')),
  email_confirmed_at = now(),
  aud = 'authenticated',
  role = 'authenticated',
  raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('provider','email','providers',array['email']),
  updated_at = now()
where lower(email) in (
  'hr.manager@company.com',
  'employee095@company.com',
  'employee096@company.com',
  'employee097@company.com',
  'employee098@company.com',
  'employee099@company.com'
);

-- Ensure HR profile exists for the dedicated login.
insert into public.profiles (id, full_name, email, role, department, job_title, years_of_experience)
select u.id, 'HR Manager', u.email, 'hr_manager', 'HR', 'HR Manager', 8
from auth.users u
where lower(u.email) = 'hr.manager@company.com'
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  department = excluded.department,
  job_title = excluded.job_title,
  years_of_experience = excluded.years_of_experience,
  updated_at = now();
