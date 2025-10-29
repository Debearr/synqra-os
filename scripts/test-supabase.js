import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load local environment vars for Node script
dotenv.config({ path: '.env.local' });

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment');
  process.exit(1);
}

const supabase = createClient(url, anon);

(async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connected');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err?.message || err);
    process.exit(1);
  }
})();
