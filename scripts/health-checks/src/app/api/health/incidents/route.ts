import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // investigating, identified, monitoring, resolved
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = supabase
      .from("health_incidents")
      .select(`
        *,
        health_services (
          display_name,
          service_key,
          health_projects (
            display_name,
            project_key
          )
        )
      `)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching incidents:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch incidents",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const body = await request.json();
    const {
      title,
      description,
      severity,
      service_id,
      affected_services,
      impact_description,
    } = body;

    if (!title || !severity || !service_id) {
      return NextResponse.json(
        {
          success: false,
          error: "title, severity, and service_id are required",
        },
        { status: 400 }
      );
    }

    const incident = {
      title,
      description,
      severity,
      service_id,
      affected_services: affected_services || [service_id],
      impact_description,
      status: "investigating",
      started_at: new Date().toISOString(),
      detected_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("health_incidents")
      .insert([incident])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error creating incident:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create incident",
      },
      { status: 500 }
    );
  }
}
