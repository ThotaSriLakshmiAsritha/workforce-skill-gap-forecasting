-- Enforce confirm-team permissions: only hr_manager/org_admin can write staffing records.

-- Projects writes
DROP POLICY IF EXISTS "projects_write_authenticated" ON projects;
DROP POLICY IF EXISTS "projects_write_hr" ON projects;
CREATE POLICY "projects_write_hr" ON projects
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('hr_manager','org_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('hr_manager','org_admin')
    )
  );

-- Project skills writes
DROP POLICY IF EXISTS "project_skills_write_authenticated" ON project_skills;
DROP POLICY IF EXISTS "project_skills_write_hr" ON project_skills;
CREATE POLICY "project_skills_write_hr" ON project_skills
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('hr_manager','org_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('hr_manager','org_admin')
    )
  );

-- Assignments writes
DROP POLICY IF EXISTS "assignments_write_authenticated" ON project_assignments;
DROP POLICY IF EXISTS "assignments_write_hr" ON project_assignments;
CREATE POLICY "assignments_write_hr" ON project_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('hr_manager','org_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('hr_manager','org_admin')
    )
  );

-- Availability writes
DROP POLICY IF EXISTS "availability_write_authenticated" ON employee_availability;
DROP POLICY IF EXISTS "availability_write_hr" ON employee_availability;
CREATE POLICY "availability_write_hr" ON employee_availability
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('hr_manager','org_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('hr_manager','org_admin')
    )
  );

-- Learning paths writes: HR/admin can create, employees can update own
DROP POLICY IF EXISTS "learning_paths_write_own" ON learning_paths;
DROP POLICY IF EXISTS "learning_paths_write_hr_or_self" ON learning_paths;
CREATE POLICY "learning_paths_write_hr_or_self" ON learning_paths
  FOR ALL
  USING (
    auth.uid() = employee_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('hr_manager','org_admin')
    )
  )
  WITH CHECK (
    auth.uid() = employee_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('hr_manager','org_admin')
    )
  );
