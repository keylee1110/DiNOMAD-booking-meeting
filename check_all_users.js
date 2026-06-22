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
  try {
    await client.connect();
    
    const usersRes = await client.query("SELECT id, email FROM auth.users");
    console.log("=== Auth Users ===");
    console.log(usersRes.rows);

    const profilesRes = await client.query("SELECT id, email, role FROM public.profiles");
    console.log("=== Public Profiles ===");
    console.log(profilesRes.rows);

    const suppliersRes = await client.query("SELECT id, legal_name, status FROM public.suppliers");
    console.log("=== Public Suppliers ===");
    console.log(suppliersRes.rows);
  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    await client.end();
  }
}

run();
