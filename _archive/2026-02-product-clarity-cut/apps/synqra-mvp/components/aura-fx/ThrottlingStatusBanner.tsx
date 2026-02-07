"use client";

import { AlertTriangle, Clock, Info } from "lucide-react";
import type { ThrottlingState } from "@/app/api/aura-fx/budget/types";

interface ThrottlingStatusBannerProps {
  state: ThrottlingState;
  message: string;
  lastUpdated?: string;
  showTimestamp?: boolean;
}

/**
 * User-facing banner showing throttling status
 * Displays appropriate message and styling based on state
 */
export function ThrottlingStatusBanner({
  state,
  message,
  lastUpdated,
  showTimestamp = false,
}: ThrottlingStatusBannerProps) {
  // Don't show banner for NORMAL state
  if (state === "NORMAL") {
    return null;
  }

  const getStateConfig = (state: ThrottlingState) => {
    switch (state) {
      case "ALERT":
        return {
          bgColor: "bg-blue-900/10",
          borderColor: "border-blue-500/30",
          textColor: "text-blue-400",
          icon: Info,
          iconColor: "text-blue-500",
        };

      case "CACHE_EXTENDED":
        return {
          bgColor: "bg-amber-900/10",
          borderColor: "border-amber-500/30",
          textColor: "text-amber-400",
          icon: Clock,
          iconColor: "text-amber-500",
        };

      case "D1_DISABLED":
        return {
          bgColor: "bg-orange-900/10",
          borderColor: "border-orange-500/30",
          textColor: "text-orange-400",
          icon: AlertTriangle,
          iconColor: "text-orange-500",
        };

      case "STALE_ONLY":
      case "HARD_STOP":
        return {
          bgColor: "bg-red-900/10",
          borderColor: "border-red-500/30",
          textColor: "text-red-400",
          icon: AlertTriangle,
          iconColor: "text-red-500",
        };

      default:
        return {
          bgColor: "bg-noid-silver/10",
          borderColor: "border-noid-silver/30",
          textColor: "text-noid-silver",
          icon: Info,
          iconColor: "text-noid-silver",
        };
    }
  };

  const config = getStateConfig(state);
  const Icon = config.icon;

  return (
    <div
      className={`mb-4 rounded-lg border ${config.borderColor} ${config.bgColor} p-4`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 flex-shrink-0 ${config.iconColor} mt-0.5`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${config.textColor}`}>{message}</p>
          {showTimestamp && lastUpdated && (
            <p className="mt-1 text-xs text-noid-silver/60">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Stale data indicator with timestamp
 */
export function StaleDataIndicator({
  lastUpdated,
  ageInHours,
}: {
  lastUpdated: string;
  ageInHours: number;
}) {
  return (
    <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-900/5 p-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-amber-500" />
        <div className="flex-1">
          <p className="text-sm text-amber-400">
            Showing cached data from {new Date(lastUpdated).toLocaleString()}
          </p>
          <p className="text-xs text-noid-silver/60 mt-0.5">
            Data age: {ageInHours.toFixed(1)} hours
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hard stop message - complete service pause
 */
export function HardStopMessage() {
  return (
    <div className="rounded-xl border border-red-500/40 bg-red-900/20 p-6">
      <div className="flex items-start gap-4">
        <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-500 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-medium text-red-400 mb-2">
            Service Temporarily Limited
          </h3>
          <p className="text-sm text-noid-silver/80 mb-4">
            We&apos;ve reached our API budget limit for this period. New assessments
            are temporarily paused to ensure service stability.
          </p>
          <div className="space-y-2 text-sm text-noid-silver/70">
            <p>• Cached data is shown where available</p>
            <p>• Service will resume automatically next period</p>
            <p>• All data shown includes last-updated timestamps</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * D1 disabled message - H4 only mode
 */
export function D1DisabledMessage() {
  return (
    <div className="rounded-lg border border-orange-500/30 bg-orange-900/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-orange-500 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-orange-400 mb-1">
            Daily (D1) Assessments Temporarily Unavailable
          </p>
          <p className="text-xs text-noid-silver/70">
            H4 (4-hour) assessments remain available. D1 assessments will resume
            when budget allows.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Cache extended notice
 */
export function CacheExtendedNotice() {
  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-900/5 p-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-amber-500" />
        <p className="text-xs text-amber-400/90">
          Assessments may use cached data for optimal performance
        </p>
      </div>
    </div>
  );
}
