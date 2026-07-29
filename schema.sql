-- =====================================================================
-- ANGIE'S CROWN — SUPABASE PRODUCTION SCHEMA
-- Run this entire file in the Supabase SQL Editor (Project > SQL Editor).
-- Safe to re-run: uses IF NOT EXISTS / guarded blocks where possible.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";     -- case-insensitive emails/codes


-- ---------------------------------------------------------------------
-- 1. ENUM TYPES
-- ---------------------------------------------------------------------
do $$ begin
  create type appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type discount_type as enum ('percentage', 'fixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum ('booking', 'reminder', 'promotion', 'system', 'review');
exception when duplicate_object then null; end $$;


-- ---------------------------------------------------------------------
-- 2. SHARED TRIGGER FUNCTION — updated_at
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 3. ROLES & PERMISSIONS (RBAC)
-- ---------------------------------------------------------------------
create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,               -- 'customer' | 'stylist' | 'admin'
  description text,
  created_at timestamptz not null default now()
);

create table if not exists permissions (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,               -- 'manage_services', 'manage_bookings', ...
  description text,
  created_at timestamptz not null default now()
);

create table if not exists role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);


-- ---------------------------------------------------------------------
-- 4. PROFILES (extends auth.users)
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email citext,
  phone text,
  avatar_url text,
  role_id uuid references roles(id) default null,
  loyalty_points integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile row whenever a new auth user signs up
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  customer_role_id uuid;
begin
  select id into customer_role_id from roles where name = 'customer' limit 1;

  insert into public.profiles (id, full_name, email, role_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    customer_role_id
  );
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ---------------------------------------------------------------------
-- 5. CATEGORIES & SERVICES
-- ---------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_categories_updated_at on categories;
create trigger trg_categories_updated_at
  before update on categories
  for each row execute function set_updated_at();

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  slug text unique not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_services_category on services(category_id);
create index if not exists idx_services_active on services(is_active);

drop trigger if exists trg_services_updated_at on services;
create trigger trg_services_updated_at
  before update on services
  for each row execute function set_updated_at();


-- ---------------------------------------------------------------------
-- 6. STYLISTS
-- ---------------------------------------------------------------------
create table if not exists stylists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  full_name text not null,
  bio text,
  avatar_url text,
  specialties text[] not null default '{}',
  years_experience integer,
  rating_avg numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_stylists_active on stylists(is_active);

drop trigger if exists trg_stylists_updated_at on stylists;
create trigger trg_stylists_updated_at
  before update on stylists
  for each row execute function set_updated_at();

create table if not exists stylist_services (
  stylist_id uuid not null references stylists(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  price_override numeric(10,2),
  duration_override_minutes integer,
  primary key (stylist_id, service_id)
);


-- ---------------------------------------------------------------------
-- 7. WORKING HOURS / AVAILABILITY / BLOCKED DATES
-- ---------------------------------------------------------------------
create table if not exists working_hours (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references stylists(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),

  start_time time,
  end_time time,

  is_day_off boolean not null default false,

  check (
    (is_day_off = true and start_time is null and end_time is null)
    or
    (is_day_off = false
      and start_time is not null
      and end_time is not null
      and start_time < end_time)
  ),

  unique (stylist_id, day_of_week)
);

-- One-off extra availability, added on top of the recurring working_hours
create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references stylists(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  check (start_time < end_time),
  created_at timestamptz not null default now()
);

create index if not exists idx_availability_stylist_date on availability(stylist_id, date);

-- One-off removals: a full salon closure (stylist_id null) or a single stylist's day off
create table if not exists blocked_dates (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid references stylists(id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_blocked_dates_stylist_date on blocked_dates(stylist_id, date);


-- ---------------------------------------------------------------------
-- 8. APPOINTMENTS
-- ---------------------------------------------------------------------
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  stylist_id uuid not null references stylists(id) on delete restrict,
  service_id uuid not null references services(id) on delete restrict,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status appointment_status not null default 'pending',
  notes text,
  total_price numeric(10,2) not null check (total_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_time < end_time)
);

-- Prevent double-booking the same stylist for the same slot
create unique index if not exists uq_stylist_slot
  on appointments(stylist_id, appointment_date, start_time)
  where status not in ('cancelled', 'no_show');

create index if not exists idx_appointments_customer on appointments(customer_id);
create index if not exists idx_appointments_stylist_date on appointments(stylist_id, appointment_date);
create index if not exists idx_appointments_status on appointments(status);

drop trigger if exists trg_appointments_updated_at on appointments;
create trigger trg_appointments_updated_at
  before update on appointments
  for each row execute function set_updated_at();


-- ---------------------------------------------------------------------
-- 9. REVIEWS
-- ---------------------------------------------------------------------
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid unique references appointments(id) on delete set null,
  customer_id uuid not null references profiles(id) on delete cascade,
  stylist_id uuid not null references stylists(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_stylist on reviews(stylist_id);

-- Keep stylists.rating_avg / rating_count in sync automatically
create or replace function refresh_stylist_rating()
returns trigger
language plpgsql
as $$
declare
  target_stylist uuid := coalesce(new.stylist_id, old.stylist_id);
begin
  update stylists s
  set rating_count = agg.cnt,
      rating_avg = agg.avg_rating
  from (
    select count(*) as cnt, coalesce(avg(rating), 0) as avg_rating
    from reviews where stylist_id = target_stylist
  ) agg
  where s.id = target_stylist;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_reviews_refresh_rating on reviews;
create trigger trg_reviews_refresh_rating
  after insert or update or delete on reviews
  for each row execute function refresh_stylist_rating();


-- ---------------------------------------------------------------------
-- 10. GALLERY
-- ---------------------------------------------------------------------
create table if not exists gallery (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  image_url text not null,
  category text,
  stylist_id uuid references stylists(id) on delete set null,
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_gallery_featured on gallery(is_featured);


-- ---------------------------------------------------------------------
-- 11. GIFT CARDS
-- ---------------------------------------------------------------------
create table if not exists gift_cards (
  id uuid primary key default gen_random_uuid(),
  code citext unique not null,
  initial_balance numeric(10,2) not null check (initial_balance > 0),
  current_balance numeric(10,2) not null check (current_balance >= 0),
  purchased_by uuid references profiles(id) on delete set null,
  recipient_name text,
  recipient_email citext,
  message text,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_gift_cards_code on gift_cards(code);


-- ---------------------------------------------------------------------
-- 12. PROMOTIONS
-- ---------------------------------------------------------------------
create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  code citext unique,
  discount_type discount_type not null,
  discount_value numeric(10,2) not null check (discount_value > 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  usage_limit integer,
  usage_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create index if not exists idx_promotions_active on promotions(is_active);


-- ---------------------------------------------------------------------
-- 13. NOTIFICATIONS
-- ---------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text,
  type notification_type not null default 'system',
  is_read boolean not null default false,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications(user_id, is_read);


-- ---------------------------------------------------------------------
-- 14. PAYMENTS (structure only — Stripe integration comes later)
-- ---------------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete set null,
  gift_card_id uuid references gift_cards(id) on delete set null,
  customer_id uuid not null references profiles(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'usd',
  status payment_status not null default 'pending',
  payment_method text,                    -- 'card' | 'gift_card' | 'cash' ...
  stripe_payment_intent_id text,           -- reserved for future Stripe integration
  stripe_customer_id text,                 -- reserved for future Stripe integration
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_customer on payments(customer_id);
create index if not exists idx_payments_appointment on payments(appointment_id);

drop trigger if exists trg_payments_updated_at on payments;
create trigger trg_payments_updated_at
  before update on payments
  for each row execute function set_updated_at();


-- =====================================================================
-- 15. ROW LEVEL SECURITY
-- =====================================================================

alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table profiles enable row level security;
alter table categories enable row level security;
alter table services enable row level security;
alter table stylists enable row level security;
alter table stylist_services enable row level security;
alter table working_hours enable row level security;
alter table availability enable row level security;
alter table blocked_dates enable row level security;
alter table appointments enable row level security;
alter table reviews enable row level security;
alter table gallery enable row level security;
alter table gift_cards enable row level security;
alter table promotions enable row level security;
alter table notifications enable row level security;
alter table payments enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from profiles p
    join roles r on r.id = p.role_id
    where p.id = auth.uid() and r.name = 'admin'
  );
$$;

-- Helper: does the current user own this stylist row?
create or replace function is_own_stylist(target_stylist_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from stylists s
    where s.id = target_stylist_id and s.profile_id = auth.uid()
  );
$$;

-- roles / permissions: readable by anyone authenticated, writable by admins only
drop policy if exists "roles_select" on roles;
create policy "roles_select" on roles for select using (true);
drop policy if exists "roles_admin_write" on roles;
create policy "roles_admin_write" on roles for all using (is_admin()) with check (is_admin());

drop policy if exists "permissions_select" on permissions;
create policy "permissions_select" on permissions for select using (true);
drop policy if exists "permissions_admin_write" on permissions;
create policy "permissions_admin_write" on permissions for all using (is_admin()) with check (is_admin());

drop policy if exists "role_permissions_select" on role_permissions;
create policy "role_permissions_select" on role_permissions for select using (true);
drop policy if exists "role_permissions_admin_write" on role_permissions;
create policy "role_permissions_admin_write" on role_permissions for all using (is_admin()) with check (is_admin());

-- profiles: users see & edit their own row; admins see & edit all
drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin" on profiles
  for select using (auth.uid() = id or is_admin());
drop policy if exists "profiles_update_own_or_admin" on profiles;
create policy "profiles_update_own_or_admin" on profiles
  for update using (auth.uid() = id or is_admin()) with check (auth.uid() = id or is_admin());
drop policy if exists "profiles_admin_insert_delete" on profiles;
create policy "profiles_admin_insert_delete" on profiles
  for delete using (is_admin());

-- categories / services: public read (active only), admin manage
drop policy if exists "categories_public_read" on categories;
create policy "categories_public_read" on categories for select using (is_active or is_admin());
drop policy if exists "categories_admin_write" on categories;
create policy "categories_admin_write" on categories for all using (is_admin()) with check (is_admin());

drop policy if exists "services_public_read" on services;
create policy "services_public_read" on services for select using (is_active or is_admin());
drop policy if exists "services_admin_write" on services;
create policy "services_admin_write" on services for all using (is_admin()) with check (is_admin());

-- stylists: public read (active only), admin manage, stylist can update own profile fields
drop policy if exists "stylists_public_read" on stylists;
create policy "stylists_public_read" on stylists for select using (is_active or is_admin());
drop policy if exists "stylists_admin_write" on stylists;
create policy "stylists_admin_write" on stylists for all using (is_admin()) with check (is_admin());
drop policy if exists "stylists_self_update" on stylists;
create policy "stylists_self_update" on stylists
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists "stylist_services_public_read" on stylist_services;
create policy "stylist_services_public_read" on stylist_services for select using (true);
drop policy if exists "stylist_services_admin_write" on stylist_services;
create policy "stylist_services_admin_write" on stylist_services for all using (is_admin()) with check (is_admin());

-- working hours / availability / blocked dates: public read, admin + owning stylist write
drop policy if exists "working_hours_public_read" on working_hours;
create policy "working_hours_public_read" on working_hours for select using (true);
drop policy if exists "working_hours_write" on working_hours;
create policy "working_hours_write" on working_hours
  for all using (is_admin() or is_own_stylist(stylist_id))
  with check (is_admin() or is_own_stylist(stylist_id));

drop policy if exists "availability_public_read" on availability;
create policy "availability_public_read" on availability for select using (true);
drop policy if exists "availability_write" on availability;
create policy "availability_write" on availability
  for all using (is_admin() or is_own_stylist(stylist_id))
  with check (is_admin() or is_own_stylist(stylist_id));

drop policy if exists "blocked_dates_public_read" on blocked_dates;
create policy "blocked_dates_public_read" on blocked_dates for select using (true);
drop policy if exists "blocked_dates_write" on blocked_dates;
create policy "blocked_dates_write" on blocked_dates
  for all using (is_admin() or is_own_stylist(stylist_id))
  with check (is_admin() or is_own_stylist(stylist_id));

-- appointments: customers see/manage their own; stylists see/manage their own; admin sees all
drop policy if exists "appointments_select" on appointments;
create policy "appointments_select" on appointments
  for select using (customer_id = auth.uid() or is_own_stylist(stylist_id) or is_admin());
drop policy if exists "appointments_insert" on appointments;
create policy "appointments_insert" on appointments
  for insert with check (customer_id = auth.uid() or is_admin());
drop policy if exists "appointments_update" on appointments;
create policy "appointments_update" on appointments
  for update using (customer_id = auth.uid() or is_own_stylist(stylist_id) or is_admin())
  with check (customer_id = auth.uid() or is_own_stylist(stylist_id) or is_admin());

-- reviews: public read, customer can insert for their own completed appointment
drop policy if exists "reviews_public_read" on reviews;
create policy "reviews_public_read" on reviews for select using (true);
drop policy if exists "reviews_customer_insert" on reviews;
create policy "reviews_customer_insert" on reviews
  for insert with check (
    customer_id = auth.uid()
    and exists (
      select 1 from appointments a
      where a.id = appointment_id
        and a.customer_id = auth.uid()
        and a.status = 'completed'
    )
  );
drop policy if exists "reviews_admin_manage" on reviews;
create policy "reviews_admin_manage" on reviews for all using (is_admin()) with check (is_admin());

-- gallery: public read, admin write
drop policy if exists "gallery_public_read" on gallery;
create policy "gallery_public_read" on gallery for select using (true);
drop policy if exists "gallery_admin_write" on gallery;
create policy "gallery_admin_write" on gallery for all using (is_admin()) with check (is_admin());

-- gift cards: purchaser or admin can view, admin can manage, anyone can insert (a purchase)
drop policy if exists "gift_cards_select" on gift_cards;
create policy "gift_cards_select" on gift_cards
  for select using (purchased_by = auth.uid() or is_admin());
drop policy if exists "gift_cards_insert" on gift_cards;
create policy "gift_cards_insert" on gift_cards
  for insert with check (purchased_by = auth.uid() or is_admin());
drop policy if exists "gift_cards_admin_write" on gift_cards;
create policy "gift_cards_admin_write" on gift_cards
  for update using (is_admin()) with check (is_admin());

-- promotions: public read active ones, admin manage
drop policy if exists "promotions_public_read" on promotions;
create policy "promotions_public_read" on promotions for select using (is_active or is_admin());
drop policy if exists "promotions_admin_write" on promotions;
create policy "promotions_admin_write" on promotions for all using (is_admin()) with check (is_admin());

-- notifications: user sees only their own
drop policy if exists "notifications_select_own" on notifications;
create policy "notifications_select_own" on notifications
  for select using (user_id = auth.uid() or is_admin());
drop policy if exists "notifications_update_own" on notifications;
create policy "notifications_update_own" on notifications
  for update using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());
drop policy if exists "notifications_admin_insert" on notifications;
create policy "notifications_admin_insert" on notifications
  for insert with check (is_admin() or user_id = auth.uid());

-- payments: customer sees own, admin sees all
drop policy if exists "payments_select" on payments;
create policy "payments_select" on payments
  for select using (customer_id = auth.uid() or is_admin());
drop policy if exists "payments_insert" on payments;
create policy "payments_insert" on payments
  for insert with check (customer_id = auth.uid() or is_admin());
drop policy if exists "payments_admin_update" on payments;
create policy "payments_admin_update" on payments
  for update using (is_admin()) with check (is_admin());


-- =====================================================================
-- 16. STORAGE BUCKETS
-- =====================================================================
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('gallery', 'gallery', true),
  ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

-- Public read for all three buckets
drop policy if exists "public_read_avatars" on storage.objects;
create policy "public_read_avatars" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "public_read_gallery" on storage.objects;
create policy "public_read_gallery" on storage.objects
  for select using (bucket_id = 'gallery');

drop policy if exists "public_read_portfolio" on storage.objects;
create policy "public_read_portfolio" on storage.objects
  for select using (bucket_id = 'portfolio');

-- Authenticated users can upload their own avatar (path must start with their uid)
drop policy if exists "user_upload_own_avatar" on storage.objects;
create policy "user_upload_own_avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "user_update_own_avatar" on storage.objects;
create policy "user_update_own_avatar" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Only admins can manage gallery / portfolio uploads
drop policy if exists "admin_write_gallery" on storage.objects;
create policy "admin_write_gallery" on storage.objects
  for insert with check (bucket_id = 'gallery' and is_admin());

drop policy if exists "admin_update_gallery" on storage.objects;
create policy "admin_update_gallery" on storage.objects
  for update using (bucket_id = 'gallery' and is_admin());

drop policy if exists "admin_write_portfolio" on storage.objects;
create policy "admin_write_portfolio" on storage.objects
  for insert with check (bucket_id = 'portfolio' and is_admin());

drop policy if exists "admin_update_portfolio" on storage.objects;
create policy "admin_update_portfolio" on storage.objects
  for update using (bucket_id = 'portfolio' and is_admin());


-- =====================================================================
-- 17. SEED DATA
-- =====================================================================

-- Roles
insert into roles (name, description) values
  ('customer', 'Regular booking customer'),
  ('stylist', 'Salon stylist / staff member'),
  ('admin', 'Full administrative access')
on conflict (name) do nothing;

-- Permissions
insert into permissions (name, description) values
  ('manage_services', 'Create, edit, delete services and categories'),
  ('manage_stylists', 'Create, edit, delete stylist profiles'),
  ('manage_bookings', 'View and modify all appointments'),
  ('manage_users', 'View and modify all user profiles'),
  ('view_revenue', 'Access revenue and payment reports')
on conflict (name) do nothing;

-- Attach all permissions to admin role
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r, permissions p
where r.name = 'admin'
on conflict do nothing;

-- Categories
insert into categories (name, slug, description, sort_order) values
  ('Hair', 'hair', 'Cuts, color, and styling', 1),
  ('Nails', 'nails', 'Manicures and pedicures', 2),
  ('Skin', 'skin', 'Facials and skincare treatments', 3),
  ('Makeup', 'makeup', 'Editorial and event makeup', 4)
on conflict (slug) do nothing;

-- Services
insert into services (category_id, name, slug, description, price, duration_minutes)
select c.id, v.name, v.slug, v.description, v.price, v.duration
from (values
  ('hair', 'Signature Cut & Style', 'signature-cut-style', 'Precision cut with a tailored blowout finish.', 85.00, 60),
  ('hair', 'Full Balayage', 'full-balayage', 'Hand-painted color for a soft, sun-kissed look.', 220.00, 150),
  ('hair', 'Root Touch-Up', 'root-touch-up', 'Single-process color refresh at the root.', 95.00, 75),
  ('nails', 'Classic Manicure', 'classic-manicure', 'Shape, cuticle care, and polish.', 45.00, 40),
  ('nails', 'Gel Pedicure', 'gel-pedicure', 'Long-wear gel polish with a relaxing soak.', 65.00, 50),
  ('skin', 'Signature Facial', 'signature-facial', 'Customized facial for your skin type.', 120.00, 60),
  ('makeup', 'Event Makeup', 'event-makeup', 'Full glam application for special occasions.', 110.00, 60)
) as v(cat_slug, name, slug, description, price, duration)
join categories c on c.slug = v.cat_slug
on conflict (slug) do nothing;

-- Stylists (not linked to auth users yet — profile_id can be attached later)
insert into stylists (full_name, bio, specialties, years_experience, is_active) values
  ('Angela Moreau', 'Founder and master colorist specializing in balayage.', array['Color', 'Balayage', 'Cutting'], 14, true),
  ('Jordan Blake', 'Precision cutting specialist with an editorial background.', array['Cutting', 'Styling'], 9, true),
  ('Priya Nair', 'Skincare expert focused on results-driven facials.', array['Facials', 'Skincare'], 7, true)
on conflict do nothing;

-- Working hours: Tue–Sat, 9am–6pm for every seeded stylist
insert into working_hours (stylist_id, day_of_week, start_time, end_time, is_day_off)
select s.id, d.day_of_week,
  case when d.day_of_week in (0,1) then null else '09:00'::time end,
  case when d.day_of_week in (0,1) then null else '18:00'::time end,
  d.day_of_week in (0,1) -- closed Sunday (0) and Monday (1)
from stylists s
cross join (select generate_series(0,6) as day_of_week) d
on conflict (stylist_id, day_of_week) do nothing;

-- Promotions
insert into promotions (title, description, code, discount_type, discount_value, starts_at, ends_at, is_active) values
  ('Welcome Offer', '15% off your first booking', 'WELCOME15', 'percentage', 15.00, now(), now() + interval '90 days', true)
on conflict (code) do nothing;

-- Gallery
insert into gallery (title, description, image_url, category, is_featured) values
  ('Editorial Balayage', 'Soft dimensional color on natural waves.', 'https://placehold.co/800x1000?text=Angies+Crown', 'hair', true),
  ('Bridal Updo', 'Romantic braided updo for a summer wedding.', 'https://placehold.co/800x1000?text=Angies+Crown', 'hair', true),
  ('Glow Facial Result', 'Post-treatment glow from our signature facial.', 'https://placehold.co/800x1000?text=Angies+Crown', 'skin', false)
on conflict do nothing;

-- =====================================================================
-- END OF SCHEMA
-- =====================================================================
