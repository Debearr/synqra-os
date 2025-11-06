"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ProjectHealthCard } from "./ProjectHealthCard";
import { ServiceStatusGrid } from "./ServiceStatusGrid";
import { AlertsPanel } from "./AlertsPanel";
import { MetricsCharts } from "./MetricsCharts";
import { IncidentsTimeline } from "./IncidentsTimeline";

interface Project {
  id: string;
  project_key: string;
  display_name: string;
  description: string;
  is_active: boolean;
}

interface Service {
  id: string;
  project_id: string;
  service_key: string;
  display_name: string;
  is_active: boolean;
  health_service_status?: {
    current_status: string;
    last_check_at: string;
    avg_response_time_ms: number;
    uptime_percentage: number;
    consecutive_failures: number;
  };
}

interface Alert {
  id: string;
  severity: string;
  status: string;
  title: string;
  message: string;
  triggered_at: string;
  service_id: string;
  health_services?: {
    display_name: string;
    health_projects?: {
      display_name: string;
    };
  };
}

export function HealthDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const supabase = createClientComponentClient();

  const fetchDashboardData = async () => {
    try {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("health_projects")
        .select("*")
        .eq("is_active", true)
        .order("display_name");

      if (projectsError) throw projectsError;

      // Fetch services with current status
      const { data: servicesData, error: servicesError } = await supabase
        .from("health_services")
        .select(`
          *,
          health_service_status (
            current_status,
            last_check_at,
            avg_response_time_ms,
            uptime_percentage,
            consecutive_failures
          )
        `)
        .eq("is_active", true)
        .order("display_name");

      if (servicesError) throw servicesError;

      // Fetch active alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from("health_alerts")
        .select(`
          *,
          health_services (
            display_name,
            health_projects (
              display_name
            )
          )
        `)
        .in("status", ["active", "acknowledged"])
        .order("triggered_at", { ascending: false })
        .limit(10);

      if (alertsError) throw alertsError;

      setProjects(projectsData || []);
      setServices(servicesData || []);
      setAlerts(alertsData || []);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    // Set up real-time subscriptions
    const healthLogsChannel = supabase
      .channel("health_logs_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "health_logs",
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    const alertsChannel = supabase
      .channel("alerts_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "health_alerts",
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(healthLogsChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate overall health
  const totalServices = services.length;
  const healthyServices = services.filter(
    (s) => s.health_service_status?.current_status === "healthy"
  ).length;
  const degradedServices = services.filter(
    (s) => s.health_service_status?.current_status === "degraded"
  ).length;
  const criticalServices = services.filter(
    (s) => s.health_service_status?.current_status === "critical"
  ).length;

  const overallHealthPercentage =
    totalServices > 0 ? (healthyServices / totalServices) * 100 : 0;

  let overallStatus = "healthy";
  if (criticalServices > 0) overallStatus = "critical";
  else if (degradedServices > 0) overallStatus = "degraded";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Enterprise Health Cell
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Infrastructure monitoring for Synqra OS, NØID Labs & AuraFX
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-slate-400">Last updated</div>
                <div className="text-xs text-slate-500">
                  {lastUpdate.toLocaleTimeString()}
                </div>
              </div>
              <div
                className={`px-4 py-2 rounded-lg ${
                  overallStatus === "healthy"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : overallStatus === "degraded"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                <div className="text-xs font-medium">Overall Health</div>
                <div className="text-2xl font-bold">
                  {overallHealthPercentage.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Services</p>
                <p className="text-3xl font-bold text-slate-100">{totalServices}</p>
              </div>
              <div className="p-3 bg-slate-800 rounded-lg">
                <svg
                  className="w-6 h-6 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-6 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-400">Healthy</p>
                <p className="text-3xl font-bold text-emerald-400">{healthyServices}</p>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-lg">
                <svg
                  className="w-6 h-6 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-6 border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-400">Degraded</p>
                <p className="text-3xl font-bold text-yellow-400">{degradedServices}</p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-6 border border-red-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-400">Critical</p>
                <p className="text-3xl font-bold text-red-400">{criticalServices}</p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-lg">
                <svg
                  className="w-6 h-6 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <AlertsPanel alerts={alerts} />
          </div>
        )}

        {/* Projects Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-slate-100">Projects Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects.map((project) => (
              <ProjectHealthCard
                key={project.id}
                project={project}
                services={services.filter((s) => s.project_id === project.id)}
              />
            ))}
          </div>
        </div>

        {/* Service Status Grid */}
        <div className="mb-8">
          <ServiceStatusGrid services={services} />
        </div>

        {/* Metrics Charts */}
        <div className="mb-8">
          <MetricsCharts services={services} />
        </div>

        {/* Incidents Timeline */}
        <div>
          <IncidentsTimeline />
        </div>
      </div>
    </div>
  );
}
