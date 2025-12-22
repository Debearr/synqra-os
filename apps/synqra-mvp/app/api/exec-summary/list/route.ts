import { NextRequest, NextResponse } from "next/server";
import { requireSupabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // In a real app, you'd get the user from the session/auth header
  // For MVP/Demo, we might assume a test user or get it from header
  // const userId = ... 

  // Assuming RLS handles it via supabase auth client if token is passed
  // Or for server-side client with service key, we need to filter manually if we don't have user token
  
  // For this MVP, let's list all for now, or filter if userId is provided in query
  
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("exec_summaries")
    .select("id, label, product_name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ summaries: data });
}

