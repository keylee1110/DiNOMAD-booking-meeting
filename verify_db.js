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

async function run() {
  const email = 'bnhatminh04@gmail.com';

  try {
    await client.connect();
    
    // Query profile
    const profileRes = await client.query("SELECT * FROM public.profiles WHERE email = $1", [email]);
    console.log("=== Profile Row ===");
    console.log(profileRes.rows);

    // Query supplier members
    const memberRes = await client.query(`
      SELECT sm.*, s.legal_name, s.display_name, s.status 
      FROM public.supplier_members sm
      JOIN public.suppliers s ON s.id = sm.supplier_id
      WHERE sm.user_id = (SELECT id FROM auth.users WHERE email = $1)
    `, [email]);
    console.log("=== Supplier Member & Workspace ===");
    console.log(memberRes.rows);
  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    await client.end();
  }
}

run();
