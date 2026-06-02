-- Dinomad initial user + supplier schema for Supabase Postgres.
-- Supabase Auth owns identity in auth.users. Application profile data lives in public tables.

create extension if not exists "pgcrypto";

create type public.app_role as enum ('customer', 'supplier', 'admin');
create type public.user_status as enum ('active', 'blocked', 'deleted');
create type public.supplier_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.supplier_member_role as enum ('owner', 'manager', 'staff');
create type public.venue_status as enum ('draft', 'pending_review', 'published', 'suspended');
create type public.room_status as enum ('draft', 'published', 'unavailable', 'archived');
create type public.room_category as enum ('team_hub', 'solo_nook');
create type public.amenity as enum (
  'wifi',
  'tv',
  'whiteboard',
  'ac',
  'hdmi',
  'projector',
  'power_outlets',
  'coffee',
  'water',
  'parking'
);
create type public.vibe_tag as enum (
  'ultra_quiet',
  'discussion_friendly',
  'cold_ac',
  'natural_light',
  'cozy',
  'modern',
  'rooftop',
  'garden_view'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  role public.app_role not null default 'customer',
  status public.user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_check check (position('@' in email) > 1)
);

create unique index profiles_email_unique_idx on public.profiles (lower(email));
create index profiles_role_idx on public.profiles (role);
create index profiles_status_idx on public.profiles (status);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  display_name text not null,
  tax_code text,
  business_email text,
  business_phone text,
  status public.supplier_status not null default 'pending',
  onboarding_note text,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index suppliers_tax_code_unique_idx
  on public.suppliers (tax_code)
  where tax_code is not null;
create index suppliers_status_idx on public.suppliers (status);
create index suppliers_display_name_idx on public.suppliers (display_name);

create table public.supplier_members (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.supplier_member_role not null default 'staff',
  is_active boolean not null default true,
  invited_by uuid references public.profiles (id) on delete set null,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_members_unique_user_per_supplier unique (supplier_id, user_id)
);

create index supplier_members_user_id_idx on public.supplier_members (user_id);
create index supplier_members_supplier_id_idx on public.supplier_members (supplier_id);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  name text not null,
  name_vi text,
  description text,
  description_vi text,
  address text not null,
  address_vi text,
  district text not null,
  city text not null default 'Ho Chi Minh City',
  lat numeric(10, 7),
  lng numeric(10, 7),
  phone text,
  image_url text,
  status public.venue_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index venues_supplier_id_idx on public.venues (supplier_id);
create index venues_status_idx on public.venues (status);
create index venues_location_idx on public.venues (city, district);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  name text not null,
  name_vi text,
  description text not null,
  description_vi text,
  capacity integer not null,
  price_per_hour integer not null,
  category public.room_category,
  status public.room_status not null default 'draft',
  verified boolean not null default false,
  noise_level numeric(3, 1),
  specs jsonb not null default '{}'::jsonb,
  specs_vi jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_capacity_positive_check check (capacity > 0),
  constraint rooms_price_positive_check check (price_per_hour >= 0),
  constraint rooms_noise_level_range_check check (noise_level is null or noise_level between 0 and 10)
);

create index rooms_venue_id_idx on public.rooms (venue_id);
create index rooms_status_idx on public.rooms (status);
create index rooms_capacity_idx on public.rooms (capacity);
create index rooms_price_per_hour_idx on public.rooms (price_per_hour);
create index rooms_specs_gin_idx on public.rooms using gin (specs);

create table public.room_images (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index room_images_room_id_sort_idx on public.room_images (room_id, sort_order);

create table public.room_amenities (
  room_id uuid not null references public.rooms (id) on delete cascade,
  amenity public.amenity not null,
  primary key (room_id, amenity)
);

create index room_amenities_amenity_idx on public.room_amenities (amenity);

create table public.room_vibe_tags (
  room_id uuid not null references public.rooms (id) on delete cascade,
  vibe_tag public.vibe_tag not null,
  primary key (room_id, vibe_tag)
);

create index room_vibe_tags_vibe_tag_idx on public.room_vibe_tags (vibe_tag);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.is_admin() then
    if not (
      old.role = 'customer'
      and new.role = 'supplier'
      and new.status = old.status
      and exists (
        select 1
        from public.supplier_members sm
        where sm.user_id = auth.uid()
          and sm.is_active = true
      )
    ) then
      new.role = old.role;
    end if;

    new.status = old.status;
  end if;

  return new;
end;
$$;

create trigger profiles_prevent_privilege_escalation
before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

create trigger suppliers_set_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

create trigger supplier_members_set_updated_at
before update on public.supplier_members
for each row execute function public.set_updated_at();

create trigger venues_set_updated_at
before update on public.venues
for each row execute function public.set_updated_at();

create trigger rooms_set_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.is_supplier_member(target_supplier_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.supplier_members sm
    where sm.supplier_id = target_supplier_id
      and sm.user_id = auth.uid()
      and sm.is_active = true
  )
$$;

create or replace function public.can_manage_supplier(target_supplier_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.supplier_members sm
      where sm.supplier_id = target_supplier_id
        and sm.user_id = auth.uid()
        and sm.is_active = true
        and sm.role in ('owner', 'manager')
    )
$$;

create or replace function public.can_manage_supplier_members(target_supplier_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.supplier_members sm
      where sm.supplier_id = target_supplier_id
        and sm.user_id = auth.uid()
        and sm.is_active = true
        and sm.role = 'owner'
    )
$$;

create or replace function public.submit_supplier_application(
  legal_name text,
  display_name text,
  tax_code text default null,
  business_email text default null,
  business_phone text default null,
  onboarding_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_supplier_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.suppliers (
    legal_name,
    display_name,
    tax_code,
    business_email,
    business_phone,
    onboarding_note
  )
  values (
    trim(legal_name),
    trim(display_name),
    nullif(trim(tax_code), ''),
    nullif(trim(business_email), ''),
    nullif(trim(business_phone), ''),
    nullif(trim(onboarding_note), '')
  )
  returning id into created_supplier_id;

  insert into public.supplier_members (supplier_id, user_id, role)
  values (created_supplier_id, auth.uid(), 'owner');

  update public.profiles
  set role = 'supplier'
  where id = auth.uid()
    and role = 'customer';

  return created_supplier_id;
end;
$$;

revoke all on function public.submit_supplier_application(text, text, text, text, text, text) from public;
grant execute on function public.submit_supplier_application(text, text, text, text, text, text) to authenticated;

create or replace function public.submit_supplier_application_for_user(
  target_user_id uuid,
  legal_name text,
  display_name text,
  tax_code text default null,
  business_email text default null,
  business_phone text default null,
  onboarding_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_supplier_id uuid;
begin
  if target_user_id is null then
    raise exception 'target_user_id is required';
  end if;

  if not exists (select 1 from public.profiles where id = target_user_id) then
    raise exception 'Profile does not exist for target_user_id';
  end if;

  insert into public.suppliers (
    legal_name,
    display_name,
    tax_code,
    business_email,
    business_phone,
    onboarding_note
  )
  values (
    trim(legal_name),
    trim(display_name),
    nullif(trim(tax_code), ''),
    nullif(trim(business_email), ''),
    nullif(trim(business_phone), ''),
    nullif(trim(onboarding_note), '')
  )
  returning id into created_supplier_id;

  insert into public.supplier_members (supplier_id, user_id, role)
  values (created_supplier_id, target_user_id, 'owner');

  update public.profiles
  set role = 'supplier'
  where id = target_user_id
    and role = 'customer';

  return created_supplier_id;
end;
$$;

revoke all on function public.submit_supplier_application_for_user(uuid, text, text, text, text, text, text) from public;
grant execute on function public.submit_supplier_application_for_user(uuid, text, text, text, text, text, text) to service_role;

alter table public.profiles enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_members enable row level security;
alter table public.venues enable row level security;
alter table public.rooms enable row level security;
alter table public.room_images enable row level security;
alter table public.room_amenities enable row level security;
alter table public.room_vibe_tags enable row level security;

create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "Users can update own basic profile"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (
  id = auth.uid()
  or public.is_admin()
);

create policy "Admins can read suppliers"
on public.suppliers for select
to authenticated
using (public.is_admin());

create policy "Supplier members can read own suppliers"
on public.suppliers for select
to authenticated
using (public.is_supplier_member(id));

create policy "Admins and managers can update suppliers"
on public.suppliers for update
to authenticated
using (public.can_manage_supplier(id))
with check (public.can_manage_supplier(id));

create policy "Admins can read supplier members"
on public.supplier_members for select
to authenticated
using (public.is_admin());

create policy "Supplier members can read own membership"
on public.supplier_members for select
to authenticated
using (user_id = auth.uid() or public.is_supplier_member(supplier_id));

create policy "Admins and owners can manage supplier members"
on public.supplier_members for all
to authenticated
using (public.can_manage_supplier_members(supplier_id))
with check (public.can_manage_supplier_members(supplier_id));

create policy "Published venues are public"
on public.venues for select
to anon, authenticated
using (status = 'published');

create policy "Supplier members can read own venues"
on public.venues for select
to authenticated
using (public.is_supplier_member(supplier_id) or public.is_admin());

create policy "Supplier managers can manage venues"
on public.venues for all
to authenticated
using (public.can_manage_supplier(supplier_id))
with check (public.can_manage_supplier(supplier_id));

create policy "Published rooms are public"
on public.rooms for select
to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.venues v
    where v.id = rooms.venue_id
      and v.status = 'published'
  )
);

create policy "Supplier members can read own rooms"
on public.rooms for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.venues v
    where v.id = rooms.venue_id
      and public.is_supplier_member(v.supplier_id)
  )
);

create policy "Supplier managers can manage rooms"
on public.rooms for all
to authenticated
using (
  exists (
    select 1
    from public.venues v
    where v.id = rooms.venue_id
      and public.can_manage_supplier(v.supplier_id)
  )
)
with check (
  exists (
    select 1
    from public.venues v
    where v.id = rooms.venue_id
      and public.can_manage_supplier(v.supplier_id)
  )
);

create policy "Room images follow room access"
on public.room_images for select
to anon, authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.venues v on v.id = r.venue_id
    where r.id = room_images.room_id
      and r.status = 'published'
      and v.status = 'published'
  )
);

create policy "Supplier managers can manage room images"
on public.room_images for all
to authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.venues v on v.id = r.venue_id
    where r.id = room_images.room_id
      and public.can_manage_supplier(v.supplier_id)
  )
)
with check (
  exists (
    select 1
    from public.rooms r
    join public.venues v on v.id = r.venue_id
    where r.id = room_images.room_id
      and public.can_manage_supplier(v.supplier_id)
  )
);

create policy "Room amenities follow room access"
on public.room_amenities for select
to anon, authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.venues v on v.id = r.venue_id
    where r.id = room_amenities.room_id
      and r.status = 'published'
      and v.status = 'published'
  )
);

create policy "Supplier managers can manage room amenities"
on public.room_amenities for all
to authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.venues v on v.id = r.venue_id
    where r.id = room_amenities.room_id
      and public.can_manage_supplier(v.supplier_id)
  )
)
with check (
  exists (
    select 1
    from public.rooms r
    join public.venues v on v.id = r.venue_id
    where r.id = room_amenities.room_id
      and public.can_manage_supplier(v.supplier_id)
  )
);

create policy "Room vibe tags follow room access"
on public.room_vibe_tags for select
to anon, authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.venues v on v.id = r.venue_id
    where r.id = room_vibe_tags.room_id
      and r.status = 'published'
      and v.status = 'published'
  )
);

create policy "Supplier managers can manage room vibe tags"
on public.room_vibe_tags for all
to authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.venues v on v.id = r.venue_id
    where r.id = room_vibe_tags.room_id
      and public.can_manage_supplier(v.supplier_id)
  )
)
with check (
  exists (
    select 1
    from public.rooms r
    join public.venues v on v.id = r.venue_id
    where r.id = room_vibe_tags.room_id
      and public.can_manage_supplier(v.supplier_id)
  )
);
