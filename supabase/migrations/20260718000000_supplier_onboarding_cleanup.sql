-- Supplier onboarding cleanup (spec: docs/specs/feat-partner-supplier-onboarding.md)
--
-- 1. handle_new_auth_user: stop auto-creating a placeholder supplier application on
--    signup — applicants now submit real business info via the "Become a Partner" form.
-- 2. submit_supplier_application: stop setting role='supplier' at application time —
--    the role is only upgraded by the approval trigger (handle_supplier_status_change).
-- 3. Capture handle_supplier_status_change + its trigger in version control (it was
--    previously applied to the live DB only — schema drift).

-- 1. Profile creation only; no supplier auto-create ---------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, avatar_url, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', '')
    ),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(new.raw_user_meta_data ->> 'picture', '')
    ),
    'customer'::public.app_role
  )
  on conflict (id) do update set
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    phone = coalesce(public.profiles.phone, excluded.phone),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

  return new;
end;
$$;

-- 2. Application no longer changes the role -----------------------------------------
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

  return created_supplier_id;
end;
$$;

-- 2b. Same fix for the service-role variant used by the backend ---------------------
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

  return created_supplier_id;
end;
$$;

-- 3. Role upgrade/downgrade on approval status change (capturing live-DB state) -----
create or replace function public.handle_supplier_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status = 'approved' and OLD.status != 'approved' then
    update public.profiles
    set role = 'supplier'
    where id in (
      select user_id
      from public.supplier_members
      where supplier_id = NEW.id
        and is_active = true
    );
  elsif NEW.status != 'approved' and OLD.status = 'approved' then
    update public.profiles
    set role = 'customer'
    where id in (
      select user_id
      from public.supplier_members
      where supplier_id = NEW.id
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_supplier_status_changed on public.suppliers;
create trigger on_supplier_status_changed
after update on public.suppliers
for each row execute function public.handle_supplier_status_change();
