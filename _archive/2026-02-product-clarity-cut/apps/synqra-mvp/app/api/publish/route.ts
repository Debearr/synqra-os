import { NextResponse } from 'next/server';
import { enqueue } from '@/lib/posting/queue';
import { config } from '@/lib/posting/config';
import { buildPostingIdempotencyKey } from '@/lib/posting/idempotency';

export async function POST(req: Request) {
  try {
    const { jobId, platforms, payloads } = await req.json();

    if (!jobId || !platforms || !Array.isArray(platforms)) {
      return NextResponse.json(
        { ok: false, error: 'Missing jobId or platforms' },
        { status: 400 }
      );
    }

    if (!config.postingEnabled && !config.dryRun) {
      return NextResponse.json(
        { ok: false, error: 'Posting disabled' },
        { status: 403 }
      );
    }

    const enqueued: string[] = [];

    for (const platform of platforms) {
      const payload = payloads?.[platform];
      if (!payload) {
        console.warn(`??  No payload for ${platform}`);
        continue;
      }

      const idempotencyKey = buildPostingIdempotencyKey({
        jobId,
        platform,
        payload,
      });

      const result = await enqueue({
        platform,
        payload,
        jobId,
        idempotencyKey,
      });

      if (result.enqueued) {
        enqueued.push(platform);
      }
    }

    return NextResponse.json({
      ok: true,
      jobId,
      enqueued,
      dryRun: config.dryRun,
      message: config.dryRun
        ? 'Jobs enqueued in DRY_RUN mode - no actual posts will be made'
        : `${enqueued.length} jobs enqueued for posting`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Publish error:', message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
