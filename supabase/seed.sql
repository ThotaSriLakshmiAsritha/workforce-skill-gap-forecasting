-- This seed script operates after authenticating predefined users or setting fake UUIDs
-- For simplicity, we create fake profiles here. In a real environment, they are created in auth.users first.

-- Disable triggers or constraints if they interfere with seed, but standard is fine.

-- Seed Skills
INSERT INTO skills (id, name, category) VALUES
  ('s1000000-0000-0000-0000-000000000001', 'React', 'Technical'),
  ('s1000000-0000-0000-0000-000000000002', 'TypeScript', 'Technical'),
  ('s1000000-0000-0000-0000-000000000003', 'Node.js', 'Technical'),
  ('s1000000-0000-0000-0000-000000000004', 'Python', 'Technical'),
  ('s1000000-0000-0000-0000-000000000005', 'Machine Learning', 'Technical'),
  ('s1000000-0000-0000-0000-000000000006', 'SQL', 'Technical'),
  ('s1000000-0000-0000-0000-000000000007', 'PostgreSQL', 'Technical'),
  ('s1000000-0000-0000-0000-000000000008', 'Docker', 'Technical'),
  ('s1000000-0000-0000-0000-000000000009', 'Kubernetes', 'Technical'),
  ('s1000000-0000-0000-0000-000000000010', 'AWS', 'Technical'),
  ('s1000000-0000-0000-0000-000000000011', 'Figma', 'Domain'),
  ('s1000000-0000-0000-0000-000000000012', 'UI/UX Design', 'Domain'),
  ('s1000000-0000-0000-0000-000000000013', 'Product Management', 'Domain'),
  ('s1000000-0000-0000-0000-000000000014', 'Agile Methodology', 'Domain'),
  ('s1000000-0000-0000-0000-000000000015', 'Leadership', 'Soft Skills'),
  ('s1000000-0000-0000-0000-000000000016', 'Communication', 'Soft Skills'),
  ('s1000000-0000-0000-0000-000000000017', 'Problem Solving', 'Soft Skills'),
  ('s1000000-0000-0000-0000-000000000018', 'Data Analysis', 'Domain'),
  ('s1000000-0000-0000-0000-000000000019', 'Marketing', 'Domain'),
  ('s1000000-0000-0000-0000-000000000020', 'Sales strategy', 'Domain')
ON CONFLICT DO NOTHING;

-- Since the frontend handles Auth directly via Supabase Auth, in Local development
-- it's usually better to create a mock function or just let users register in the UI.
-- For a true seed that links `auth.users` to `public.profiles`, we can skip that here
-- and use a mock API or instruct the user to sign up two test accounts.

-- We'll seed the job requirements and projects so the UI has data
INSERT INTO projects (id, name, description, status, team_size, start_date, end_date) VALUES
  ('p1000000-0000-0000-0000-000000000001', 'Core Platform Revamp', 'Migrating monolithic architecture to microservices', 'Active', 5, '2026-01-15', '2026-08-01'),
  ('p1000000-0000-0000-0000-000000000002', 'AI Forecasting Engine', 'Implementing predictive models for skills demand', 'Planning', 3, '2026-05-01', '2026-12-01'),
  ('p1000000-0000-0000-0000-000000000003', 'Mobile App V2', 'Complete redesign of the consumer app', 'Active', 4, '2026-03-01', '2026-09-15')
ON CONFLICT DO NOTHING;

INSERT INTO job_requirements (id, title, department, min_experience_years, required_skills) VALUES
  ('j1000000-0000-0000-0000-000000000001', 'Senior Full Stack Engineer', 'Engineering', 5, '["React", "Node.js", "PostgreSQL", "AWS"]'),
  ('j1000000-0000-0000-0000-000000000002', 'Product Design Lead', 'Design', 4, '["Figma", "UI/UX Design", "Leadership"]'),
  ('j1000000-0000-0000-0000-000000000003', 'Machine Learning Engineer', 'Data/ML', 3, '["Python", "Machine Learning", "SQL", "Docker"]')
ON CONFLICT DO NOTHING;
