import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Fetch all service statuses
    const { data: services, error: servicesError } = await supabase
      .from("health_services")
      .select(`
        id,
        service_key,
        display_name,
        is_active,
        health_service_status (
          current_status,
          uptime_percentage,
          avg_response_time_ms,
          consecutive_failures
        ),
        health_projects (
          project_key,
          display_name
        )
      `)
      .eq("is_active", true);

    if (servicesError) throw servicesError;

    // Fetch active alerts count
    const { count: activeAlertsCount, error: alertsError } = await supabase
      .from("health_alerts")
      .select("*", { count: "exact", head: true })
      .in("status", ["active", "acknowledged"]);

    if (alertsError) throw alertsError;

    // Fetch active incidents count
    const { count: activeIncidentsCount, error: incidentsError } = await supabase
      .from("health_incidents")
      .select("*", { count: "exact", head: true })
      .neq("status", "resolved");

    if (incidentsError) throw incidentsError;

    // Calculate statistics
    const totalServices = services?.length || 0;
    const healthyServices =
      services?.filter((s) => s.health_service_status?.current_status === "healthy").length || 0;
    const degradedServices =
      services?.filter((s) => s.health_service_status?.current_status === "degraded").length || 0;
    const criticalServices =
      services?.filter((s) => s.health_service_status?.current_status === "critical").length || 0;
    const unknownServices =
      services?.filter((s) => !s.health_service_status?.current_status || s.health_service_status?.current_status === "unknown")
        .length || 0;

    const overallHealthPercentage =
      totalServices > 0 ? (healthyServices / totalServices) * 100 : 0;

    const avgUptime =
      services && services.length > 0
        ? services.reduce(
            (sum, s) => sum + (s.health_service_status?.uptime_percentage || 0),
            0
          ) / services.length
        : 0;

    const avgResponseTime =
      services && services.length > 0
        ? services.reduce(
            (sum, s) => sum + (s.health_service_status?.avg_response_time_ms || 0),
            0
          ) / services.length
        : 0;

    // Group services by project
    const projectGroups = services?.reduce((acc: any, service) => {
      const projectKey = service.health_projects?.project_key || "unknown";
      if (!acc[projectKey]) {
        acc[projectKey] = {
          project_name: service.health_projects?.display_name || "Unknown",
          services: [],
        };
      }
      acc[projectKey].services.push(service);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total_services: totalServices,
          healthy_services: healthyServices,
          degraded_services: degradedServices,
          critical_services: criticalServices,
          unknown_services: unknownServices,
          overall_health_percentage: parseFloat(overallHealthPercentage.toFixed(2)),
          avg_uptime: parseFloat(avgUptime.toFixed(2)),
          avg_response_time_ms: parseFloat(avgResponseTime.toFixed(2)),
          active_alerts: activeAlertsCount || 0,
          active_incidents: activeIncidentsCount || 0,
        },
        projects: projectGroups,
        services: services,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching health overview:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch health overview",
      },
      { status: 500 }
    );
  }
}
