import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const {
  SUPABASE_URL,
  SUPABASE_KEY,
  DEFAULT_SCHEDULE_DELAY_MINUTES = '90',
  SCHEDULE_BATCH_LIMIT = '3'
} = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_KEY are required to schedule posts.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const delayMinutes = Number.parseInt(DEFAULT_SCHEDULE_DELAY_MINUTES, 10);
const batchLimit = Number.parseInt(SCHEDULE_BATCH_LIMIT, 10);

if (Number.isNaN(delayMinutes) || delayMinutes < 0) {
  throw new Error(`DEFAULT_SCHEDULE_DELAY_MINUTES must be a non-negative integer. Received: ${DEFAULT_SCHEDULE_DELAY_MINUTES}`);
}

if (Number.isNaN(batchLimit) || batchLimit <= 0) {
  throw new Error(`SCHEDULE_BATCH_LIMIT must be a positive integer. Received: ${SCHEDULE_BATCH_LIMIT}`);
}

const staggerMinutes = Number.parseInt(process.env.SCHEDULE_STAGGER_MINUTES ?? '60', 10);

function computePostDate(baseDate, position) {
  const base = new Date(baseDate.getTime() + delayMinutes * 60_000);
  const offset = position * staggerMinutes * 60_000;
  return new Date(base.getTime() + offset);
}

async function fetchPendingQueue(limit) {
  const { data, error } = await supabase
    .from('content_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch pending content_queue items: ${error.message}`);
  }

  return data ?? [];
}

async function insertCalendarPost(queueItem, scheduledDate) {
  const payload = {
    queue_id: queueItem.id,
    platform: queueItem.platform,
    post_date: scheduledDate.toISOString(),
    copy: queueItem.copy,
    hashtags: queueItem.hashtags,
    asset_url: queueItem.asset_url,
    status: 'scheduled'
  };

  const { error } = await supabase.from('calendar_posts').insert(payload);

  if (error) {
    throw new Error(`Failed to insert calendar post for queue ${queueItem.id}: ${error.message}`);
  }
}

async function markQueueScheduled(queueId) {
  const { error } = await supabase
    .from('content_queue')
    .update({ status: 'scheduled', updated_at: new Date().toISOString() })
    .eq('id', queueId);

  if (error) {
    throw new Error(`Failed to update content_queue status for ${queueId}: ${error.message}`);
  }
}

export async function schedulePosts() {
  const pendingItems = await fetchPendingQueue(batchLimit);

  if (!pendingItems.length) {
    console.log('ℹ️ No pending content_queue items to schedule.');
    return { scheduled: [], skipped: true };
  }

  const now = new Date();
  const scheduled = [];

  for (let index = 0; index < pendingItems.length; index += 1) {
    const item = pendingItems[index];
    const postDate = computePostDate(now, index);

    await insertCalendarPost(item, postDate);
    await markQueueScheduled(item.id);

    scheduled.push({
      queue_id: item.id,
      platform: item.platform,
      post_date: postDate.toISOString()
    });
  }

  return { scheduled, skipped: false };
}

async function main() {
  try {
    const result = await schedulePosts();

    if (result.skipped) {
      console.log('✅ Schedule step completed: nothing to process.');
      return;
    }

    console.log('✅ Scheduled posts:');
    result.scheduled.forEach((entry) => {
      console.log(`• ${entry.platform} at ${entry.post_date} (queue_id: ${entry.queue_id})`);
    });
  } catch (error) {
    console.error('❌ Failed to schedule posts:', error);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
