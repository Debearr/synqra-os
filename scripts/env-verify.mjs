import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { execSync } from 'child_process';
import 'dotenv/config';

async function main() {
  console.log('🔍 Running full environment diagnostics...\n');
  await checkSupabase();
  await checkRailway();
  await checkN8N();
  await checkPorkbun();
}

async function checkSupabase() {
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  try {
    const { error } = await client.from('app_configs').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connection OK');
  } catch (err) { console.error('❌ Supabase failed →', err.message); }
}

async function checkRailway() {
  try { execSync('railway --version', { stdio: 'ignore' }); console.log('✅ Railway CLI installed'); }
  catch { console.error('❌ Railway CLI missing'); }
}

async function checkN8N() {
  try {
    const r = await fetch(`${process.env.N8N_WEBHOOK_URL}/webhook/health-check`);
    console.log(`✅ n8n ${r.ok ? 'healthy' : 'degraded'}`);
  } catch { console.error('❌ n8n unreachable'); }
}

async function checkPorkbun() {
  try {
    const res = await fetch('https://porkbun.com/api/json/v3/ping', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        apikey:process.env.PORKBUN_API_KEY,
        secretapikey:process.env.PORKBUN_SECRET_KEY
      })
    });
    const data = await res.json();
    console.log(`✅ Porkbun status: ${data.status}`);
  } catch { console.error('❌ Porkbun unreachable'); }
}
main();
