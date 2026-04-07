-- Make auth signup resilient: profile side-effects must never break signup.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role := 'employee';
  v_full_name text;
begin
  v_full_name := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    split_part(coalesce(new.email, 'New User'), '@', 1)
  );

  if lower(coalesce(new.raw_user_meta_data->>'role', '')) in ('org_admin', 'hr_manager', 'team_lead', 'employee') then
    v_role := (lower(new.raw_user_meta_data->>'role'))::user_role;
  end if;

  -- If email is already present on a different profile row, do not block signup.
  if exists (
    select 1
    from public.profiles p
    where p.email = coalesce(new.email, '')
      and p.id <> new.id
  ) then
    return new;
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (new.id, coalesce(new.email, ''), v_full_name, v_role)
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    updated_at = now();

  return new;
exception when others then
  -- Never fail auth signup because profile sync failed.
  raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;
