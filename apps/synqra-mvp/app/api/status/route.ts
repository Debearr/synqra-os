import { NextResponse } from 'next/server';
import { getQueueSize } from '@/lib/posting/queue';
import { config } from '@/lib/posting/config';

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: 'operational',
    config: {
      dryRun: config.dryRun,
      postingEnabled: config.postingEnabled,
      approvalRequired: config.approvalRequired,
    },
    queue: {
      size: getQueueSize(),
    },
    timestamp: new Date().toISOString(),
  });
}
