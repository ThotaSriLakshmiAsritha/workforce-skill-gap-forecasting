insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

drop policy if exists "resumes_bucket_authenticated_read" on storage.objects;
create policy "resumes_bucket_authenticated_read" on storage.objects
  for select
  using (
    bucket_id = 'resumes'
    and auth.role() = 'authenticated'
  );

drop policy if exists "resumes_bucket_authenticated_insert" on storage.objects;
create policy "resumes_bucket_authenticated_insert" on storage.objects
  for insert
  with check (
    bucket_id = 'resumes'
    and auth.role() = 'authenticated'
  );

drop policy if exists "resumes_bucket_authenticated_update" on storage.objects;
create policy "resumes_bucket_authenticated_update" on storage.objects
  for update
  using (
    bucket_id = 'resumes'
    and auth.role() = 'authenticated'
  )
  with check (
    bucket_id = 'resumes'
    and auth.role() = 'authenticated'
  );
