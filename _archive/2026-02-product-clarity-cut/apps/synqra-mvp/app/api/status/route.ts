import { NextResponse } from 'next/server';
import { getQueueSize } from '@/lib/posting/queue';
import { config } from '@/lib/posting/config';

export async function GET() {
  const size = await getQueueSize();
  return NextResponse.json({
    ok: true,
    status: 'operational',
    config: {
      dryRun: config.dryRun,
      postingEnabled: config.postingEnabled,
      approvalRequired: config.approvalRequired,
    },
    queue: {
      size,
    },
    timestamp: new Date().toISOString(),
  });
}
