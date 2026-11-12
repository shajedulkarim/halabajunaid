-- 003_user_management.sql  |  Run THIRD. Safe to re-run. Requires 002.
-- Owner-only RPCs to create staff with a generated password, edit permissions, reset passwords, remove users.

create or replace function public._require_owner() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'owner only' using errcode = '42501'; end if;
end $$;

create or replace function public.admin_create_user(p_email text, p_password text, p_name text, p_permissions jsonb)
returns uuid language plpgsql security definer set search_path = public, auth, extensions as $$
declare uid uuid := gen_random_uuid();
begin
  perform public._require_owner();
  if p_email is null or position('@' in p_email) < 2 then raise exception 'invalid email'; end if;
  if length(coalesce(p_password,'')) < 8 then raise exception 'password must be at least 8 characters'; end if;
  if exists (select 1 from auth.users where lower(email) = lower(p_email)) then raise exception 'email already in use'; end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', lower(p_email),
    crypt(p_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', lower(p_email), 'email_verified', true), 'email', now(), now(), now());

  insert into public.staff(user_id, email, display_name, role, permissions)
  values (uid, lower(p_email), coalesce(p_name,''), 'staff', coalesce(p_permissions, '{"orders":true,"availability":true}'::jsonb));
  return uid;
end $$;

create or replace function public.admin_list_staff() returns setof public.staff
language plpgsql stable security definer set search_path = public as $$
begin perform public._require_owner(); return query select * from public.staff order by role, created_at; end $$;

create or replace function public.admin_update_staff(p_user uuid, p_name text, p_permissions jsonb, p_active boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public._require_owner();
  if exists (select 1 from public.staff where user_id = p_user and role = 'owner') then raise exception 'cannot edit the owner here'; end if;
  update public.staff set display_name = coalesce(p_name, display_name), permissions = coalesce(p_permissions, permissions), active = coalesce(p_active, active) where user_id = p_user;
end $$;

create or replace function public.admin_set_password(p_user uuid, p_password text)
returns void language plpgsql security definer set search_path = public, auth, extensions as $$
begin
  perform public._require_owner();
  if length(coalesce(p_password,'')) < 8 then raise exception 'password must be at least 8 characters'; end if;
  update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now() where id = p_user;
end $$;

create or replace function public.admin_delete_user(p_user uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  perform public._require_owner();
  if exists (select 1 from public.staff where user_id = p_user and role = 'owner') then raise exception 'cannot delete the owner'; end if;
  delete from auth.users where id = p_user;   -- staff row cascades
end $$;

revoke all on function public.admin_create_user(text,text,text,jsonb), public.admin_list_staff(),
  public.admin_update_staff(uuid,text,jsonb,boolean), public.admin_set_password(uuid,text), public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_create_user(text,text,text,jsonb), public.admin_list_staff(),
  public.admin_update_staff(uuid,text,jsonb,boolean), public.admin_set_password(uuid,text), public.admin_delete_user(uuid) to authenticated;
