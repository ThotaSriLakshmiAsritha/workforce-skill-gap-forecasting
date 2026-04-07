-- Fix RLS recursion on profiles by avoiding self-referential policy subqueries.

create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_role() to service_role;

drop policy if exists "read_own_profile" on profiles;
create policy "read_own_profile" on profiles
  for select using (
    auth.uid() = id
    or public.current_user_role() in ('hr_manager','org_admin','team_lead')
  );

create policy "insert_own_profile" on profiles
  for insert with check (auth.uid() = id);

create policy "update_profile_self_or_admin" on profiles
  for update using (
    auth.uid() = id
    or public.current_user_role() in ('hr_manager','org_admin')
  ) with check (
    auth.uid() = id
    or public.current_user_role() in ('hr_manager','org_admin')
  );

-- Replace role-checking subqueries in table policies with function calls.

drop policy if exists "employee_skills_access" on employee_skills;
create policy "employee_skills_access" on employee_skills
  for all using (
    auth.uid() = employee_id
    or public.current_user_role() in ('hr_manager','org_admin')
  ) with check (
    auth.uid() = employee_id
    or public.current_user_role() in ('hr_manager','org_admin')
  );

drop policy if exists "projects_write_hr" on projects;
create policy "projects_write_hr" on projects
  for all using (public.current_user_role() in ('hr_manager','org_admin'))
  with check (public.current_user_role() in ('hr_manager','org_admin'));

drop policy if exists "project_skills_write_hr" on project_skills;
create policy "project_skills_write_hr" on project_skills
  for all using (public.current_user_role() in ('hr_manager','org_admin'))
  with check (public.current_user_role() in ('hr_manager','org_admin'));

drop policy if exists "assignments_write_hr" on project_assignments;
create policy "assignments_write_hr" on project_assignments
  for all using (public.current_user_role() in ('hr_manager','org_admin'))
  with check (public.current_user_role() in ('hr_manager','org_admin'));

drop policy if exists "availability_write_hr" on employee_availability;
create policy "availability_write_hr" on employee_availability
  for all using (public.current_user_role() in ('hr_manager','org_admin'))
  with check (public.current_user_role() in ('hr_manager','org_admin'));

drop policy if exists "learning_paths_access" on learning_paths;
create policy "learning_paths_access" on learning_paths
  for all using (
    auth.uid() = employee_id
    or public.current_user_role() in ('hr_manager','org_admin')
  ) with check (
    auth.uid() = employee_id
    or public.current_user_role() in ('hr_manager','org_admin')
  );

drop policy if exists "job_requirements_hr_only" on job_requirements;
create policy "job_requirements_hr_only" on job_requirements
  for all using (public.current_user_role() in ('hr_manager','org_admin'))
  with check (public.current_user_role() in ('hr_manager','org_admin'));

drop policy if exists "resumes_hr_only" on resume_uploads;
create policy "resumes_hr_only" on resume_uploads
  for all using (public.current_user_role() in ('hr_manager','org_admin'))
  with check (public.current_user_role() in ('hr_manager','org_admin'));

drop policy if exists "chat_sessions_access" on chat_sessions;
create policy "chat_sessions_access" on chat_sessions
  for all using (public.current_user_role() in ('hr_manager','org_admin','team_lead'))
  with check (public.current_user_role() in ('hr_manager','org_admin','team_lead'));

drop policy if exists "skill_gap_snapshots_read" on skill_gap_snapshots;
create policy "skill_gap_snapshots_read" on skill_gap_snapshots
  for select using (public.current_user_role() in ('hr_manager','org_admin'));