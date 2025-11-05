import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const {
  SUPABASE_URL,
  SUPABASE_KEY,
  TWITTER_BEARER,
  TIKTOK_ACCESS_TOKEN
} = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_KEY are required to publish posts.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const platformConfigs = {
  twitter: {
    endpoint: 'https://api.twitter.com/2/tweets',
    token: TWITTER_BEARER,
    payload: (post) => ({ text: formatPostText(post) })
  },
  tiktok: {
    endpoint: 'https://open.tiktokapis.com/v2/post/publish/',
    token: TIKTOK_ACCESS_TOKEN,
    payload: (post) => ({
      post_info: {
        title: truncate(post.copy, 80),
        description: formatPostText(post)
      }
    })
  }
};

function truncate(text, limit) {
  if (!text) return '';
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;
}

function formatPostText(post) {
  const hashtags = Array.isArray(post.hashtags) ? post.hashtags.join(' ') : '';
  return [post.copy?.trim(), hashtags.trim()].filter(Boolean).join(' ');
}

async function fetchScheduledPosts() {
  const { data, error } = await supabase
    .from('calendar_posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('post_date', new Date().toISOString());

  if (error) {
    throw new Error(`Failed to fetch scheduled posts: ${error.message}`);
  }

  return data ?? [];
}

async function publishToPlatform(post) {
  const config = platformConfigs[post.platform];

  if (!config) {
    throw new Error(`Unsupported platform: ${post.platform}`);
  }

  if (!config.token) {
    throw new Error(`Missing token for platform: ${post.platform}`);
  }

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(config.payload(post))
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to publish to ${post.platform}: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  return response.json().catch(() => ({}));
}

async function markAsPublished(postId, platformResponse) {
  const { error } = await supabase
    .from('calendar_posts')
    .update({
      status: 'published',
      updated_at: new Date().toISOString(),
      published_response: platformResponse
    })
    .eq('id', postId);

  if (error) {
    throw new Error(`Failed to update calendar_posts for ${postId}: ${error.message}`);
  }
}

async function logPostMetric(post, platformResponse) {
  const { error } = await supabase.from('post_metrics').insert({
    platform: post.platform,
    external_post_id: platformResponse?.data?.id ?? null,
    impressions: 0,
    engagement: 0,
    likes: 0,
    shares: 0,
    comments: 0
  });

  if (error) {
    console.warn(`⚠️ Failed to insert post_metrics for ${post.id}: ${error.message}`);
  }
}

export async function publishScheduledPosts() {
  const scheduledPosts = await fetchScheduledPosts();

  if (!scheduledPosts.length) {
    console.log('ℹ️ No scheduled posts ready for publishing.');
    return { published: [], skipped: true };
  }

  const results = [];

  for (const post of scheduledPosts) {
    try {
      const response = await publishToPlatform(post);
      await markAsPublished(post.id, response);
      await logPostMetric(post, response);

      results.push({ id: post.id, platform: post.platform, status: 'published' });
    } catch (error) {
      console.error(`❌ Failed to publish post ${post.id}:`, error);
      results.push({ id: post.id, platform: post.platform, status: 'failed', error: error.message });
    }
  }

  return { published: results, skipped: false };
}

async function main() {
  try {
    const { published, skipped } = await publishScheduledPosts();

    if (skipped) {
      console.log('✅ Publish step completed: nothing to process.');
      return;
    }

    console.log('✅ Publish results:');
    published.forEach((entry) => {
      if (entry.status === 'published') {
        console.log(`• ${entry.platform} post ${entry.id} published.`);
      } else {
        console.error(`• ${entry.platform} post ${entry.id} failed -> ${entry.error}`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to publish posts:', error);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
