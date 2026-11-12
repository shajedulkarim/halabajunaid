-- 002_staff_permissions.sql  |  Run SECOND. Safe to re-run.
-- Staff table, permission helper, and write policies on every table + storage.

create table if not exists public.staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default '',
  role text not null default 'staff' check (role in ('owner','staff')),
  active boolean not null default true,
  -- keys: orders, availability, menu, insights, photos, settings
  permissions jsonb not null default '{"orders":true,"availability":true}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.staff enable row level security;

-- Is the caller an active owner?
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff s where s.user_id = auth.uid() and s.active and s.role = 'owner');
$$;

-- Does the caller hold a permission? Owners hold all.
create or replace function public.has_perm(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.staff s
    where s.user_id = auth.uid() and s.active
      and (s.role = 'owner' or coalesce((s.permissions ->> p)::boolean, false))
  );
$$;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.has_perm(text) to authenticated;

-- A user may read their own staff row; owner reads all. Writes go through RPCs in 003.
drop policy if exists "staff read own or owner" on public.staff;
create policy "staff read own or owner" on public.staff for select to authenticated
  using (user_id = auth.uid() or public.is_owner());
grant select on public.staff to authenticated;

-- First owner: run once after creating your auth user (Authentication > Users > Add user):
--   select public.bootstrap_owner('you@example.com');
create or replace function public.bootstrap_owner(owner_email text) returns text
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  if exists (select 1 from public.staff where role = 'owner') then
    return 'An owner already exists. Nothing changed.';
  end if;
  select id into uid from auth.users where lower(email) = lower(owner_email);
  if uid is null then return 'No auth user with that email. Create it first under Authentication > Users.'; end if;
  insert into public.staff(user_id,email,display_name,role,permissions)
  values (uid, owner_email, 'Owner', 'owner', '{"orders":true,"availability":true,"menu":true,"insights":true,"photos":true,"settings":true}');
  return 'Owner created.';
end $$;
revoke all on function public.bootstrap_owner(text) from public, anon, authenticated;

-- ORDERS: read/update needs "orders"; availability-only staff cannot see orders.
drop policy if exists "orders read"   on public.orders;
drop policy if exists "orders update" on public.orders;
drop policy if exists "orders delete" on public.orders;
create policy "orders read"   on public.orders for select to authenticated using (public.has_perm('orders') or public.has_perm('insights'));
create policy "orders update" on public.orders for update to authenticated using (public.has_perm('orders')) with check (public.has_perm('orders'));
create policy "orders delete" on public.orders for delete to authenticated using (public.is_owner());
grant select, update, delete on public.orders to authenticated;

-- CATEGORIES + MENU ITEMS: full edit needs "menu"
drop policy if exists "categories write" on public.categories;
create policy "categories write" on public.categories for all to authenticated
  using (public.has_perm('menu')) with check (public.has_perm('menu'));
drop policy if exists "menu write" on public.menu_items;
create policy "menu write" on public.menu_items for all to authenticated
  using (public.has_perm('menu')) with check (public.has_perm('menu'));
grant insert, update, delete on public.categories, public.menu_items to authenticated;

-- Availability-only staff: toggle hidden / sold_out, nothing else. Enforced here, not just in the UI.
create or replace function public.set_availability(item uuid, new_sold_out boolean, new_hidden boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (public.has_perm('availability') or public.has_perm('menu')) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update public.menu_items set sold_out = new_sold_out, hidden = new_hidden where id = item;
end $$;
grant execute on function public.set_availability(uuid, boolean, boolean) to authenticated;

-- PHOTOS
drop policy if exists "photos write" on public.photos;
create policy "photos write" on public.photos for all to authenticated
  using (public.has_perm('photos')) with check (public.has_perm('photos'));
grant insert, update, delete on public.photos to authenticated;

-- SETTINGS
drop policy if exists "settings write" on public.settings;
create policy "settings write" on public.settings for all to authenticated
  using (public.has_perm('settings')) with check (public.has_perm('settings'));
grant insert, update, delete on public.settings to authenticated;

-- STORAGE (bucket "photos"): public read, write needs "photos" or "menu"
drop policy if exists "photos bucket read"   on storage.objects;
drop policy if exists "photos bucket insert" on storage.objects;
drop policy if exists "photos bucket update" on storage.objects;
drop policy if exists "photos bucket delete" on storage.objects;
create policy "photos bucket read"   on storage.objects for select using (bucket_id = 'photos');
create policy "photos bucket insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (public.has_perm('photos') or public.has_perm('menu')));
create policy "photos bucket update" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (public.has_perm('photos') or public.has_perm('menu')));
create policy "photos bucket delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (public.has_perm('photos') or public.has_perm('menu')));

-- Realtime for the live orders list
do $$ begin
  begin alter publication supabase_realtime add table public.orders; exception when duplicate_object then null; when undefined_object then null; end;
end $$;

-- Who am I? Used by the admin on login.
create or replace function public.my_profile() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('user_id',s.user_id,'email',s.email,'display_name',s.display_name,'role',s.role,'active',s.active,
    'permissions', case when s.role='owner' then '{"orders":true,"availability":true,"menu":true,"insights":true,"photos":true,"settings":true}'::jsonb else s.permissions end)
    from public.staff s where s.user_id = auth.uid()), 'null'::jsonb);
$$;
grant execute on function public.my_profile() to authenticated;
