"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface Service {
  id: string;
  display_name: string;
}

interface MetricsData {
  hour_start: string;
  uptime_percentage: number;
  avg_response_time_ms: number;
}

interface MetricsChartsProps {
  services: Service[];
}

export function MetricsCharts({ services }: MetricsChartsProps) {
  const [metricsData, setMetricsData] = useState<Record<string, MetricsData[]>>({});
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const supabase = createClientComponentClient();

  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services]);

  useEffect(() => {
    if (!selectedServiceId) return;

    const fetchMetrics = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("health_metrics_hourly")
        .select("*")
        .eq("service_id", selectedServiceId)
        .gte("hour_start", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("hour_start", { ascending: true });

      if (!error && data) {
        setMetricsData((prev) => ({ ...prev, [selectedServiceId]: data }));
      }
      setLoading(false);
    };

    fetchMetrics();
  }, [selectedServiceId]);

  const currentMetrics = metricsData[selectedServiceId] || [];
  const selectedService = services.find((s) => s.id === selectedServiceId);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-100">Performance Metrics (24h)</h2>
        <select
          value={selectedServiceId}
          onChange={(e) => setSelectedServiceId(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-100 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.display_name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uptime Chart */}
        <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Uptime Percentage</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : currentMetrics.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No data available
            </div>
          ) : (
            <div className="h-64">
              <div className="relative h-full flex items-end justify-between gap-1">
                {currentMetrics.slice(-24).map((metric, index) => {
                  const height = metric.uptime_percentage || 0;
                  const color =
                    height >= 99
                      ? "bg-emerald-500"
                      : height >= 95
                      ? "bg-yellow-500"
                      : "bg-red-500";

                  return (
                    <div key={index} className="flex-1 flex flex-col justify-end group relative">
                      <div
                        className={`${color} rounded-t transition-all hover:opacity-80`}
                        style={{ height: `${height}%` }}
                      ></div>
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-slate-800 text-xs text-slate-100 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {new Date(metric.hour_start).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        <br />
                        {height.toFixed(2)}%
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>24h ago</span>
                <span>Now</span>
              </div>
            </div>
          )}
        </div>

        {/* Response Time Chart */}
        <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Avg Response Time (ms)</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
          ) : currentMetrics.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No data available
            </div>
          ) : (
            <div className="h-64">
              <div className="relative h-full flex items-end justify-between gap-1">
                {currentMetrics.slice(-24).map((metric, index) => {
                  const maxResponseTime = Math.max(
                    ...currentMetrics.map((m) => m.avg_response_time_ms || 0),
                    1000
                  );
                  const height = ((metric.avg_response_time_ms || 0) / maxResponseTime) * 100;
                  const color =
                    (metric.avg_response_time_ms || 0) < 1000
                      ? "bg-cyan-500"
                      : (metric.avg_response_time_ms || 0) < 2000
                      ? "bg-yellow-500"
                      : "bg-red-500";

                  return (
                    <div key={index} className="flex-1 flex flex-col justify-end group relative">
                      <div
                        className={`${color} rounded-t transition-all hover:opacity-80`}
                        style={{ height: `${Math.max(height, 5)}%` }}
                      ></div>
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-slate-800 text-xs text-slate-100 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {new Date(metric.hour_start).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        <br />
                        {(metric.avg_response_time_ms || 0).toFixed(0)}ms
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>24h ago</span>
                <span>Now</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Summary */}
      {!loading && currentMetrics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <div className="text-sm text-slate-400">Avg Uptime (24h)</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {(
                currentMetrics.reduce((sum, m) => sum + (m.uptime_percentage || 0), 0) /
                currentMetrics.length
              ).toFixed(2)}
              %
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <div className="text-sm text-slate-400">Avg Response (24h)</div>
            <div className="text-2xl font-bold text-cyan-400 mt-1">
              {(
                currentMetrics.reduce((sum, m) => sum + (m.avg_response_time_ms || 0), 0) /
                currentMetrics.length
              ).toFixed(0)}
              ms
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <div className="text-sm text-slate-400">Min Response</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              {Math.min(...currentMetrics.map((m) => m.avg_response_time_ms || 0)).toFixed(0)}ms
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <div className="text-sm text-slate-400">Max Response</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              {Math.max(...currentMetrics.map((m) => m.avg_response_time_ms || 0)).toFixed(0)}ms
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
