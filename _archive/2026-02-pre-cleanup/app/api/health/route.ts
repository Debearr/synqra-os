import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      node: process.version,
      env: process.env.NODE_ENV
    },
    { status: 200 }
  );
}

export const dynamic = 'force-dynamic';
