-- Migration: learning_path_plans cache table
-- Mirrors the skill_gap_analyses pattern — one row per employee + role.
-- The AI-generated learning plan is stored as JSONB so the frontend can
-- render it directly without re-calling the edge function on every visit.

CREATE TABLE IF NOT EXISTS learning_path_plans (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id       text        NOT NULL,
  role_title    text        NOT NULL,
  result        jsonb       NOT NULL,   -- AI-generated plan JSON
  model_used    text,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_learning_path_plans_employee_role UNIQUE (employee_id, role_id)
);

-- RLS -----------------------------------------------------------------------
ALTER TABLE learning_path_plans ENABLE ROW LEVEL SECURITY;

-- Employees can only see their own plans
CREATE POLICY "employee_sees_own_learning_plans"
  ON learning_path_plans
  FOR SELECT
  USING (auth.uid() = employee_id);

-- Edge functions (service role) can upsert on behalf of any employee
CREATE POLICY "service_role_upsert_learning_plans"
  ON learning_path_plans
  FOR ALL
  USING (true)
  WITH CHECK (true);
