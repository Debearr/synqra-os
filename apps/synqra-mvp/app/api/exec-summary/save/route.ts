import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, label, data } = body;
    
    // Mock user ID for MVP if auth not fully wired in this context
    // In production, use: const { data: { user } } = await supabase.auth.getUser();
    const owner_id = "00000000-0000-0000-0000-000000000000"; // Placeholder or get from auth

    const payload = {
      owner_id, 
      label,
      product_name: data.productName || "Untitled",
      data_json: data,
      updated_at: new Date().toISOString()
    };

    let result;
    if (id) {
      // Update
      result = await supabase
        .from("exec_summaries")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
    } else {
      // Insert
      result = await supabase
        .from("exec_summaries")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
        // If RLS blocks us (because of dummy owner_id), we might see error
        console.error("Save error:", result.error);
        return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ id: result.data.id, success: true });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

