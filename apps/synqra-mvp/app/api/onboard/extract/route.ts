import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  enforceBudget,
  enforceKillSwitch,
  ensureCorrelationId,
  logSafeguard,
  normalizeError,
} from '@/lib/safeguards';

type ExtractedProfile = {
  name: string;
  title: string;
  company: string;
  location: string;
  headline: string;
  summary: string;
  website: string;
  linkedin: string;
  twitter: string;
  newsletter: string;
  tone: string;
  contentPillars: string[];
  proofPoints: string[];
  confidence: number;
};

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(req: Request) {
  const correlationId = ensureCorrelationId(req.headers.get('x-correlation-id'));

  try {
    const formData = await req.formData();
    const link = formData.get('link') as string | null;
    const file = formData.get('file') as File | null;

    logSafeguard({
      level: 'info',
      message: 'onboard.extract.start',
      scope: 'onboard-extract',
      correlationId,
      data: { hasLink: Boolean(link), hasFile: Boolean(file) },
    });

    enforceKillSwitch({ scope: 'onboard-extract', correlationId });

    let extractionInput = '';

    if (link) {
      extractionInput = `Extract professional profile data from this LinkedIn URL or profile link: ${link}`;
    } else if (file) {
      const buffer = await file.arrayBuffer();
      const text = Buffer.from(buffer).toString('utf-8');
      extractionInput = `Extract professional profile data from this uploaded content:\n\n${text}`;
    } else {
      return NextResponse.json(
        {
          profile: createMinimalDraft(),
          confidence: 0.0,
          correlationId,
        },
        { status: 200 }
      );
    }

    enforceBudget({
      estimatedCost: 0.03,
      scope: 'onboard-extract',
      correlationId,
    });

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `${extractionInput}

Extract and return ONLY a valid JSON object with these exact fields:
{
  "name": "Full Name",
  "title": "Professional Title",
  "company": "Company Name",
  "location": "City, State/Country",
  "headline": "One-line positioning statement",
  "summary": "Professional bio (2-3 sentences)",
  "website": "https://website.com",
  "linkedin": "https://linkedin.com/in/username",
  "twitter": "https://x.com/username",
  "newsletter": "Newsletter or CTA text",
  "tone": "Description of writing tone/voice",
  "contentPillars": ["Topic 1", "Topic 2", "Topic 3"],
  "proofPoints": ["Achievement 1", "Achievement 2", "Achievement 3"],
  "confidence": 0.85
}

Rules:
- Return ONLY the JSON object, no other text
- Use empty strings "" for missing fields
- Use empty arrays [] for missing lists
- Set confidence 0.0-1.0 based on data quality
- Extract real data when available`
        }
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json(
        {
          profile: createMinimalDraft(),
          confidence: 0.0,
          correlationId,
        },
        { status: 200 }
      );
    }

    const extracted = JSON.parse(content.text);
    const normalized = normalizeExtractedProfile(extracted);
    const validated = validateProfile(normalized);

    logSafeguard({
      level: 'info',
      message: 'onboard.extract.success',
      scope: 'onboard-extract',
      correlationId,
      data: { confidence: validated.confidence },
    });

    return NextResponse.json({
      profile: validated,
      confidence: validated.confidence,
      correlationId,
    });

  } catch (error) {
    const normalized = normalizeError(error);
    logSafeguard({
      level: 'error',
      message: 'onboard.extract.error',
      scope: 'onboard-extract',
      correlationId,
      data: { error: normalized.code },
    });
    return NextResponse.json(
      {
        profile: createMinimalDraft(),
        confidence: 0.0,
        error: normalized.safeMessage,
        correlationId,
      },
      { status: normalized.status }
    );
  }
}

function createMinimalDraft(): ExtractedProfile {
  return {
    name: '',
    title: '',
    company: '',
    location: '',
    headline: '',
    summary: '',
    website: '',
    linkedin: '',
    twitter: '',
    newsletter: '',
    tone: '',
    contentPillars: [],
    proofPoints: [],
    confidence: 0.0,
  };
}

function normalizeExtractedProfile(raw: any): ExtractedProfile {
  const safeString = (val: any): string =>
    typeof val === 'string' ? val.trim() : '';

  const safeArray = (val: any): string[] =>
    Array.isArray(val) ? val.map(String).filter(Boolean) : [];

  const safeNumber = (val: any, fallback: number): number => {
    const num = parseFloat(val);
    return isNaN(num) ? fallback : Math.max(0, Math.min(1, num));
  };

  return {
    name: safeString(raw.name),
    title: safeString(raw.title),
    company: safeString(raw.company),
    location: safeString(raw.location),
    headline: safeString(raw.headline),
    summary: safeString(raw.summary),
    website: safeString(raw.website),
    linkedin: safeString(raw.linkedin),
    twitter: safeString(raw.twitter),
    newsletter: safeString(raw.newsletter),
    tone: safeString(raw.tone),
    contentPillars: safeArray(raw.contentPillars || raw.pillars),
    proofPoints: safeArray(raw.proofPoints || raw.highlights),
    confidence: safeNumber(raw.confidence, 0.0),
  };
}

function validateProfile(profile: ExtractedProfile): ExtractedProfile {
  let adjustedConfidence = profile.confidence;

  if (!profile.name) adjustedConfidence *= 0.5;
  if (!profile.title) adjustedConfidence *= 0.8;
  if (!profile.company) adjustedConfidence *= 0.8;
  if (profile.contentPillars.length === 0) adjustedConfidence *= 0.7;
  if (profile.proofPoints.length === 0) adjustedConfidence *= 0.7;

  return {
    ...profile,
    confidence: Math.max(0, Math.min(1, adjustedConfidence)),
  };
}
