-- Phase-1 hardening based on schema review

-- 1) Ensure critical uniqueness (idempotent)
alter table employee_skills
  add constraint employee_skills_employee_skill_unique unique (employee_id, skill_id);

alter table project_assignments
  add constraint project_assignments_project_employee_unique unique (project_id, employee_id);

alter table project_skills
  add constraint project_skills_project_skill_unique unique (project_id, skill_id);

-- 2) Additional operational indexes
create index if not exists idx_project_assignments_project_id on project_assignments(project_id);
create index if not exists idx_project_assignments_status on project_assignments(status);
create index if not exists idx_learning_paths_employee_id on learning_paths(employee_id);
create index if not exists idx_learning_paths_status on learning_paths(status);
create index if not exists idx_resume_uploads_job_requirement_id on resume_uploads(job_requirement_id);
create index if not exists idx_skill_gap_snapshots_snapshot_date on skill_gap_snapshots(snapshot_date);
create index if not exists idx_skill_gap_snapshots_department on skill_gap_snapshots(department);

-- 3) updated_at automation
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on profiles;
create trigger set_profiles_updated_at
before update on profiles
for each row execute function public.update_updated_at_column();

drop trigger if exists set_employee_skills_updated_at on employee_skills;
create trigger set_employee_skills_updated_at
before update on employee_skills
for each row execute function public.update_updated_at_column();

drop trigger if exists set_projects_updated_at on projects;
create trigger set_projects_updated_at
before update on projects
for each row execute function public.update_updated_at_column();

drop trigger if exists set_employee_availability_updated_at on employee_availability;
create trigger set_employee_availability_updated_at
before update on employee_availability
for each row execute function public.update_updated_at_column();

drop trigger if exists set_learning_paths_updated_at on learning_paths;
create trigger set_learning_paths_updated_at
before update on learning_paths
for each row execute function public.update_updated_at_column();

drop trigger if exists set_resume_uploads_updated_at on resume_uploads;
create trigger set_resume_uploads_updated_at
before update on resume_uploads
for each row execute function public.update_updated_at_column();

drop trigger if exists set_chat_sessions_updated_at on chat_sessions;
create trigger set_chat_sessions_updated_at
before update on chat_sessions
for each row execute function public.update_updated_at_column();

-- 4) Auth signup -> profiles row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'New User'), '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'employee')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 5) Auto create availability for employees
create or replace function public.create_default_availability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'employee' then
    insert into public.employee_availability (employee_id, status)
    values (new.id, 'available')
    on conflict (employee_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_created on profiles;
create trigger on_profile_created
after insert on profiles
for each row execute function public.create_default_availability();

-- 6) Normalized job requirement skills table
create table if not exists job_requirement_skills (
  id uuid primary key default gen_random_uuid(),
  job_requirement_id uuid not null references job_requirements(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  importance text check (importance in ('required','preferred')) default 'required',
  unique(job_requirement_id, skill_id)
);

create index if not exists idx_job_requirement_skills_req_id on job_requirement_skills(job_requirement_id);
create index if not exists idx_job_requirement_skills_skill_id on job_requirement_skills(skill_id);

-- Backfill from existing arrays when names match.
insert into job_requirement_skills (job_requirement_id, skill_id, importance)
select jr.id, s.id, 'required'
from job_requirements jr
cross join lateral unnest(coalesce(jr.required_skills, '{}')) as rs(skill_name)
join skills s on lower(s.name) = lower(rs.skill_name)
on conflict (job_requirement_id, skill_id) do nothing;

insert into job_requirement_skills (job_requirement_id, skill_id, importance)
select jr.id, s.id, 'preferred'
from job_requirements jr
cross join lateral unnest(coalesce(jr.preferred_skills, '{}')) as ps(skill_name)
join skills s on lower(s.name) = lower(ps.skill_name)
on conflict (job_requirement_id, skill_id) do update set importance = excluded.importance;

-- 7) FK behavior adjustments
alter table learning_paths drop constraint if exists learning_paths_project_id_fkey;
alter table learning_paths
  add constraint learning_paths_project_id_fkey
  foreign key (project_id) references projects(id) on delete set null;

-- 8) Snapshot dedupe safety
alter table skill_gap_snapshots
  add constraint skill_gap_snapshots_unique_daily unique (snapshot_date, department, skill_id);

-- 9) Resume screening resilience
alter table resume_uploads alter column match_score set default 0;
alter table resume_uploads add column if not exists screening_error text;

-- 10) Soft delete marker (no behavior change yet)
alter table profiles add column if not exists deleted_at timestamptz;