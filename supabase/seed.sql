-- Seed skills
insert into skills (id, name, category, market_demand_score) values
  ('11111111-1111-1111-1111-111111111111', 'React', 'technical', 85),
  ('11111111-1111-1111-1111-111111111112', 'TypeScript', 'technical', 80),
  ('11111111-1111-1111-1111-111111111113', 'Node.js', 'technical', 78),
  ('11111111-1111-1111-1111-111111111114', 'Python', 'technical', 82),
  ('11111111-1111-1111-1111-111111111115', 'Machine Learning', 'technical', 88),
  ('11111111-1111-1111-1111-111111111116', 'SQL', 'technical', 75),
  ('11111111-1111-1111-1111-111111111117', 'PostgreSQL', 'technical', 76),
  ('11111111-1111-1111-1111-111111111118', 'Docker', 'technical', 72),
  ('11111111-1111-1111-1111-111111111119', 'Kubernetes', 'technical', 70),
  ('11111111-1111-1111-1111-111111111120', 'AWS', 'technical', 84),
  ('11111111-1111-1111-1111-111111111121', 'Figma', 'domain', 60),
  ('11111111-1111-1111-1111-111111111122', 'UI/UX Design', 'domain', 62),
  ('11111111-1111-1111-1111-111111111123', 'Product Management', 'domain', 67),
  ('11111111-1111-1111-1111-111111111124', 'Agile Methodology', 'domain', 65),
  ('11111111-1111-1111-1111-111111111125', 'Leadership', 'soft', 58),
  ('11111111-1111-1111-1111-111111111126', 'Communication', 'soft', 55),
  ('11111111-1111-1111-1111-111111111127', 'Problem Solving', 'soft', 63),
  ('11111111-1111-1111-1111-111111111128', 'Data Analysis', 'domain', 74),
  ('11111111-1111-1111-1111-111111111129', 'Marketing', 'domain', 52),
  ('11111111-1111-1111-1111-111111111130', 'Sales Strategy', 'domain', 50)
ON CONFLICT DO NOTHING;

-- Seed projects
insert into projects (id, name, description, status, team_size, start_date, end_date)
values
  ('22222222-2222-2222-2222-222222222221', 'Core Platform Revamp', 'Migrating monolithic architecture to microservices', 'active', 5, '2026-01-15', '2026-08-01'),
  ('22222222-2222-2222-2222-222222222222', 'AI Forecasting Engine', 'Implementing predictive models for skills demand', 'planning', 3, '2026-05-01', '2026-12-01'),
  ('22222222-2222-2222-2222-222222222223', 'Mobile App V2', 'Complete redesign of the consumer app', 'active', 4, '2026-03-01', '2026-09-15')
ON CONFLICT DO NOTHING;

-- Seed job requirements
insert into job_requirements (id, title, department, min_experience_years, required_skills)
values
  ('33333333-3333-3333-3333-333333333331', 'Senior Full Stack Engineer', 'Engineering', 5, array['React','Node.js','PostgreSQL','AWS']),
  ('33333333-3333-3333-3333-333333333332', 'Product Design Lead', 'Design', 4, array['Figma','UI/UX Design','Leadership']),
  ('33333333-3333-3333-3333-333333333333', 'Machine Learning Engineer', 'Data/ML', 3, array['Python','Machine Learning','SQL','Docker'])
ON CONFLICT DO NOTHING;
