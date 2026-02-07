"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import type { AdminAlert, ThrottlingState } from "@/app/api/aura-fx/budget/types";

interface BudgetAlertDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

/**
 * Admin dashboard for budget alerts and throttling status
 * Shows real-time budget usage and active alerts
 */
export function BudgetAlertDashboard({
  autoRefresh = true,
  refreshInterval = 60000, // 1 minute
}: BudgetAlertDashboardProps) {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [currentState, setCurrentState] = useState<ThrottlingState>("NORMAL");
  const [percentage, setPercentage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch current state
      const stateResponse = await fetch("/api/aura-fx/budget/status");
      const stateData = await stateResponse.json();
      setCurrentState(stateData.state);
      setPercentage(stateData.percentage);

      // Fetch unacknowledged alerts
      const alertsResponse = await fetch("/api/aura-fx/budget/alerts");
      const alertsData = await alertsResponse.json();
      setAlerts(alertsData.alerts || []);
    } catch (error) {
      console.error("Failed to fetch budget data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch("/api/aura-fx/budget/alerts/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });
      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  const getStateSeverityColor = (state: ThrottlingState) => {
    switch (state) {
      case "NORMAL":
        return "text-green-400";
      case "ALERT":
      case "CACHE_EXTENDED":
        return "text-amber-400";
      case "D1_DISABLED":
      case "STALE_ONLY":
      case "HARD_STOP":
        return "text-red-400";
    }
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 95) return "bg-red-500";
    if (percentage >= 90) return "bg-orange-500";
    if (percentage >= 80) return "bg-amber-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Loading budget status...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <div className="rounded-xl border border-noid-silver/20 bg-noid-black p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Budget Status</h2>
          <span className={`text-lg font-mono ${getStateSeverityColor(currentState)}`}>
            {currentState}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-noid-silver/70">Usage</span>
            <span className="text-sm font-mono text-white">
              {percentage.toFixed(1)}%
            </span>
          </div>
          <div className="h-4 rounded-full bg-noid-silver/10 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getProgressBarColor(percentage)}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Threshold Markers */}
        <div className="grid grid-cols-5 gap-2 text-xs">
          <div className={percentage >= 70 ? "text-yellow-400" : "text-noid-silver/50"}>
            70% Alert
          </div>
          <div className={percentage >= 80 ? "text-amber-400" : "text-noid-silver/50"}>
            80% Cache
          </div>
          <div className={percentage >= 90 ? "text-orange-400" : "text-noid-silver/50"}>
            90% D1 Off
          </div>
          <div className={percentage >= 95 ? "text-red-400" : "text-noid-silver/50"}>
            95% Stale
          </div>
          <div className={percentage >= 100 ? "text-red-500 font-bold" : "text-noid-silver/50"}>
            100% Stop
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-noid-silver/20 bg-noid-black p-6">
          <h2 className="text-xl font-bold mb-4">Active Alerts</h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg border p-4 ${
                  alert.severity === "critical"
                    ? "border-red-500/30 bg-red-900/10"
                    : alert.severity === "warning"
                    ? "border-amber-500/30 bg-amber-900/10"
                    : "border-blue-500/30 bg-blue-900/10"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <AlertTriangle
                      className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        alert.severity === "critical"
                          ? "text-red-500"
                          : alert.severity === "warning"
                          ? "text-amber-500"
                          : "text-blue-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white mb-1">
                        {alert.message}
                      </p>
                      <p className="text-xs text-noid-silver/60">
                        Triggered: {new Date(alert.triggered_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="px-3 py-1 rounded bg-noid-silver/10 hover:bg-noid-silver/20 text-xs text-white transition-colors"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Active Alerts */}
      {alerts.length === 0 && (
        <div className="rounded-xl border border-green-500/20 bg-green-900/5 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-sm text-green-400">No active alerts</p>
          </div>
        </div>
      )}
    </div>
  );
}
