import { NextResponse } from 'next/server';
import { enqueue } from '@/lib/posting/queue';
import { config } from '@/lib/posting/config';
import {
  enforceBudget,
  ensureCorrelationId,
  enforceKillSwitch,
  logSafeguard,
  normalizeError,
  requireConfirmation,
} from '@/lib/safeguards';

export async function POST(req: Request) {
  const correlationId = ensureCorrelationId(req.headers.get('x-correlation-id'));

  try {
    const { jobId, platforms, payloads, confirmed } = await req.json();

    logSafeguard({
      level: 'info',
      message: 'publish.request.start',
      scope: 'publish',
      correlationId,
      data: { jobId, platforms },
    });

    enforceKillSwitch({ scope: 'publish', correlationId });
    requireConfirmation({
      confirmed,
      context: 'Publish content to external platforms',
      correlationId,
    });

    if (!jobId || !platforms || !Array.isArray(platforms)) {
      return NextResponse.json(
        { ok: false, error: 'Missing jobId or platforms', correlationId },
        { status: 400 }
      );
    }

    enforceBudget({
      estimatedCost: Math.max(0.01 * platforms.length, 0.01),
      scope: 'publish',
      correlationId,
    });

    if (!config.postingEnabled && !config.dryRun) {
      return NextResponse.json(
        { ok: false, error: 'Posting disabled', correlationId },
        { status: 403 }
      );
    }

    const enqueued: string[] = [];

    for (const platform of platforms) {
      const payload = payloads?.[platform];
      if (!payload) {
        console.warn(`⚠️  No payload for ${platform}`);
        continue;
      }

      enqueue({
        platform,
        payload,
        jobId,
      });

      enqueued.push(platform);
    }

    logSafeguard({
      level: 'info',
      message: 'publish.request.success',
      scope: 'publish',
      correlationId,
      data: { jobId, enqueued, dryRun: config.dryRun },
    });

    return NextResponse.json({
      ok: true,
      jobId,
      enqueued,
      dryRun: config.dryRun,
      message: config.dryRun
        ? 'Jobs enqueued in DRY_RUN mode - no actual posts will be made'
        : `${enqueued.length} jobs enqueued for posting`,
      correlationId,
    });
  } catch (error: any) {
    const normalized = normalizeError(error);
    logSafeguard({
      level: 'error',
      message: 'publish.request.error',
      scope: 'publish',
      correlationId,
      data: { error: normalized.code },
    });
    return NextResponse.json(
      { ok: false, error: normalized.safeMessage, correlationId },
      { status: normalized.status }
    );
  }
}
