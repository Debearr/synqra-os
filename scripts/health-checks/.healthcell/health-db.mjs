import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    await client.connect();
    const result = await client.query('SELECT NOW() as time');
    console.log('✅ Database connected at:', result.rows[0].time);

    const logs = await client.query('SELECT * FROM health_logs ORDER BY timestamp DESC LIMIT 5');
    console.log('✅ Health logs found:', logs.rows.length, 'records');

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

check();
