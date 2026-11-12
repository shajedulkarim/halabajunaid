-- 001_schema.sql  |  Run FIRST in Supabase SQL Editor. Safe to re-run.
-- Content tables, orders, storage bucket, public-read / insert-only-orders policies.
-- Admin write policies are added in 002 (they depend on the staff table).

create extension if not exists pgcrypto;

create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ar text not null default '',
  sort int not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete cascade,
  name_en text not null,
  name_ar text not null default '',
  desc_en text not null default '',
  desc_ar text not null default '',
  price numeric(10,3) not null default 0 check (price >= 0),
  photo_url text,
  sort int not null default 0,
  hidden boolean not null default false,
  sold_out boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists menu_items_cat_idx on public.menu_items(category_id, sort);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  section text not null default 'gallery' check (section in ('hero','gallery','catalogue')),
  url text not null,
  thumb_url text,
  original_url text,            -- first uploaded version, kept for "restore original"
  storage_path text,
  caption_en text not null default '',
  caption_ar text not null default '',
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  ref text not null,
  created_at timestamptz not null default now(),
  customer_name text,
  customer_phone text,
  notes text,
  items jsonb not null default '[]'::jsonb,
  total numeric(10,3) not null default 0,
  lang text not null default 'en',
  status text not null default 'new' check (status in ('new','preparing','ready','done','cancelled')),
  handled_by uuid,
  updated_at timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders(created_at desc);

-- Public bucket for photos (read by everyone, written by admins via policies in 002)
insert into storage.buckets (id, name, public) values ('photos','photos',true)
on conflict (id) do update set public = true;

alter table public.settings   enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.photos     enable row level security;
alter table public.orders     enable row level security;

-- Public read for content
drop policy if exists "public read settings"   on public.settings;
drop policy if exists "public read categories" on public.categories;
drop policy if exists "public read menu_items" on public.menu_items;
drop policy if exists "public read photos"     on public.photos;
create policy "public read settings"   on public.settings   for select using (true);
create policy "public read categories" on public.categories for select using (true);
create policy "public read menu_items" on public.menu_items for select using (true);
create policy "public read photos"     on public.photos     for select using (true);

-- Public may INSERT orders only, and only as a plain new order (no status tricks).
drop policy if exists "public insert orders" on public.orders;
create policy "public insert orders" on public.orders for insert to anon, authenticated
  with check (
    status = 'new' and handled_by is null
    and jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 50
    and length(ref) <= 16
    and coalesce(length(customer_name),0) <= 120
    and coalesce(length(customer_phone),0) <= 40
    and coalesce(length(notes),0) <= 1000
    and total >= 0
  );

grant usage on schema public to anon, authenticated;
grant select on public.settings, public.categories, public.menu_items, public.photos to anon, authenticated;
grant insert on public.orders to anon, authenticated;

-- Seed defaults only if tables are empty (so re-running never duplicates)
insert into public.settings(key,value)
select k,v from (values
  ('banner','{"enabled":false,"text_en":"","text_ar":""}'::jsonb),
  ('hours','[{"day":0,"open":"10:00","close":"22:00","closed":false},{"day":1,"open":"10:00","close":"22:00","closed":false},{"day":2,"open":"10:00","close":"22:00","closed":false},{"day":3,"open":"10:00","close":"22:00","closed":false},{"day":4,"open":"10:00","close":"22:00","closed":false},{"day":5,"open":"16:00","close":"22:00","closed":false},{"day":6,"open":"10:00","close":"22:00","closed":false}]'::jsonb),
  ('rating','{"value":0,"count":0,"show":false}'::jsonb),
  ('alert_sound','"chime"'::jsonb)
) s(k,v)
on conflict (key) do nothing;

do $$
declare c_abaya uuid; c_sash uuid; c_occ uuid;
begin
  if not exists (select 1 from public.categories) then
    insert into public.categories(name_en,name_ar,sort) values ('Abayas','العبايات',1) returning id into c_abaya;
    insert into public.categories(name_en,name_ar,sort) values ('National Day sashes','أوشحة العيد الوطني',2) returning id into c_sash;
    insert into public.categories(name_en,name_ar,sort) values ('Occasion wear','إطلالات المناسبات',3) returning id into c_occ;
    insert into public.menu_items(category_id,name_en,name_ar,desc_en,desc_ar,price,sort,photo_url) values
      (c_abaya,'Everyday black abaya','عباية سوداء يومية','Plain weave, open front, wide sleeve.','نسيج سادة، فتحة أمامية، كم واسع.',38,1,'https://shajedulkarim.github.io/halabajunaid/assets/img/abaya-black-front.jpg'),
      (c_abaya,'Lace panel abaya','عباية بتفصيل دانتيل','Black lace panel across the back, metal tag.','لوح دانتيل أسود على الظهر مع شارة معدنية.',65,2,'https://shajedulkarim.github.io/halabajunaid/assets/img/abaya-lace-back.jpg'),
      (c_abaya,'Gold lace evening abaya','عباية سهرة بدانتيل ذهبي','Black lace with gold thread, hooded.','دانتيل أسود بخيوط ذهبية مع غطاء رأس.',95,3,'https://shajedulkarim.github.io/halabajunaid/assets/img/abaya-seated.jpg'),
      (c_sash,'Sand sash, embroidered','وشاح رملي مطرز','Satin in desert sand, gold embroidery.','ساتان بلون رمل الصحراء مع تطريز ذهبي.',18,1,'https://shajedulkarim.github.io/halabajunaid/assets/img/sash-sand-detail.jpg'),
      (c_sash,'Red sash, dagger belt motif','وشاح أحمر بنقشة حزام الخنجر','Red satin, gold embroidery, name in Arabic script.','ساتان أحمر مع تطريز ذهبي وخط عربي.',18,2,'https://shajedulkarim.github.io/halabajunaid/assets/img/sash-red-thobe.jpg'),
      (c_occ,'Occasion set, abaya and sash','طقم مناسبات: عباية ووشاح','Lace abaya with a matching sand sash.','عباية دانتيل مع وشاح رملي مطابق.',110,1,'https://shajedulkarim.github.io/halabajunaid/assets/img/sash-sand-hooded.jpg');
  end if;
end $$;

insert into public.photos(section,url,thumb_url,original_url,caption_en,caption_ar,sort)
select * from (values
  ('hero','https://shajedulkarim.github.io/halabajunaid/assets/img/sash-sand-hooded.jpg','https://shajedulkarim.github.io/halabajunaid/assets/img/sm/sash-sand-hooded.jpg','https://shajedulkarim.github.io/halabajunaid/assets/img/sash-sand-hooded.jpg','Sand satin sash over black gold lace','وشاح ساتان رملي فوق دانتيل أسود وذهبي',1),
  ('gallery','https://shajedulkarim.github.io/halabajunaid/assets/img/abaya-black-front.jpg','https://shajedulkarim.github.io/halabajunaid/assets/img/sm/abaya-black-front.jpg','https://shajedulkarim.github.io/halabajunaid/assets/img/abaya-black-front.jpg','Black abaya with lace panel','عباية سوداء بلوح دانتيل',1),
  ('gallery','https://shajedulkarim.github.io/halabajunaid/assets/img/sash-red-thobe.jpg','https://shajedulkarim.github.io/halabajunaid/assets/img/sm/sash-red-thobe.jpg','https://shajedulkarim.github.io/halabajunaid/assets/img/sash-red-thobe.jpg','Red sash, gold embroidery','وشاح أحمر بتطريز ذهبي',2),
  ('gallery','https://shajedulkarim.github.io/halabajunaid/assets/img/abaya-lace-back.jpg','https://shajedulkarim.github.io/halabajunaid/assets/img/sm/abaya-lace-back.jpg','https://shajedulkarim.github.io/halabajunaid/assets/img/abaya-lace-back.jpg','Lace back panel','لوح الدانتيل الخلفي',3),
  ('gallery','https://shajedulkarim.github.io/halabajunaid/assets/img/sash-sand-detail.jpg','https://shajedulkarim.github.io/halabajunaid/assets/img/sm/sash-sand-detail.jpg','https://shajedulkarim.github.io/halabajunaid/assets/img/sash-sand-detail.jpg','Embroidery detail','تفصيل التطريز',4),
  ('gallery','https://shajedulkarim.github.io/halabajunaid/assets/img/abaya-seated.jpg','https://shajedulkarim.github.io/halabajunaid/assets/img/sm/abaya-seated.jpg','https://shajedulkarim.github.io/halabajunaid/assets/img/abaya-seated.jpg','Gold lace evening abaya','عباية سهرة بدانتيل ذهبي',5)
) v(section,url,thumb_url,original_url,caption_en,caption_ar,sort)
where not exists (select 1 from public.photos);
