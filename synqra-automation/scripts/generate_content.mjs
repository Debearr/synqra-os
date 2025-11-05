import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const agentConfig = {
  name: 'synqra-auto-social',
  description: 'Automated Social Media AI for NØID content orchestration.',
  triggers: [{ cron: '0 10 * * 2,4,6' }],
  actions: ['generate_content', 'schedule_post', 'publish_post'],
  context: {
    brand: 'NØID',
    voice: 'Luxury, Crafted, Curated, Excellence',
    hashtags: ['#AI', '#Automation', '#LuxuryTech', '#Synqra', '#NØID', '#CreatorTools', '#Innovation'],
    platforms: ['twitter', 'tiktok']
  }
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_AUTOMATION_USER_ID = process.env.SUPABASE_AUTOMATION_USER_ID;

const supabaseHeaders = SUPABASE_URL && SUPABASE_KEY
  ? {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }
  : null;

const toneFragments = {
  twitter: {
    opener: 'A new chapter for luxury automation.',
    callToAction: 'Follow NØID for the next wave of curated innovation.'
  },
  tiktok: {
    opener: 'Crafting luxury with code and creativity.',
    callToAction: 'Tap in for behind-the-scenes mastery from NØID.'
  }
};

const platformEmoji = {
  twitter: '✨',
  tiktok: '🎥'
};

function composePost(platform) {
  const { brand, voice, hashtags } = agentConfig.context;
  const fragments = toneFragments[platform] ?? {
    opener: 'Defining luxury automation.',
    callToAction: 'Explore the NØID craft in motion.'
  };

  const hashtagBlock = hashtags.join(' ');
  const emoji = platformEmoji[platform] ?? '✨';
  const voiceStatement = `${brand} | ${voice}`;

  const content = [
    `${emoji} ${fragments.opener}`,
    voiceStatement,
    fragments.callToAction,
    hashtagBlock
  ].join('\n\n');

  return {
    platform,
    content,
    hashtags,
    metadata: {
      createdAt: new Date().toISOString(),
      voice,
      brand
    }
  };
}

async function persistDraftToSupabase(post) {
  if (!supabaseHeaders || !SUPABASE_AUTOMATION_USER_ID) {
    return { skipped: true, reason: 'Supabase credentials or automation user missing.' };
  }

  const payload = {
    user_id: SUPABASE_AUTOMATION_USER_ID,
    content: post.content,
    platform: post.platform,
    status: 'draft',
    hashtags: post.hashtags,
    metadata: post.metadata
  };

  try {
    const { data } = await axios.post(`${SUPABASE_URL}/rest/v1/posts`, payload, {
      headers: supabaseHeaders
    });

    return { inserted: true, data };
  } catch (error) {
    return {
      inserted: false,
      error: error.response?.data ?? error.message
    };
  }
}

export async function generateContent() {
  const generated = agentConfig.context.platforms.map((platform) => composePost(platform));
  const persisted = [];

  for (const post of generated) {
    const result = await persistDraftToSupabase(post);
    persisted.push({ platform: post.platform, ...result });
  }

  return {
    generated,
    persisted
  };
}

async function main() {
  const { generated, persisted } = await generateContent();

  console.log('✅ Generated content payloads:');
  generated.forEach((post) => {
    console.log(`\n--- ${post.platform.toUpperCase()} ---`);
    console.log(post.content);
  });

  if (persisted.some((entry) => entry.inserted || entry.skipped)) {
    console.log('\n📦 Persistence summary:');
    persisted.forEach((entry) => {
      if (entry.inserted) {
        console.log(`• ${entry.platform}: inserted into Supabase.`);
      } else if (entry.skipped) {
        console.log(`• ${entry.platform}: skipped (${entry.reason}).`);
      } else {
        console.log(`• ${entry.platform}: failed ->`, entry.error);
      }
    });
  }
}

const directRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (directRun) {
  generateContent()
    .then(({ generated }) => {
      console.log(JSON.stringify(generated, null, 2));
      return main();
    })
    .catch((error) => {
      console.error('❌ Failed to generate content:', error);
      process.exitCode = 1;
    });
}
