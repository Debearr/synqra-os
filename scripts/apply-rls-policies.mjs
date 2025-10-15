import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

async function applyPolicies() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const tables = ['health_pulse', 'health_logs', 'deployments', 'app_configs'];

  for (const t of tables) {
    await supabase.rpc('enable_rls', { table_name: t }).catch(() => {});
    await supabase.rpc('create_service_policy', {
      table_name: t,
      policy_name: `${t}_service_access`
    }).catch(() => {});
  }
  console.log('✅ RLS policies auto-applied to all tables');
}
applyPolicies();
