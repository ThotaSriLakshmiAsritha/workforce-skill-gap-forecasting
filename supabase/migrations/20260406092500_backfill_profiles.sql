-- Backfill missing profiles and availability for pre-trigger users.

insert into public.profiles (id, email, full_name, role)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data->>'full_name', split_part(coalesce(u.email, 'New User'), '@', 1)),
  coalesce((u.raw_user_meta_data->>'role')::user_role, 'employee')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

insert into public.employee_availability (employee_id, status)
select p.id, 'available'
from public.profiles p
left join public.employee_availability ea on ea.employee_id = p.id
where p.role = 'employee' and ea.employee_id is null;