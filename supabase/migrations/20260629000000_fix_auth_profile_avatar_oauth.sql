-- Update handle_new_auth_user trigger function to copy phone, avatar_url, and fallbacks from OAuth metadata
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  created_supplier_id uuid;
  metadata_role text;
begin
  metadata_role := new.raw_user_meta_data ->> 'role';

  -- Insert profile (always default role to 'customer' initially, capturing avatar and phone from raw metadata)
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

  -- If metadata role is supplier, create the pending supplier application
  if metadata_role = 'supplier' then
    insert into public.suppliers (
      legal_name,
      display_name,
      business_email,
      business_phone,
      status,
      onboarding_note
    )
    values (
      coalesce(
        nullif(new.raw_user_meta_data ->> 'full_name', ''),
        nullif(new.raw_user_meta_data ->> 'name', ''),
        'New Partner'
      ),
      coalesce(
        nullif(new.raw_user_meta_data ->> 'full_name', ''),
        nullif(new.raw_user_meta_data ->> 'name', ''),
        'New Partner'
      ) || ' Space',
      coalesce(new.email, ''),
      nullif(new.raw_user_meta_data ->> 'phone', ''),
      'pending',
      'Auto-created via auth user signup trigger'
    )
    returning id into created_supplier_id;

    insert into public.supplier_members (supplier_id, user_id, role)
    values (created_supplier_id, new.id, 'owner');
  end if;

  return new;
end;
$$;

-- Backfill existing profiles with missing avatar_url, phone, and name from auth.users raw metadata
update public.profiles p
set 
  avatar_url = coalesce(
    p.avatar_url,
    nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(u.raw_user_meta_data ->> 'picture', '')
  ),
  phone = coalesce(
    p.phone,
    nullif(u.raw_user_meta_data ->> 'phone', '')
  ),
  full_name = coalesce(
    p.full_name,
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', '')
  )
from auth.users u
where p.id = u.id;
