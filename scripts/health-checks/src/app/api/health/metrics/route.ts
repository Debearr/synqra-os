import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("service_id");
    const period = searchParams.get("period") || "24h"; // 24h, 7d, 30d
    const granularity = searchParams.get("granularity") || "hourly"; // hourly, daily

    if (!serviceId) {
      return NextResponse.json(
        {
          success: false,
          error: "service_id is required",
        },
        { status: 400 }
      );
    }

    // Calculate time range
    const now = new Date();
    let startTime = new Date();

    switch (period) {
      case "24h":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const table = granularity === "daily" ? "health_metrics_daily" : "health_metrics_hourly";
    const timeColumn = granularity === "daily" ? "date" : "hour_start";

    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("service_id", serviceId)
      .gte(timeColumn, startTime.toISOString())
      .order(timeColumn, { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      period,
      granularity,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch metrics",
      },
      { status: 500 }
    );
  }
}
