import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { searchParams } = new URL(request.url);
    const projectKey = searchParams.get("project");
    const serviceKey = searchParams.get("service");

    let query = supabase
      .from("health_service_status")
      .select(`
        *,
        health_services (
          id,
          service_key,
          display_name,
          health_projects (
            project_key,
            display_name
          )
        )
      `);

    // Filter by project if specified
    if (projectKey) {
      query = query.eq("health_services.health_projects.project_key", projectKey);
    }

    // Filter by service if specified
    if (serviceKey) {
      query = query.eq("health_services.service_key", serviceKey);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching health status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch health status",
      },
      { status: 500 }
    );
  }
}
