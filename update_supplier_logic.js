const { Client } = require('pg');

// Load environment variables natively via node --env-file=.env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing DATABASE_URL in environment");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const sql = `
-- 1. Update handle_new_auth_user trigger function to always initialize profile role as 'customer'
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

  -- Insert profile (always default role to 'customer' initially)
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'customer'::public.app_role
  )
  on conflict (id) do nothing;

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
      coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'New Partner'),
      coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'New Partner') || ' Space',
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

-- 2. Create supplier status changed function and trigger
create or replace function public.handle_supplier_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status = 'approved' and OLD.status != 'approved' then
    -- Update the profiles of all active supplier members to 'supplier' role
    update public.profiles
    set role = 'supplier'
    where id in (
      select user_id 
      from public.supplier_members 
      where supplier_id = NEW.id 
        and is_active = true
    );
  elsif NEW.status != 'approved' and OLD.status = 'approved' then
    -- Revert back to 'customer' if rejected, suspended, etc.
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
for each row
execute function public.handle_supplier_status_change();
`;

async function run() {
  const email = 'bnhatminh04@gmail.com';

  try {
    console.log("Connecting to PostgreSQL database...");
    await client.connect();
    
    console.log("Executing SQL migration to establish new business rules...");
    await client.query(sql);
    console.log("Migration executed successfully!");

    // Fix the existing test user to match the new logic (status: pending -> profile role: customer)
    console.log(`Resetting user ${email} role to 'customer' (with pending supplier status) for testing...`);
    
    // Get user id
    const userRes = await client.query("SELECT id FROM auth.users WHERE email = $1", [email]);
    if (userRes.rows.length > 0) {
      const userId = userRes.rows[0].id;
      
      // Update profile role back to customer
      await client.query("UPDATE public.profiles SET role = 'customer' WHERE id = $1", [userId]);
      
      // Make sure the supplier application is pending
      await client.query(`
        UPDATE public.suppliers 
        SET status = 'pending' 
        WHERE id IN (SELECT supplier_id FROM public.supplier_members WHERE user_id = $1)
      `, [userId]);
      
      console.log(`Success! User ${email} role reset to 'customer'. Supplier status is 'pending'.`);
    } else {
      console.log(`User ${email} does not exist yet.`);
    }

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

run();
