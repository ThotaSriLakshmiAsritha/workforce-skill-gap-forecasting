-- Employee work experiences (extracted from resume)
create table if not exists employee_experiences (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references profiles(id) on delete cascade,
  company text not null,
  role text not null,
  start_date text,
  end_date text,
  description text,
  created_at timestamptz default now()
);

-- Employee personal/past projects (extracted from resume)
create table if not exists employee_projects (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references profiles(id) on delete cascade,
  name text not null,
  description text,
  technologies text[] default '{}',
  url text,
  created_at timestamptz default now()
);

-- Resume parse history for employees
create table if not exists employee_resume_parses (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references profiles(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  extracted_skills jsonb default '[]'::jsonb,
  extracted_experiences jsonb default '[]'::jsonb,
  extracted_projects jsonb default '[]'::jsonb,
  extracted_job_title text,
  extracted_experience_years int,
  extracted_education text,
  extracted_summary text,
  status text default 'pending' check (status in ('pending','processing','completed','error')),
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table employee_experiences enable row level security;
alter table employee_projects enable row level security;
alter table employee_resume_parses enable row level security;

-- Employees see/edit their own; HR/admin see all
create policy "employee_experiences_access" on employee_experiences
  for all using (
    auth.uid() = employee_id or
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('hr_manager','org_admin'))
  )
  with check (
    auth.uid() = employee_id or
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('hr_manager','org_admin'))
  );

create policy "employee_projects_access" on employee_projects
  for all using (
    auth.uid() = employee_id or
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('hr_manager','org_admin'))
  )
  with check (
    auth.uid() = employee_id or
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('hr_manager','org_admin'))
  );

create policy "employee_resume_parses_access" on employee_resume_parses
  for all using (
    auth.uid() = employee_id or
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('hr_manager','org_admin'))
  )
  with check (
    auth.uid() = employee_id or
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('hr_manager','org_admin'))
  );

-- Indexes
create index if not exists idx_employee_experiences_employee on employee_experiences(employee_id);
create index if not exists idx_employee_projects_employee on employee_projects(employee_id);
create index if not exists idx_employee_resume_parses_employee on employee_resume_parses(employee_id);

-- Allow employees to upload their own resumes to the resumes bucket under employee-resumes/{user_id}/
-- The existing resumes bucket already allows authenticated users to insert/read
-- We just need to add a delete policy so they can replace/remove their own files

drop policy if exists "resumes_bucket_owner_delete" on storage.objects;
create policy "resumes_bucket_owner_delete" on storage.objects
  for delete
  using (
    bucket_id = 'resumes'
    and auth.role() = 'authenticated'
  );
