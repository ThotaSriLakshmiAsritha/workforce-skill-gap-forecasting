-- AI Skill Gap Analyses log table
-- Persists the full JSON result per (employee_id, role_id) so we can
-- serve cached results and display a history log without re-calling the AI.

create table if not exists skill_gap_analyses (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid not null references profiles(id) on delete cascade,
  role_id         text not null,
  role_title      text not null,
  -- Full AI analysis result stored as JSONB
  result          jsonb not null,
  -- Convenience columns extracted from result for quick queries
  readiness_score int check (readiness_score between 0 and 100),
  readiness_label text,
  model_used      text,
  created_at      timestamptz not null default now()
);

-- One cached result per (employee, role) — newer rows replace older ones via upsert
create unique index if not exists skill_gap_analyses_unique_per_role
  on skill_gap_analyses (employee_id, role_id);

-- Fast lookup for history list
create index if not exists idx_skill_gap_analyses_employee
  on skill_gap_analyses (employee_id, created_at desc);

-- RLS
alter table skill_gap_analyses enable row level security;

-- Employees can read and insert their own analyses
create policy "skill_gap_analyses_own_read" on skill_gap_analyses
  for select using (auth.uid() = employee_id);

create policy "skill_gap_analyses_own_insert" on skill_gap_analyses
  for insert with check (auth.uid() = employee_id);

create policy "skill_gap_analyses_own_update" on skill_gap_analyses
  for update using (auth.uid() = employee_id);

-- HR/admin can read all analyses
create policy "skill_gap_analyses_hr_read" on skill_gap_analyses
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('hr_manager', 'org_admin')
    )
  );
