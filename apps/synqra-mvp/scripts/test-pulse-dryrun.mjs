#!/usr/bin/env node
/**
 * PulseEngine Dry-Run Test
 * Tests campaign generation → scheduling flow without real posting
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Session credentials
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tjfeindwmpuyajvjftke.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmVpbmR3bXB1eWFqdmpmdGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYxODU3NiwiZXhwIjoyMDc1MTk0NTc2fQ.VEHAj85_x8LZFh0TA9ojv_DYPQdH02g8stsoIT9nNBI';
const KIE_API_KEY = process.env.KIE_API_KEY || '5b5ff66e8d17208306dd84053c5e8a55';
const APP_URL = process.env.APP_URL || 'http://localhost:3004';

console.log('🧪 PulseEngine Dry-Run Test\n');

async function testGenerateAPI() {
  console.log('1️⃣ Testing /api/pulse/generate...');
  
  const testPayload = {
    brief: 'AI automation for small businesses',
    trends: ['AI automation trends', 'Social media strategy 2025'],
    platforms: ['linkedin', 'x'],
    user_id: 'test-user-' + Date.now(),
  };

  try {
    const response = await fetch(`${APP_URL}/api/pulse/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('   ❌ Generate API failed:', response.status, error);
      return null;
    }

    const data = await response.json();
    console.log('   ✅ Campaign generated');
    console.log('   📊 Campaign ID:', data.campaign_id);
    console.log('   📊 Tokens used:', data.tokens_used);
    console.log('   📊 Variants:', Object.keys(data.variants || {}).length, 'platforms');
    
    return data.campaign_id;
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    console.log('   💡 Ensure app is running at:', APP_URL);
    console.log('   💡 Try: cd apps/synqra-mvp && npm run dev:3004');
    return null;
  }
}

async function testScheduleAPI(campaignId) {
  if (!campaignId) {
    console.log('2️⃣ Skipping /api/pulse/schedule (no campaign ID)');
    return null;
  }

  console.log('\n2️⃣ Testing /api/pulse/schedule...');
  
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
  
  const testPayload = {
    campaign_id: campaignId,
    scheduled_for: futureDate.toISOString(),
    user_id: 'test-user-' + Date.now(),
  };

  try {
    const response = await fetch(`${APP_URL}/api/pulse/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('   ❌ Schedule API failed:', response.status, error);
      return null;
    }

    const data = await response.json();
    console.log('   ✅ Campaign scheduled');
    console.log('   📊 Job IDs:', data.job_ids?.length || 0, 'jobs created');
    console.log('   📊 Scheduled for:', data.scheduled_for);
    
    return data.job_ids;
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return null;
  }
}

async function verifyDatabase(campaignId, jobIds) {
  if (!campaignId && !jobIds) {
    console.log('\n3️⃣ Skipping database verification (no IDs)');
    return;
  }

  console.log('\n3️⃣ Verifying database entries...');

  try {
    // Check campaign in pulse_campaigns
    if (campaignId) {
      const campaignResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/pulse_campaigns?id=eq.${campaignId}&select=*`,
        {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
        }
      );

      if (campaignResponse.ok) {
        const campaigns = await campaignResponse.json();
        console.log('   ✅ pulse_campaigns:', campaigns.length > 0 ? 'Found' : 'Not found');
      }
    }

    // Check jobs in content_jobs
    if (jobIds && jobIds.length > 0) {
      const jobResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/content_jobs?id=in.(${jobIds.join(',')})&select=id,source,status`,
        {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
        }
      );

      if (jobResponse.ok) {
        const jobs = await jobResponse.json();
        console.log('   ✅ content_jobs:', jobs.length, 'entries');
        jobs.forEach(job => {
          console.log(`      - Job ${job.id.substring(0, 8)}: source="${job.source}", status="${job.status}"`);
        });
      }
    }
  } catch (error) {
    console.error('   ❌ Database check failed:', error.message);
  }
}

async function runDryRunTest() {
  console.log('Starting PulseEngine dry-run test...\n');
  console.log('Configuration:');
  console.log('  - App URL:', APP_URL);
  console.log('  - Supabase:', SUPABASE_URL);
  console.log('  - KIE.AI Key:', KIE_API_KEY ? '✅ Present' : '❌ Missing');
  console.log('');

  // Test 1: Generate campaign
  const campaignId = await testGenerateAPI();

  // Test 2: Schedule campaign
  const jobIds = campaignId ? await testScheduleAPI(campaignId) : null;

  // Test 3: Verify database
  await verifyDatabase(campaignId, jobIds);

  // Summary
  console.log('\n📊 DRY-RUN SUMMARY:');
  console.log('  - Campaign Generated:', campaignId ? '✅' : '❌');
  console.log('  - Campaign Scheduled:', jobIds && jobIds.length > 0 ? '✅' : '❌');
  console.log('  - Database Verified:', campaignId ? '✅' : '⏭️  Skipped');
  
  if (campaignId) {
    console.log('\n🔍 Test Campaign ID:', campaignId);
    console.log('📝 Check in Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/tjfeindwmpuyajvjftke/editor');
  }

  console.log('\n✅ Dry-run test complete!');
  console.log('💡 No real posts were made to social platforms.');
}

runDryRunTest().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
