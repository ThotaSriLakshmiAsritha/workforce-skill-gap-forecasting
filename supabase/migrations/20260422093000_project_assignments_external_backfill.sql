-- Allow project assignments to include externally screened candidates.
alter table public.project_assignments
  add column if not exists external_resume_upload_id uuid references public.resume_uploads(id) on delete set null;

-- Exactly one assignment source must be provided: internal employee OR external resume candidate.
alter table public.project_assignments
  drop constraint if exists project_assignments_member_source_check;

alter table public.project_assignments
  add constraint project_assignments_member_source_check
  check (num_nonnulls(employee_id, external_resume_upload_id) = 1);

-- Keep internal uniqueness and add external uniqueness per project.
alter table public.project_assignments
  drop constraint if exists project_assignments_project_external_unique;

alter table public.project_assignments
  add constraint project_assignments_project_external_unique
  unique (project_id, external_resume_upload_id);

create index if not exists idx_project_assignments_external_resume_upload_id
  on public.project_assignments(external_resume_upload_id);
