-- Allow org-side roles to read workforce profiles without recursive profile lookups.
-- This relies on the authenticated user's JWT/app metadata role rather than querying
-- the profiles table from inside a profiles policy.

drop policy if exists "profiles_select_org_roles" on profiles;

create policy "profiles_select_org_roles" on profiles
  for select
  using (
    coalesce(
      auth.jwt() -> 'user_metadata' ->> 'role',
      auth.jwt() -> 'app_metadata' ->> 'role',
      ''
    ) in ('org_admin', 'hr_manager', 'team_lead')
  );
