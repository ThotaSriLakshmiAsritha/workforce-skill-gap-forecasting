-- Create clean real-auth org accounts for testing.

update auth.users
set instance_id = '00000000-0000-0000-0000-000000000000'
where instance_id is null;

update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  reauthentication_token = coalesce(reauthentication_token, ''),
  email_change_confirm_status = coalesce(email_change_confirm_status, 0)
where
  confirmation_token is null
  or recovery_token is null
  or email_change_token_new is null
  or email_change is null
  or email_change_token_current is null
  or phone_change is null
  or phone_change_token is null
  or reauthentication_token is null
  or email_change_confirm_status is null;

-- Org admin
do $$
declare
  uid uuid := '2c0c3fd5-3d1d-4db8-8b29-9d908694a9d1';
  em text := 'org.admin@company.com';
begin
  insert into auth.users (
    instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,invited_at,confirmation_sent_at,
    raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
    confirmation_token,recovery_token,email_change_token_new,email_change,email_change_token_current,
    phone_change,phone_change_token,reauthentication_token,email_change_confirm_status,is_sso_user,is_anonymous
  ) values (
    '00000000-0000-0000-0000-000000000000',
    uid,
    'authenticated',
    'authenticated',
    em,
    extensions.crypt('TempPass#2026', extensions.gen_salt('bf')),
    now(),now(),now(),
    jsonb_build_object('provider','email','providers',array['email']),
    jsonb_build_object('full_name','Org Admin','role','org_admin'),
    now(),now(),
    '', '', '', '', '',
    '', '', '', 0, false, false
  ) on conflict (id) do update set
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = now(),
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

  insert into auth.identities (id,user_id,provider_id,identity_data,provider,created_at,updated_at)
  values (gen_random_uuid(), uid, em, jsonb_build_object('sub',uid::text,'email',em), 'email', now(), now())
  on conflict do nothing;

  insert into public.profiles (id,full_name,email,role,department,job_title,years_of_experience)
  values (uid,'Org Admin',em,'org_admin','HR','Org Admin',10)
  on conflict (id) do update set
    full_name=excluded.full_name,
    email=excluded.email,
    role=excluded.role,
    department=excluded.department,
    job_title=excluded.job_title,
    years_of_experience=excluded.years_of_experience,
    updated_at=now();
end $$;

-- Team lead
do $$
declare
  uid uuid := 'e5a7b1ce-1f2e-4d0d-a4cf-b7a8b0c0f01b';
  em text := 'team.lead@company.com';
begin
  insert into auth.users (
    instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,invited_at,confirmation_sent_at,
    raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
    confirmation_token,recovery_token,email_change_token_new,email_change,email_change_token_current,
    phone_change,phone_change_token,reauthentication_token,email_change_confirm_status,is_sso_user,is_anonymous
  ) values (
    '00000000-0000-0000-0000-000000000000',
    uid,
    'authenticated',
    'authenticated',
    em,
    extensions.crypt('TempPass#2026', extensions.gen_salt('bf')),
    now(),now(),now(),
    jsonb_build_object('provider','email','providers',array['email']),
    jsonb_build_object('full_name','Team Lead','role','team_lead'),
    now(),now(),
    '', '', '', '', '',
    '', '', '', 0, false, false
  ) on conflict (id) do update set
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = now(),
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

  insert into auth.identities (id,user_id,provider_id,identity_data,provider,created_at,updated_at)
  values (gen_random_uuid(), uid, em, jsonb_build_object('sub',uid::text,'email',em), 'email', now(), now())
  on conflict do nothing;

  insert into public.profiles (id,full_name,email,role,department,job_title,years_of_experience)
  values (uid,'Team Lead',em,'team_lead','Engineering','Team Lead',7)
  on conflict (id) do update set
    full_name=excluded.full_name,
    email=excluded.email,
    role=excluded.role,
    department=excluded.department,
    job_title=excluded.job_title,
    years_of_experience=excluded.years_of_experience,
    updated_at=now();
end $$;
