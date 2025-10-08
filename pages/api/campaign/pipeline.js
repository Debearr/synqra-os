import { promises as fs } from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

async function readBrandContext() {
  const brandContextPath = path.join(
    process.cwd(),
    'branding',
    'context',
    'noid_synqra_brand_context.md'
  );
  try {
    return await fs.readFile(brandContextPath, 'utf8');
  } catch (error) {
    return '';
  }
}

async function generateCampaignCopyWithGemini({ brandContext, campaignBrief }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { text: '', error: 'Missing GEMINI_API_KEY' };
  }

  const modelId = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelId });

  const prompt = [
    'You are a senior creative strategist. Generate high-conversion campaign copy.',
    'Follow the brand context block and keep voice/tone consistent.',
    '',
    '--- Brand_Context_Block (verbatim) ---',
    brandContext,
    '--- End Brand_Context_Block ---',
    '',
    '--- Campaign Input ---',
    campaignBrief,
    '--- End Campaign Input ---',
    '',
    'Output concise copy with: headline, subhead, primary CTA, body copy.',
  ].join('\n');

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = (response?.text?.() || '').trim();
    return { text };
  } catch (error) {
    return { text: '', error: String(error?.message || error) };
  }
}

async function generateVoiceoverWithOpenAI({ brandContext, campaignCopy }) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.VOAI_API_KEY;
  if (!apiKey) {
    return { text: '', error: 'Missing OPENAI_API_KEY (or VOAI_API_KEY)' };
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content:
            'You write direct-response voiceover scripts. Keep lines tight, punchy, human. 15-30s.',
        },
        {
          role: 'user',
          content: [
            'Brand context (verbatim):',
            brandContext,
            '',
            'Campaign copy to adapt into a short voiceover script:',
            campaignCopy,
          ].join('\n'),
        },
      ],
    });
    const text = completion?.choices?.[0]?.message?.content?.trim?.() || '';
    return { text };
  } catch (error) {
    return { text: '', error: String(error?.message || error) };
  }
}

async function createLeonardoGeneration({ prompt }) {
  const apiKey = process.env.LEONARDO_API_KEY;
  if (!apiKey) {
    return { generationId: null, error: 'Missing LEONARDO_API_KEY' };
  }

  const modelId = process.env.LEONARDO_MODEL_ID; // optional
  const body = {
    prompt,
    num_images: 2,
    width: 1024,
    height: 1024,
    guidance_scale: 7,
  };
  if (modelId) body.modelId = modelId;

  const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return { generationId: null, error: `Leonardo create failed: ${response.status}` };
  }
  const data = await response.json();
  // response format may vary; try common shapes
  const generationId = data?.sdGenerationJob?.generationId || data?.generationId || data?.id || null;
  if (!generationId) {
    return { generationId: null, error: 'Leonardo create: missing generationId' };
  }
  return { generationId };
}

async function pollLeonardoForImages({ generationId }) {
  const apiKey = process.env.LEONARDO_API_KEY;
  if (!apiKey || !generationId) {
    return { images: [], error: !apiKey ? 'Missing LEONARDO_API_KEY' : 'Missing generationId' };
  }

  const intervalMs = Number(process.env.LEONARDO_POLL_INTERVAL_MS || 3000);
  const timeoutMs = Number(process.env.LEONARDO_POLL_TIMEOUT_MS || 45000);
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const url = `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      return { images: [], error: `Leonardo poll failed: ${res.status}` };
    }
    const data = await res.json();
    // Known shapes: { generations_by_pk: { status, images: [{ url }] } }
    const node = data?.generations_by_pk || data?.generation || data;
    const status = node?.status || node?.state || '';
    const images = node?.images || node?.generated_images || [];

    if (Array.isArray(images) && images.length > 0) {
      const urls = images
        .map((img) => img?.url || img?.imageUrl || img?.generated_image?.url)
        .filter(Boolean);
      if (urls.length > 0) return { images: urls };
    }

    if (String(status).toUpperCase() === 'FAILED') {
      return { images: [], error: 'Leonardo generation failed' };
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  return { images: [], error: 'Leonardo poll timeout' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { campaignInput } = req.body || {};
  if (!campaignInput) {
    res.status(400).json({ error: 'Missing campaignInput' });
    return;
  }

  const brandContext = await readBrandContext();

  // 1) Gemini → generate campaign copy
  const geminiResult = await generateCampaignCopyWithGemini({
    brandContext,
    campaignBrief: campaignInput,
  });

  // 2) VOAI (OpenAI) → generate voiceover script
  const voaiResult = await generateVoiceoverWithOpenAI({
    brandContext,
    campaignCopy: geminiResult.text || campaignInput,
  });

  // 3) Leonardo → generate images (optional if key missing)
  let leonardo = { images: [], error: undefined };
  const leonardoPrompt = [
    'Art-direct the key visuals that support the campaign.',
    'Keep aesthetic minimal, high-contrast, grid-aligned.',
    'Avoid human faces unless essential. No clutter.',
    '',
    `Brand guardrails:\n${brandContext}`,
    '',
    'Campaign copy (for semantic alignment):',
    geminiResult.text || campaignInput,
  ].join('\n');

  try {
    const created = await createLeonardoGeneration({ prompt: leonardoPrompt });
    if (created.generationId) {
      const polled = await pollLeonardoForImages({ generationId: created.generationId });
      leonardo = polled;
    } else {
      leonardo = { images: [], error: created.error || 'Leonardo create failed' };
    }
  } catch (error) {
    leonardo = { images: [], error: String(error?.message || error) };
  }

  const output = {
    input: { campaignInput },
    brandContextIncluded: Boolean(brandContext),
    copy: geminiResult.text || '',
    voiceoverScript: voaiResult.text || '',
    images: leonardo.images || [],
    errors: {
      gemini: geminiResult.error,
      voai: voaiResult.error,
      leonardo: leonardo.error,
    },
  };

  res.status(200).json(output);
}

