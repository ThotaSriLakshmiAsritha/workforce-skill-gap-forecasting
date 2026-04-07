-- Enable extensions
create extension if not exists "pgcrypto";

-- ENUMS
create type user_role as enum ('org_admin','hr_manager','team_lead','employee');
create type proficiency_level as enum ('beginner','intermediate','advanced','expert');
create type project_status as enum ('planning','active','completed','on_hold');
create type assignment_status as enum ('active','completed','withdrawn');
create type availability_status as enum ('available','in_project','on_leave','unavailable');
create type learning_status as enum ('recommended','in_progress','completed');
create type resume_status as enum ('pending','screened','shortlisted','rejected','error');
create type skill_category as enum ('technical','soft','domain');
create type priority_level as enum ('high','medium','low');

-- PROFILES (extends auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  email text not null unique,
  role user_role not null default 'employee',
  department text,
  job_title text,
  avatar_url text,
  target_role text,
  years_of_experience int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SKILLS MASTER LIST
create table skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category skill_category not null,
  description text,
  market_demand_score int default 50 check (market_demand_score between 0 and 100),
  created_at timestamptz default now()
);

-- EMPLOYEE SKILLS
create table employee_skills (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references profiles(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  proficiency proficiency_level not null default 'beginner',
  self_rated boolean default true,
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(employee_id, skill_id)
);

-- PROJECTS
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status project_status default 'planning',
  team_size int not null default 1,
  start_date date,
  end_date date,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- PROJECT REQUIRED SKILLS
create table project_skills (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  importance text check (importance in ('required','preferred')) default 'required',
  unique(project_id, skill_id)
);

-- PROJECT TEAM ASSIGNMENTS
create table project_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  employee_id uuid references profiles(id) on delete cascade,
  role_in_project text,
  assigned_by uuid references profiles(id),
  assigned_at timestamptz default now(),
  status assignment_status default 'active',
  unique(project_id, employee_id)
);

-- EMPLOYEE AVAILABILITY
create table employee_availability (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references profiles(id) on delete cascade unique,
  status availability_status default 'available',
  available_from date,
  notes text,
  updated_at timestamptz default now()
);

-- LEARNING PATHS
create table learning_paths (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references profiles(id) on delete cascade,
  skill_id uuid references skills(id),
  project_id uuid references projects(id),
  course_name text not null,
  platform text,
  url text,
  estimated_hours int,
  priority priority_level default 'medium',
  status learning_status default 'recommended',
  deadline date,
  ai_generated boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- JOB REQUIREMENTS (for resume screening)
create table job_requirements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text,
  required_skills text[] not null,
  preferred_skills text[],
  min_experience_years int default 0,
  description text,
  is_active boolean default true,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- RESUME UPLOADS
create table resume_uploads (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  storage_path text not null,
  uploaded_by uuid references profiles(id),
  job_requirement_id uuid references job_requirements(id),
  candidate_name text,
  candidate_email text,
  extracted_skills text[],
  experience_years int,
  education text,
  previous_roles text[],
  match_score int check (match_score between 0 and 100),
  matched_skills text[],
  missing_skills text[],
  ai_summary text,
  status resume_status default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CHAT SESSIONS (project allocator)
create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references profiles(id),
  project_id uuid references projects(id),
  title text,
  messages jsonb default '[]'::jsonb,
  last_allocation_result jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SKILL GAP SNAPSHOTS
create table skill_gap_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null default current_date,
  department text,
  skill_id uuid references skills(id),
  coverage_percentage int,
  gap_severity text check (gap_severity in ('low','moderate','critical')),
  created_at timestamptz default now()
);

-- INDEXES
create index idx_employee_skills_employee on employee_skills(employee_id);
create index idx_employee_skills_skill on employee_skills(skill_id);
create index idx_project_assignments_employee on project_assignments(employee_id);
create index idx_employee_availability_status on employee_availability(status);
create index idx_resume_uploads_status on resume_uploads(status);
create index idx_profiles_role on profiles(role);
create index idx_profiles_department on profiles(department);

-- RLS
alter table profiles enable row level security;
alter table skills enable row level security;
alter table employee_skills enable row level security;
alter table projects enable row level security;
alter table project_skills enable row level security;
alter table project_assignments enable row level security;
alter table employee_availability enable row level security;
alter table learning_paths enable row level security;
alter table resume_uploads enable row level security;
alter table job_requirements enable row level security;
alter table chat_sessions enable row level security;
alter table skill_gap_snapshots enable row level security;

-- Profiles: employees see own, HR/admin/team lead see all
create policy "read_own_profile" on profiles
  for select using (
    auth.uid() = id or
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin','team_lead'))
  );

-- Employee skills: employees see/edit own, HR/admin see all
create policy "employee_skills_access" on employee_skills
  for all using (
    auth.uid() = employee_id or
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin'))
  ) with check (
    auth.uid() = employee_id or
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin'))
  );

-- Skills: all authenticated can read
create policy "skills_read_all" on skills
  for select using (auth.role() = 'authenticated');

-- Projects: all authenticated can read, HR/admin can write
create policy "projects_read_all" on projects
  for select using (auth.role() = 'authenticated');

create policy "projects_write_hr" on projects
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin'))
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin'))
  );

-- Project skills: read all, HR/admin write
create policy "project_skills_read_all" on project_skills
  for select using (auth.role() = 'authenticated');

create policy "project_skills_write_hr" on project_skills
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin'))
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin'))
  );

-- Assignments: read all, HR/admin write
create policy "assignments_read_all" on project_assignments
  for select using (auth.role() = 'authenticated');

create policy "assignments_write_hr" on project_assignments
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin'))
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin'))
  );

-- Availability: read all, HR/admin write
create policy "availability_read_all" on employee_availability
  for select using (auth.role() = 'authenticated');

create policy "availability_write_hr" on employee_availability
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin'))
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin'))
  );

-- Learning paths: employees see own, HR/admin see all
create policy "learning_paths_access" on learning_paths
  for all using (
    auth.uid() = employee_id or
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin'))
  ) with check (
    auth.uid() = employee_id or
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin'))
  );

-- Job requirements: HR/admin only
create policy "job_requirements_hr_only" on job_requirements
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin'))
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin'))
  );

-- Resume uploads: HR/admin only
create policy "resumes_hr_only" on resume_uploads
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin'))
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin'))
  );

-- Chat sessions: HR/admin/team lead read/write
create policy "chat_sessions_access" on chat_sessions
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin','team_lead'))
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin','team_lead'))
  );

-- Skill gap snapshots: HR/admin read
create policy "skill_gap_snapshots_read" on skill_gap_snapshots
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('hr_manager','org_admin'))
  );
