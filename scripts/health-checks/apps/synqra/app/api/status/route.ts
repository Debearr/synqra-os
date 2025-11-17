import { NextResponse } from 'next/server';
import { getQueueSize } from '@noid/posting';
import { config } from '@noid/posting';

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
