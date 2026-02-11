import { NextRequest, NextResponse } from "next/server";
import { requireSupabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("exec_summaries")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ data: data.data_json, meta: { label: data.label, id: data.id } });
}

