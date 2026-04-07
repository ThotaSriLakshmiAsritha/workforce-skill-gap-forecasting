-- Fix seeded auth users: ensure instance_id is set so GoTrue can authenticate them.

update auth.users
set instance_id = '00000000-0000-0000-0000-000000000000'
where instance_id is null;
