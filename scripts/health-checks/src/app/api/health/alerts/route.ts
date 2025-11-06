import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // active, acknowledged, resolved
    const severity = searchParams.get("severity"); // critical, error, warning, info
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("health_alerts")
      .select(`
        *,
        health_services (
          display_name,
          service_key,
          health_projects (
            display_name,
            project_key
          )
        ),
        health_alert_rules (
          rule_name,
          condition_type
        )
      `)
      .order("triggered_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    if (severity) {
      query = query.eq("severity", severity);
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
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch alerts",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const body = await request.json();
    const { alert_id, status, resolution_notes } = body;

    if (!alert_id || !status) {
      return NextResponse.json(
        {
          success: false,
          error: "alert_id and status are required",
        },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
    };

    if (status === "acknowledged") {
      updateData.acknowledged_at = new Date().toISOString();
      updateData.acknowledged_by = "api";
    } else if (status === "resolved") {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = "api";
      if (resolution_notes) {
        updateData.resolution_notes = resolution_notes;
      }
    }

    const { data, error } = await supabase
      .from("health_alerts")
      .update(updateData)
      .eq("id", alert_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error updating alert:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update alert",
      },
      { status: 500 }
    );
  }
}
