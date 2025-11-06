"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface Incident {
  id: string;
  incident_number: number;
  title: string;
  description: string;
  severity: string;
  status: string;
  started_at: string;
  resolved_at: string | null;
  duration_minutes: number | null;
  impact_description: string | null;
  resolution_summary: string | null;
}

export function IncidentsTimeline() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");

  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchIncidents = async () => {
      setLoading(true);

      let query = supabase
        .from("health_incidents")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20);

      if (filter === "active") {
        query = query.neq("status", "resolved");
      } else if (filter === "resolved") {
        query = query.eq("status", "resolved");
      }

      const { data, error } = await query;

      if (!error && data) {
        setIncidents(data);
      }
      setLoading(false);
    };

    fetchIncidents();
  }, [filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
      case "monitoring":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "identified":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "investigating":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      default:
        return "bg-slate-600/20 text-slate-400 border-slate-600/50";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500 text-white";
      case "error":
        return "bg-orange-500 text-white";
      case "warning":
        return "bg-yellow-500 text-slate-900";
      default:
        return "bg-blue-500 text-white";
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getTimeSince = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-100">Incidents Timeline</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-emerald-500 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              filter === "active"
                ? "bg-emerald-500 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("resolved")}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              filter === "resolved"
                ? "bg-emerald-500 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-slate-900 rounded-lg p-12 border border-slate-800 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : incidents.length === 0 ? (
        <div className="bg-slate-900 rounded-lg p-12 border border-slate-800 text-center">
          <svg
            className="w-16 h-16 text-slate-600 mx-auto mb-4"
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
          <p className="text-slate-400 text-lg">No incidents found</p>
          <p className="text-sm text-slate-500 mt-2">All systems are operating normally</p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
          <div className="divide-y divide-slate-800">
            {incidents.map((incident, index) => (
              <div
                key={incident.id}
                className="p-6 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${getSeverityColor(
                        incident.severity
                      )}`}
                    >
                      <span className="text-sm font-bold">#{incident.incident_number}</span>
                    </div>
                    {index < incidents.length - 1 && (
                      <div className="w-px h-full bg-slate-700 mt-2"></div>
                    )}
                  </div>

                  {/* Incident details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-100 mb-1">
                          {incident.title}
                        </h3>
                        {incident.description && (
                          <p className="text-sm text-slate-400">{incident.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
                            incident.severity
                          )}`}
                        >
                          {incident.severity.toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                            incident.status
                          )}`}
                        >
                          {incident.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <div className="text-xs text-slate-500">Started</div>
                        <div className="text-sm text-slate-300 mt-1">
                          {getTimeSince(incident.started_at)}
                        </div>
                      </div>

                      {incident.resolved_at && (
                        <div>
                          <div className="text-xs text-slate-500">Resolved</div>
                          <div className="text-sm text-emerald-400 mt-1">
                            {getTimeSince(incident.resolved_at)}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="text-xs text-slate-500">Duration</div>
                        <div className="text-sm text-slate-300 mt-1">
                          {formatDuration(incident.duration_minutes)}
                        </div>
                      </div>

                      {incident.impact_description && (
                        <div className="col-span-2 md:col-span-1">
                          <div className="text-xs text-slate-500">Impact</div>
                          <div className="text-sm text-slate-300 mt-1 truncate">
                            {incident.impact_description}
                          </div>
                        </div>
                      )}
                    </div>

                    {incident.resolution_summary && incident.status === "resolved" && (
                      <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded">
                        <div className="text-xs text-emerald-400 font-medium mb-1">
                          Resolution Summary
                        </div>
                        <div className="text-sm text-slate-300">{incident.resolution_summary}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
