const { Client } = require('pg');

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

async function run() {
  const email = 'bnhatminh04@gmail.com';
  const testUserId = 'ae682a0e-8dc8-4644-9e0a-61202b15db5a';

  try {
    console.log("Connecting directly to PostgreSQL database...");
    await client.connect();

    console.log(`\n--- 1. CLEANING UP PRIOR TEST DATA FOR ${email} ---`);
    await client.query("DELETE FROM public.supplier_members WHERE user_id = $1", [testUserId]);
    await client.query("DELETE FROM public.profiles WHERE id = $1", [testUserId]);
    await client.query("DELETE FROM auth.users WHERE id = $1", [testUserId]);
    console.log("Cleanup done.");

    console.log(`\n--- 2. SIMULATING SIGNUP FOR PARTNER (${email}) ---`);
    console.log("Inserting user into auth.users (triggers handle_new_auth_user)...");
    
    // We insert directly into auth.users to trigger handle_new_auth_user
    await client.query(`
      INSERT INTO auth.users (id, email, raw_user_meta_data, role, aud, created_at, updated_at)
      VALUES ($1, $2, $3::jsonb, 'authenticated', 'authenticated', now(), now())
    `, [
      testUserId,
      email,
      JSON.stringify({
        role: 'supplier',
        full_name: 'Bùi Nhật Minh',
        phone: '0901234567'
      })
    ]);

    console.log("Checking resulting profile...");
    const profileRes = await client.query("SELECT * FROM public.profiles WHERE id = $1", [testUserId]);
    if (profileRes.rows.length === 0) {
      throw new Error("FAIL: Profile was not created by trigger!");
    }
    const profile = profileRes.rows[0];
    console.log(`Profile created: email=${profile.email}, role=${profile.role}`);
    
    if (profile.role !== 'customer') {
      throw new Error(`FAIL: Initial profile role is '${profile.role}' instead of 'customer'!`);
    }
    console.log("✅ PASS: Initial profile role is correctly 'customer'.");

    console.log("Checking resulting supplier record...");
    const supplierRes = await client.query(`
      SELECT s.* FROM public.suppliers s
      JOIN public.supplier_members sm ON sm.supplier_id = s.id
      WHERE sm.user_id = $1
    `, [testUserId]);
    
    if (supplierRes.rows.length === 0) {
      throw new Error("FAIL: Supplier workspace / member mapping was not created by trigger!");
    }
    const supplier = supplierRes.rows[0];
    console.log(`Supplier workspace created: displayName="${supplier.display_name}", status="${supplier.status}"`);

    if (supplier.status !== 'pending') {
      throw new Error(`FAIL: Initial supplier status is '${supplier.status}' instead of 'pending'!`);
    }
    console.log("✅ PASS: Initial supplier status is correctly 'pending'.");

    console.log(`\n--- 3. SIMULATING ADMIN APPROVAL (Status -> approved) ---`);
    console.log(`Updating supplier ${supplier.id} status to 'approved'...`);
    await client.query("UPDATE public.suppliers SET status = 'approved' WHERE id = $1", [supplier.id]);

    console.log("Re-checking user profile role after approval trigger...");
    const approvedProfileRes = await client.query("SELECT role FROM public.profiles WHERE id = $1", [testUserId]);
    const approvedRole = approvedProfileRes.rows[0].role;
    console.log(`Updated profile role: ${approvedRole}`);

    if (approvedRole !== 'supplier') {
      throw new Error(`FAIL: Profile role was not updated to 'supplier' after admin approval!`);
    }
    console.log("✅ PASS: Profile role upgraded to 'supplier' on approval.");

    console.log(`\n--- 4. SIMULATING ADMIN SUSPENSION/REJECTION (Status -> rejected) ---`);
    console.log(`Updating supplier ${supplier.id} status to 'rejected'...`);
    await client.query("UPDATE public.suppliers SET status = 'rejected' WHERE id = $1", [supplier.id]);

    console.log("Re-checking user profile role after rejection trigger...");
    const rejectedProfileRes = await client.query("SELECT role FROM public.profiles WHERE id = $1", [testUserId]);
    const rejectedRole = rejectedProfileRes.rows[0].role;
    console.log(`Updated profile role: ${rejectedRole}`);

    if (rejectedRole !== 'customer') {
      throw new Error(`FAIL: Profile role was not demoted to 'customer' after rejection!`);
    }
    console.log("✅ PASS: Profile role reverted back to 'customer' on rejection.");

    console.log(`\n--- 5. RESTORING APPROVED STATUS FOR USER LOGIN TESTING ---`);
    console.log(`Setting supplier status back to 'approved' for credentials login verification...`);
    await client.query("UPDATE public.suppliers SET status = 'approved' WHERE id = $1", [supplier.id]);
    
    // Quick double check that role is supplier again
    const finalProfileRes = await client.query("SELECT role FROM public.profiles WHERE id = $1", [testUserId]);
    console.log(`Final profile role is: ${finalProfileRes.rows[0].role}`);

    console.log("\n==========================================");
    console.log("🎉 ALL TESTS PASSED! THE DATABASE FLOW WORKS EXACTLY AS REQUESTED.");
    console.log("==========================================");

  } catch (err) {
    console.error("\n❌ TEST FLOW FAILED:", err.message);
  } finally {
    await client.end();
  }
}

run();
