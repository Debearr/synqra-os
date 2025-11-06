"use client";

import { useState } from "react";

interface Service {
  id: string;
  service_key: string;
  display_name: string;
  description: string;
  health_service_status?: {
    current_status: string;
    last_check_at: string;
    last_success_at: string;
    last_failure_at: string;
    avg_response_time_ms: number;
    uptime_percentage: number;
    consecutive_failures: number;
    total_checks: number;
    successful_checks: number;
    failed_checks: number;
  };
}

interface ServiceStatusGridProps {
  services: Service[];
}

export function ServiceStatusGrid({ services }: ServiceStatusGridProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <svg
            className="w-5 h-5 text-emerald-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "degraded":
        return (
          <svg
            className="w-5 h-5 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "critical":
        return (
          <svg
            className="w-5 h-5 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5 text-slate-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-slate-100">Service Status</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => {
          const status = service.health_service_status?.current_status || "unknown";
          const uptime = service.health_service_status?.uptime_percentage || 0;
          const responseTime = service.health_service_status?.avg_response_time_ms || 0;
          const lastCheck = service.health_service_status?.last_check_at;

          const statusColors = {
            healthy: "border-emerald-500/30 hover:border-emerald-500/50",
            degraded: "border-yellow-500/30 hover:border-yellow-500/50",
            critical: "border-red-500/30 hover:border-red-500/50",
            unknown: "border-slate-700 hover:border-slate-600",
          };

          return (
            <button
              key={service.id}
              onClick={() => setSelectedService(service)}
              className={`bg-slate-900 rounded-lg p-4 border ${
                statusColors[status as keyof typeof statusColors]
              } hover:scale-105 transition-all text-left w-full`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(status)}
                    <h3 className="font-semibold text-slate-100">{service.display_name}</h3>
                  </div>
                  <p className="text-xs text-slate-400">{service.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Uptime</span>
                  <span className="text-slate-100 font-medium">{uptime.toFixed(2)}%</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Response Time</span>
                  <span className="text-slate-100 font-medium">{responseTime.toFixed(0)}ms</span>
                </div>

                {lastCheck && (
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-800">
                    Last check: {new Date(lastCheck).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Service Details Modal */}
      {selectedService && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="bg-slate-900 rounded-lg p-6 max-w-2xl w-full border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-100">
                  {selectedService.display_name}
                </h3>
                <p className="text-slate-400 mt-1">{selectedService.description}</p>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="text-slate-400 hover:text-slate-100"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Current Status</div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedService.health_service_status?.current_status || "unknown")}
                  <span className="text-xl font-semibold text-slate-100 capitalize">
                    {selectedService.health_service_status?.current_status || "Unknown"}
                  </span>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Uptime</div>
                <div className="text-xl font-semibold text-slate-100">
                  {selectedService.health_service_status?.uptime_percentage?.toFixed(2) || "0.00"}%
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Avg Response Time</div>
                <div className="text-xl font-semibold text-slate-100">
                  {selectedService.health_service_status?.avg_response_time_ms?.toFixed(0) || "0"}ms
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Consecutive Failures</div>
                <div className="text-xl font-semibold text-slate-100">
                  {selectedService.health_service_status?.consecutive_failures || 0}
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Total Checks</div>
                <div className="text-xl font-semibold text-slate-100">
                  {selectedService.health_service_status?.total_checks || 0}
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Success Rate</div>
                <div className="text-xl font-semibold text-slate-100">
                  {selectedService.health_service_status?.total_checks
                    ? (
                        ((selectedService.health_service_status?.successful_checks || 0) /
                          selectedService.health_service_status.total_checks) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  %
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              {selectedService.health_service_status?.last_check_at && (
                <div className="flex justify-between text-slate-400">
                  <span>Last Checked:</span>
                  <span className="text-slate-100">
                    {new Date(selectedService.health_service_status.last_check_at).toLocaleString()}
                  </span>
                </div>
              )}
              {selectedService.health_service_status?.last_success_at && (
                <div className="flex justify-between text-slate-400">
                  <span>Last Success:</span>
                  <span className="text-emerald-400">
                    {new Date(selectedService.health_service_status.last_success_at).toLocaleString()}
                  </span>
                </div>
              )}
              {selectedService.health_service_status?.last_failure_at && (
                <div className="flex justify-between text-slate-400">
                  <span>Last Failure:</span>
                  <span className="text-red-400">
                    {new Date(selectedService.health_service_status.last_failure_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
