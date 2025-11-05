import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const {
  SUPABASE_URL,
  SUPABASE_KEY,
  OPENAI_API_KEY
} = process.env;

const agentContext = {
  brand: 'NØID',
  voice: 'Luxury, Crafted, Curated, Excellence',
  hashtags: ['#AI', '#Automation', '#LuxuryTech', '#Synqra', '#NØID', '#Innovation', '#CreatorTools'],
  platforms: ['twitter', 'tiktok']
};

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Missing SUPABASE_URL or SUPABASE_KEY. Supabase inserts will be skipped.');
}

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required to generate content.');
}

const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

function buildPrompt() {
  return `You are Synqra AI. Generate 3 short social media posts optimized for Twitter and TikTok.
Write in NØID's luxury, crafted, curated, aspirational voice.
Each post must:
- Specify the platform explicitly as "twitter" or "tiktok".
- Include a "theme" summarizing the angle of the post in <= 6 words.
- Provide "copy" formatted for the platform with a clear hook.
- Include a "hashtags" array that only uses items from this list: ${agentContext.hashtags.join(' ')}.
- Optionally include an "asset_url" if a visual idea is suggested (use null when not needed).

Return strict JSON in the following shape:
[
  {
    "platform": "twitter",
    "theme": "...",
    "copy": "...",
    "hashtags": ["#AI", "#Synqra"],
    "asset_url": null
  }
]

Do not include commentary, markdown, or code fences.`;
}

function extractJsonFromResponse(content) {
  if (!content) {
    throw new Error('OpenAI response content is empty.');
  }

  const fenceMatch = content.match(/```json\s*([\s\S]*?)```/i) || content.match(/```\s*([\s\S]*?)```/i);
  const jsonBlock = fenceMatch ? fenceMatch[1] : content;

  try {
    return JSON.parse(jsonBlock);
  } catch (error) {
    throw new Error(`Failed to parse OpenAI JSON response: ${error.message}\nRaw: ${jsonBlock}`);
  }
}

function normalizeIdea(idea) {
  const allowedPlatforms = new Set(agentContext.platforms);
  const platform = (idea.platform || '').toLowerCase();

  if (!allowedPlatforms.has(platform)) {
    throw new Error(`Invalid platform "${idea.platform}". Expected one of: ${[...allowedPlatforms].join(', ')}`);
  }

  if (!Array.isArray(idea.hashtags)) {
    throw new Error('hashtags must be an array');
  }

  const filteredHashtags = idea.hashtags.filter((tag) => agentContext.hashtags.includes(tag));

  return {
    platform,
    theme: idea.theme ?? 'Luxury Innovation',
    copy: idea.copy?.trim(),
    hashtags: filteredHashtags,
    asset_url: idea.asset_url ?? null
  };
}

async function insertQueueItem(item) {
  if (!supabase) {
    return { status: 'skipped', reason: 'Supabase client unavailable.' };
  }

  const { error } = await supabase
    .from('content_queue')
    .insert({
      platform: item.platform,
      theme: item.theme,
      copy: item.copy,
      hashtags: item.hashtags,
      asset_url: item.asset_url,
      status: 'pending'
    });

  if (error) {
    return { status: 'error', error };
  }

  return { status: 'inserted' };
}

export async function generateContent() {
  const prompt = buildPrompt();

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6
  });

  const rawContent = completion.choices?.[0]?.message?.content;
  const ideas = extractJsonFromResponse(rawContent);

  if (!Array.isArray(ideas)) {
    throw new Error('OpenAI response did not return an array of ideas.');
  }

  const normalized = ideas.map(normalizeIdea);
  const results = [];

  for (const idea of normalized) {
    const result = await insertQueueItem(idea);
    results.push({ platform: idea.platform, ...result });
  }

  return { prompt, normalized, persistence: results };
}

async function main() {
  try {
    const { normalized, persistence } = await generateContent();

    console.log('✅ Generated social concepts:\n');
    normalized.forEach((idea) => {
      console.log(`Platform: ${idea.platform.toUpperCase()}`);
      console.log(`Theme: ${idea.theme}`);
      console.log(`Copy: ${idea.copy}`);
      console.log(`Hashtags: ${idea.hashtags.join(' ')}`);
      if (idea.asset_url) {
        console.log(`Asset: ${idea.asset_url}`);
      }
      console.log('---');
    });

    if (persistence.length > 0) {
      console.log('\n📬 Persistence summary:');
      persistence.forEach((entry) => {
        if (entry.status === 'inserted') {
          console.log(`• ${entry.platform}: inserted into content_queue.`);
        } else if (entry.status === 'skipped') {
          console.log(`• ${entry.platform}: skipped (${entry.reason}).`);
        } else {
          console.error(`• ${entry.platform}: failed ->`, entry.error);
        }
      });
    }
  } catch (error) {
    console.error('❌ Failed to generate content:', error);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
