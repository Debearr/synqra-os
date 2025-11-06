"use client";

interface Service {
  id: string;
  service_key: string;
  display_name: string;
  health_service_status?: {
    current_status: string;
    uptime_percentage: number;
  };
}

interface Project {
  id: string;
  project_key: string;
  display_name: string;
  description: string;
}

interface ProjectHealthCardProps {
  project: Project;
  services: Service[];
}

export function ProjectHealthCard({ project, services }: ProjectHealthCardProps) {
  const healthyCount = services.filter(
    (s) => s.health_service_status?.current_status === "healthy"
  ).length;
  const totalCount = services.length;
  const healthPercentage = totalCount > 0 ? (healthyCount / totalCount) * 100 : 0;

  const avgUptime =
    services.length > 0
      ? services.reduce(
          (sum, s) => sum + (s.health_service_status?.uptime_percentage || 0),
          0
        ) / services.length
      : 0;

  let statusColor = "emerald";
  if (healthPercentage < 100 && healthPercentage >= 70) statusColor = "yellow";
  else if (healthPercentage < 70) statusColor = "red";

  const colorClasses = {
    emerald: {
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/20",
      text: "text-emerald-400",
      ring: "ring-emerald-500/50",
    },
    yellow: {
      border: "border-yellow-500/30",
      bg: "bg-yellow-500/20",
      text: "text-yellow-400",
      ring: "ring-yellow-500/50",
    },
    red: {
      border: "border-red-500/30",
      bg: "bg-red-500/20",
      text: "text-red-400",
      ring: "ring-red-500/50",
    },
  };

  const colors = colorClasses[statusColor as keyof typeof colorClasses];

  return (
    <div
      className={`bg-slate-900 rounded-lg p-6 border ${colors.border} hover:${colors.ring} hover:ring-2 transition-all`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{project.display_name}</h3>
          <p className="text-sm text-slate-400 mt-1">{project.description}</p>
        </div>
        <div
          className={`w-3 h-3 rounded-full ${colors.bg} ${colors.text} animate-pulse`}
        ></div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Service Health</span>
            <span className={colors.text}>
              {healthyCount}/{totalCount}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className={`${colors.bg} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${healthPercentage}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Avg Uptime</span>
            <span className="text-slate-100">{avgUptime.toFixed(2)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="bg-cyan-500/40 h-2 rounded-full transition-all duration-500"
              style={{ width: `${avgUptime}%` }}
            ></div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <div className="flex flex-wrap gap-2">
            {services.slice(0, 3).map((service) => {
              const status = service.health_service_status?.current_status || "unknown";
              const statusColors = {
                healthy: "bg-emerald-500/20 text-emerald-400",
                degraded: "bg-yellow-500/20 text-yellow-400",
                critical: "bg-red-500/20 text-red-400",
                unknown: "bg-slate-600/20 text-slate-400",
              };

              return (
                <span
                  key={service.id}
                  className={`text-xs px-2 py-1 rounded ${
                    statusColors[status as keyof typeof statusColors]
                  }`}
                >
                  {service.service_key}
                </span>
              );
            })}
            {services.length > 3 && (
              <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400">
                +{services.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
