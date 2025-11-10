import { NextResponse } from "next/server";
import { readCacheEntry, writeCacheEntry } from "sales-engine";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ ok: false, error: "missing_key" }, { status: 400 });
  }

  const result = await readCacheEntry(key);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, value: result.data?.[0]?.value });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { key?: string; value?: unknown; ttlSeconds?: number };
    if (!body.key || body.value === undefined) {
      return NextResponse.json({ ok: false, error: "missing_parameters" }, { status: 400 });
    }

    const expiresAt = new Date(
      Date.now() + (body.ttlSeconds ? body.ttlSeconds * 1000 : 30 * 60 * 1000)
    ).toISOString();

    const result = await writeCacheEntry({
      key: body.key,
      value: body.value,
      scope: "system",
      expiresAt,
    });

    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[sales-engine] System cache route failed", error);
    return NextResponse.json({ ok: false, error: "system_cache_failed" }, { status: 500 });
  }
}
