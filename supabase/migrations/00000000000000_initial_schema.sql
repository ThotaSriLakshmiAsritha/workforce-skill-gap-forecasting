-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  role text not null check (role in ('employee', 'hr_manager', 'org_admin')),
  department text,
  job_title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Skills master list
create table skills (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  category text not null check (category in ('Technical', 'Soft Skills', 'Domain')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Employee Skills
create table employee_skills (
  employee_id uuid references profiles(id) on delete cascade not null,
  skill_id uuid references skills(id) on delete cascade not null,
  proficiency_level text not null check (proficiency_level in ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  is_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (employee_id, skill_id)
);

-- Projects
create table projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  status text not null check (status in ('Planning', 'Active', 'Completed')),
  team_size integer not null default 1,
  start_date date,
  end_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Project Skills requirements
create table project_skills (
  project_id uuid references projects(id) on delete cascade not null,
  skill_id uuid references skills(id) on delete cascade not null,
  importance text not null check (importance in ('Nice to Have', 'Required', 'Critical')),
  primary key (project_id, skill_id)
);

-- Project Assignments
create table project_assignments (
  project_id uuid references projects(id) on delete cascade not null,
  employee_id uuid references profiles(id) on delete cascade not null,
  status text not null check (status in ('Assigned', 'Active', 'Completed')),
  assigned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (project_id, employee_id)
);

-- Employee Availability
create table employee_availability (
  employee_id uuid references profiles(id) on delete cascade primary key,
  status text not null check (status in ('available', 'in_project', 'on_leave')),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Learning Paths
create table learning_paths (
  id uuid default uuid_generate_v4() primary key,
  employee_id uuid references profiles(id) on delete cascade not null,
  skill_id uuid references skills(id) on delete cascade not null,
  project_id uuid references projects(id) on delete set null,
  course_name text not null,
  platform text not null,
  url text,
  estimated_hours integer,
  priority text check (priority in ('Low', 'Medium', 'High')),
  status text not null check (status in ('Recommended', 'In Progress', 'Completed')),
  deadline date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Resume Uploads
create table resume_uploads (
  id uuid default uuid_generate_v4() primary key,
  file_name text not null,
  storage_path text not null,
  candidate_name text,
  email text,
  extracted_skills jsonb default '[]'::jsonb,
  experience_years integer,
  match_score integer,
  matched_skills jsonb default '[]'::jsonb,
  missing_skills jsonb default '[]'::jsonb,
  ai_summary text,
  status text not null default 'Processing' check (status in ('Processing', 'Completed', 'Failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Job Requirements (for screening & gap setting)
create table job_requirements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  department text not null,
  min_experience_years integer default 0,
  required_skills jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chat Sessions (for AI Allocation)
create table chat_sessions (
  id uuid default uuid_generate_v4() primary key,
  created_by uuid references profiles(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  messages jsonb default '[]'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS setup
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

-- Policies (allow read all for demo, realistic RLS would restrict to authenticated role)
create policy "Public read access to skills" on skills for select using (true);
create policy "Users read own profile or hr reads all" on profiles for select using (
  auth.uid() = id or (select role from profiles where id = auth.uid()) in ('hr_manager', 'org_admin')
);
-- We'll add broader policies for development so the app works seamlessly
create policy "Allow all authenticated users to read" on profiles for select using (true);
create policy "Allow all authenticated users to read employee_skills" on employee_skills for select using (true);
create policy "Allow all authenticated users to read projects" on projects for select using (true);
create policy "Allow all authenticated users to read project_skills" on project_skills for select using (true);
create policy "Allow all authenticated users to read project_assignments" on project_assignments for select using (true);
create policy "Allow all authenticated users to read employee_availability" on employee_availability for select using (true);
create policy "Allow all authenticated users to read learning_paths" on learning_paths for select using (true);
create policy "Allow all authenticated users to read job_requirements" on job_requirements for select using (true);
create policy "Allow all authenticated users to read chat_sessions" on chat_sessions for select using (true);
create policy "Allow all authenticated users to read resume_uploads" on resume_uploads for select using (true);

-- Insert policies for Edge Functions and specific roles
create policy "Allow update from everyone" on profiles for update using (true);
create policy "Allow insert from everyone" on learning_paths for insert with check (true);
create policy "Allow update from everyone" on learning_paths for update using (true);
create policy "Allow insert from everyone" on chat_sessions for insert with check (true);
create policy "Allow update from everyone" on chat_sessions for update using (true);
create policy "Allow insert from everyone" on resume_uploads for insert with check (true);
