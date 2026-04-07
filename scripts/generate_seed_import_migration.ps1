$ErrorActionPreference = 'Stop'

function Esc([string]$s) {
  if ($null -eq $s) { return '' }
  return $s.Replace("'", "''")
}

$root = 'data/seed_csv'
$employees = Import-Csv "$root/employees.csv"
$skills = Import-Csv "$root/skills.csv"
$empSkills = Import-Csv "$root/employee_skills.csv"
$availability = Import-Csv "$root/employee_availability.csv"
$jobs = Import-Csv "$root/job_requirements.csv"

$ts = Get-Date -Format 'yyyyMMddHHmmss'
$migration = "supabase/migrations/${ts}_import_seed_csv.sql"

$sb = New-Object System.Text.StringBuilder

[void]$sb.AppendLine('-- Generated import migration from data/seed_csv')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('create extension if not exists "pgcrypto";')
[void]$sb.AppendLine('')

# staging employees
[void]$sb.AppendLine('create temporary table staging_employees (')
[void]$sb.AppendLine('  email text,')
[void]$sb.AppendLine('  full_name text,')
[void]$sb.AppendLine('  role user_role,')
[void]$sb.AppendLine('  department text,')
[void]$sb.AppendLine('  job_title text,')
[void]$sb.AppendLine('  years_of_experience int')
[void]$sb.AppendLine(') on commit drop;')
[void]$sb.AppendLine('')

[void]$sb.AppendLine('insert into staging_employees (email, full_name, role, department, job_title, years_of_experience) values')
for ($i=0; $i -lt $employees.Count; $i++) {
  $e = $employees[$i]
  $line = "  ('$(Esc $e.email)','$(Esc $e.full_name)','$(Esc $e.role)','$(Esc $e.department)','$(Esc $e.job_title)',$(Esc $e.years_of_experience))"
  if ($i -lt $employees.Count - 1) { $line += ',' } else { $line += ';' }
  [void]$sb.AppendLine($line)
}
[void]$sb.AppendLine('')

# auth users
[void]$sb.AppendLine('-- Seed auth users for all staging employees (idempotent)')
[void]$sb.AppendLine('insert into auth.users (')
[void]$sb.AppendLine('  id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_sent_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at')
[void]$sb.AppendLine(')')
[void]$sb.AppendLine('select')
[void]$sb.AppendLine('  gen_random_uuid(),')
[void]$sb.AppendLine('  ''authenticated'',')
[void]$sb.AppendLine('  ''authenticated'',')
[void]$sb.AppendLine('  se.email,')
[void]$sb.AppendLine('  crypt(''TempPass#2026'', gen_salt(''bf'')),')
[void]$sb.AppendLine('  now(),')
[void]$sb.AppendLine('  now(),')
[void]$sb.AppendLine('  now(),')
[void]$sb.AppendLine('  jsonb_build_object(''provider'', ''email'', ''providers'', array[''email'']),')
[void]$sb.AppendLine('  jsonb_build_object(''full_name'', se.full_name, ''role'', se.role::text),')
[void]$sb.AppendLine('  now(),')
[void]$sb.AppendLine('  now()')
[void]$sb.AppendLine('from staging_employees se')
[void]$sb.AppendLine('where not exists (select 1 from auth.users au where lower(au.email) = lower(se.email));')
[void]$sb.AppendLine('')

[void]$sb.AppendLine('-- Ensure auth identities exist')
[void]$sb.AppendLine('insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)')
[void]$sb.AppendLine('select')
[void]$sb.AppendLine('  gen_random_uuid(),')
[void]$sb.AppendLine('  au.id,')
[void]$sb.AppendLine('  au.email,')
[void]$sb.AppendLine('  jsonb_build_object(''sub'', au.id::text, ''email'', au.email),')
[void]$sb.AppendLine('  ''email'',')
[void]$sb.AppendLine('  now(),')
[void]$sb.AppendLine('  now()')
[void]$sb.AppendLine('from auth.users au')
[void]$sb.AppendLine('join staging_employees se on lower(se.email) = lower(au.email)')
[void]$sb.AppendLine('where not exists (select 1 from auth.identities ai where ai.user_id = au.id and ai.provider = ''email'');')
[void]$sb.AppendLine('')

[void]$sb.AppendLine('-- Upsert profiles from staging')
[void]$sb.AppendLine('insert into public.profiles (id, email, full_name, role, department, job_title, years_of_experience)')
[void]$sb.AppendLine('select au.id, se.email, se.full_name, se.role, se.department, se.job_title, se.years_of_experience')
[void]$sb.AppendLine('from staging_employees se')
[void]$sb.AppendLine('join auth.users au on lower(au.email) = lower(se.email)')
[void]$sb.AppendLine('on conflict (id) do update set')
[void]$sb.AppendLine('  email = excluded.email,')
[void]$sb.AppendLine('  full_name = excluded.full_name,')
[void]$sb.AppendLine('  role = excluded.role,')
[void]$sb.AppendLine('  department = excluded.department,')
[void]$sb.AppendLine('  job_title = excluded.job_title,')
[void]$sb.AppendLine('  years_of_experience = excluded.years_of_experience,')
[void]$sb.AppendLine('  updated_at = now();')
[void]$sb.AppendLine('')

# skills
[void]$sb.AppendLine('create temporary table staging_skills (name text, category skill_category, market_demand_score int) on commit drop;')
[void]$sb.AppendLine('insert into staging_skills (name, category, market_demand_score) values')
for ($i=0; $i -lt $skills.Count; $i++) {
  $s = $skills[$i]
  $line = "  ('$(Esc $s.name)','$(Esc $s.category)',$(Esc $s.market_demand_score))"
  if ($i -lt $skills.Count - 1) { $line += ',' } else { $line += ';' }
  [void]$sb.AppendLine($line)
}
[void]$sb.AppendLine('')
[void]$sb.AppendLine('insert into public.skills (name, category, market_demand_score)')
[void]$sb.AppendLine('select name, category, market_demand_score from staging_skills')
[void]$sb.AppendLine('on conflict (name) do update set')
[void]$sb.AppendLine('  category = excluded.category,')
[void]$sb.AppendLine('  market_demand_score = excluded.market_demand_score;')
[void]$sb.AppendLine('')

# employee_skills
[void]$sb.AppendLine('create temporary table staging_employee_skills (employee_email text, skill_name text, proficiency proficiency_level, self_rated boolean) on commit drop;')
[void]$sb.AppendLine('insert into staging_employee_skills (employee_email, skill_name, proficiency, self_rated) values')
for ($i=0; $i -lt $empSkills.Count; $i++) {
  $r = $empSkills[$i]
  $line = "  ('$(Esc $r.employee_email)','$(Esc $r.skill_name)','$(Esc $r.proficiency)',$(Esc $r.self_rated))"
  if ($i -lt $empSkills.Count - 1) { $line += ',' } else { $line += ';' }
  [void]$sb.AppendLine($line)
}
[void]$sb.AppendLine('')
[void]$sb.AppendLine('insert into public.employee_skills (employee_id, skill_id, proficiency, self_rated)')
[void]$sb.AppendLine('select p.id, s.id, ses.proficiency, ses.self_rated')
[void]$sb.AppendLine('from staging_employee_skills ses')
[void]$sb.AppendLine('join public.profiles p on lower(p.email) = lower(ses.employee_email)')
[void]$sb.AppendLine('join public.skills s on lower(s.name) = lower(ses.skill_name)')
[void]$sb.AppendLine('on conflict (employee_id, skill_id) do update set')
[void]$sb.AppendLine('  proficiency = excluded.proficiency,')
[void]$sb.AppendLine('  self_rated = excluded.self_rated,')
[void]$sb.AppendLine('  updated_at = now();')
[void]$sb.AppendLine('')

# availability
[void]$sb.AppendLine('create temporary table staging_availability (employee_email text, status availability_status, available_from date, notes text) on commit drop;')
[void]$sb.AppendLine('insert into staging_availability (employee_email, status, available_from, notes) values')
for ($i=0; $i -lt $availability.Count; $i++) {
  $r = $availability[$i]
  $dateVal = if ([string]::IsNullOrWhiteSpace($r.available_from)) { 'null' } else { "'$(Esc $r.available_from)'" }
  $notesVal = if ([string]::IsNullOrWhiteSpace($r.notes)) { 'null' } else { "'$(Esc $r.notes)'" }
  $line = "  ('$(Esc $r.employee_email)','$(Esc $r.status)',$dateVal,$notesVal)"
  if ($i -lt $availability.Count - 1) { $line += ',' } else { $line += ';' }
  [void]$sb.AppendLine($line)
}
[void]$sb.AppendLine('')
[void]$sb.AppendLine('insert into public.employee_availability (employee_id, status, available_from, notes)')
[void]$sb.AppendLine('select p.id, sa.status, sa.available_from, sa.notes')
[void]$sb.AppendLine('from staging_availability sa')
[void]$sb.AppendLine('join public.profiles p on lower(p.email) = lower(sa.employee_email)')
[void]$sb.AppendLine('on conflict (employee_id) do update set')
[void]$sb.AppendLine('  status = excluded.status,')
[void]$sb.AppendLine('  available_from = excluded.available_from,')
[void]$sb.AppendLine('  notes = excluded.notes,')
[void]$sb.AppendLine('  updated_at = now();')
[void]$sb.AppendLine('')

# jobs
[void]$sb.AppendLine('create temporary table staging_jobs (title text, department text, min_experience_years int, required_skills text, preferred_skills text) on commit drop;')
[void]$sb.AppendLine('insert into staging_jobs (title, department, min_experience_years, required_skills, preferred_skills) values')
for ($i=0; $i -lt $jobs.Count; $i++) {
  $j = $jobs[$i]
  $pref = if ([string]::IsNullOrWhiteSpace($j.preferred_skills)) { '' } else { $j.preferred_skills }
  $line = "  ('$(Esc $j.title)','$(Esc $j.department)',$(Esc $j.min_experience_years),'$(Esc $j.required_skills)','$(Esc $pref)')"
  if ($i -lt $jobs.Count - 1) { $line += ',' } else { $line += ';' }
  [void]$sb.AppendLine($line)
}
[void]$sb.AppendLine('')
[void]$sb.AppendLine('insert into public.job_requirements (title, department, min_experience_years, required_skills, preferred_skills, is_active)')
[void]$sb.AppendLine('select')
[void]$sb.AppendLine('  sj.title,')
[void]$sb.AppendLine('  sj.department,')
[void]$sb.AppendLine('  sj.min_experience_years,')
[void]$sb.AppendLine('  regexp_split_to_array(sj.required_skills, ''\s*,\s*''),')
[void]$sb.AppendLine('  case when coalesce(trim(sj.preferred_skills), '''') = '''' then null else regexp_split_to_array(sj.preferred_skills, ''\s*,\s*'') end,')
[void]$sb.AppendLine('  true')
[void]$sb.AppendLine('from staging_jobs sj')
[void]$sb.AppendLine('on conflict do nothing;')
[void]$sb.AppendLine('')

[void]$sb.AppendLine('-- Populate normalized job_requirement_skills table')
[void]$sb.AppendLine('insert into public.job_requirement_skills (job_requirement_id, skill_id, importance)')
[void]$sb.AppendLine('select jr.id, s.id, ''required''')
[void]$sb.AppendLine('from public.job_requirements jr')
[void]$sb.AppendLine('cross join lateral unnest(coalesce(jr.required_skills, ''{}'')) req(skill_name)')
[void]$sb.AppendLine('join public.skills s on lower(s.name) = lower(req.skill_name)')
[void]$sb.AppendLine('on conflict (job_requirement_id, skill_id) do update set importance = ''required'';')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('insert into public.job_requirement_skills (job_requirement_id, skill_id, importance)')
[void]$sb.AppendLine('select jr.id, s.id, ''preferred''')
[void]$sb.AppendLine('from public.job_requirements jr')
[void]$sb.AppendLine('cross join lateral unnest(coalesce(jr.preferred_skills, ''{}'')) pref(skill_name)')
[void]$sb.AppendLine('join public.skills s on lower(s.name) = lower(pref.skill_name)')
[void]$sb.AppendLine('on conflict (job_requirement_id, skill_id) do update set importance = ''preferred'';')

Set-Content -Path $migration -Encoding utf8 -Value $sb.ToString()
Write-Host "Created migration: $migration"
