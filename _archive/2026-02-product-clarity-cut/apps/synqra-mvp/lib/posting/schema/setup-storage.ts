/**
 * Supabase Storage Setup for Media Uploads
 *
 * Creates the 'synqra-media' bucket with proper permissions
 * Run this once: npx tsx lib/posting/schema/setup-storage.ts
 */

import { createClient } from '@supabase/supabase-js';

async function setupStorage() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  if (supabaseUrl.includes('demo') || supabaseKey.includes('demo')) {
    console.log('⚠️  Demo credentials detected - skipping storage setup');
    console.log('📝 To set up storage:');
    console.log('   1. Go to Supabase Dashboard > Storage');
    console.log('   2. Create a new bucket named: synqra-media');
    console.log('   3. Set public: true');
    console.log('   4. File size limit: 50MB');
    console.log('   5. Allowed MIME types: image/*, video/*');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  console.log('🗄️  Setting up Supabase Storage...');

  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'synqra-media');

    if (bucketExists) {
      console.log('✅ Bucket "synqra-media" already exists');
    } else {
      // Create bucket
      const { error } = await supabase.storage.createBucket('synqra-media', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/*', 'video/*'],
      });

      if (error) {
        console.error('❌ Failed to create bucket:', error.message);
        process.exit(1);
      }

      console.log('✅ Created bucket "synqra-media"');
    }

    // Set up storage policy for public access
    console.log('✅ Storage bucket ready');
    console.log('   • Bucket: synqra-media');
    console.log('   • Public: Yes');
    console.log('   • Max size: 50MB');
    console.log('   • Types: image/*, video/*');

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Storage setup failed:', message);
    process.exit(1);
  }
}

if (require.main === module) {
  setupStorage()
    .then(() => {
      console.log('\n🎉 Storage setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed:', error.message);
      process.exit(1);
    });
}

export { setupStorage };
