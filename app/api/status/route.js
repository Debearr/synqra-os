import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const sb = createClient(supabaseUrl, supabaseKey);

  const { data } = await sb
    .from("status_logs")
    .select("service, status_code, timestamp")
    .order("timestamp", { ascending: false })
    .limit(40);

  const parsed = data?.map((r) => ({
    service: r.service,
    status: r.status_code === 200 ? 1 : 0,
    timestamp: r.timestamp,
  }));

  return new Response(JSON.stringify(parsed ?? []), {
    headers: { "Content-Type": "application/json" },
  });
}
