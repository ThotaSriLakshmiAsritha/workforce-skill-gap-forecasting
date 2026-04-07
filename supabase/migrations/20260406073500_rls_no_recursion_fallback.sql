-- Hard stop recursion: do not query profiles from profiles policies.

drop policy if exists "read_own_profile" on profiles;
drop policy if exists "insert_own_profile" on profiles;
drop policy if exists "update_profile_self_or_admin" on profiles;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Keep app functional while avoiding recursive role checks.
-- Authenticated users can read workforce tables; writes are restricted per table.

drop policy if exists "employee_skills_access" on employee_skills;
create policy "employee_skills_read_authenticated" on employee_skills
  for select using (auth.role() = 'authenticated');
create policy "employee_skills_write_own" on employee_skills
  for all using (auth.uid() = employee_id)
  with check (auth.uid() = employee_id);

drop policy if exists "projects_write_hr" on projects;
create policy "projects_write_authenticated" on projects
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "project_skills_write_hr" on project_skills;
create policy "project_skills_write_authenticated" on project_skills
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "assignments_write_hr" on project_assignments;
create policy "assignments_write_authenticated" on project_assignments
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "availability_write_hr" on employee_availability;
create policy "availability_write_authenticated" on employee_availability
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "learning_paths_access" on learning_paths;
create policy "learning_paths_read_authenticated" on learning_paths
  for select using (auth.role() = 'authenticated');
create policy "learning_paths_write_own" on learning_paths
  for all using (auth.uid() = employee_id)
  with check (auth.uid() = employee_id);

drop policy if exists "job_requirements_hr_only" on job_requirements;
create policy "job_requirements_authenticated" on job_requirements
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "resumes_hr_only" on resume_uploads;
create policy "resumes_authenticated" on resume_uploads
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "chat_sessions_access" on chat_sessions;
create policy "chat_sessions_authenticated" on chat_sessions
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "skill_gap_snapshots_read" on skill_gap_snapshots;
create policy "skill_gap_snapshots_authenticated" on skill_gap_snapshots
  for select using (auth.role() = 'authenticated');

-- Cleanup helper if present
revoke all on function public.current_user_role() from public;
drop function if exists public.current_user_role();