import { execSync } from 'child_process';

console.log('🩺 Fixing deployment blockers...\n');
execSync('node scripts/apply-rls-policies.mjs', { stdio:'inherit' });
execSync('node scripts/env-verify.mjs', { stdio:'inherit' });

// Trigger GitHub Health Cell rerun
execSync('gh workflow run "Supabase Health Cell" -R debearr/synqra-os', { stdio:'inherit' });

console.log('\n✅ All systems fixed and workflow re-triggered');
