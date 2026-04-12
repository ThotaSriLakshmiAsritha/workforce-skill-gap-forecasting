-- Re-create the employee resume parse history table for environments that missed the original migration.

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

alter table employee_resume_parses enable row level security;

drop policy if exists "employee_resume_parses_access" on employee_resume_parses;
create policy "employee_resume_parses_access" on employee_resume_parses
  for all using (
    auth.uid() = employee_id or
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('hr_manager','org_admin'))
  )
  with check (
    auth.uid() = employee_id or
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('hr_manager','org_admin'))
  );

create index if not exists idx_employee_resume_parses_employee on employee_resume_parses(employee_id);