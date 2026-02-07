import { useEffect, useMemo, useState } from "react";
import { driverHealth as driverHealthApi } from "@/lib/driver-intel/client";
import {
  DriverHealthIndexResult,
  DriverHealthSnapshot,
} from "@/lib/driver-intel/types";

type HealthStatus = "optimal" | "caution" | "fatigued";

interface DriverHealthStreamOptions {
  pollSeconds?: number;
  snapshotProvider?: () => DriverHealthSnapshot;
  hoursDriven?: number;
  lastBreakMinutesAgo?: number;
}

export function useDriverHealthStream(options?: DriverHealthStreamOptions) {
  const [health, setHealth] = useState<DriverHealthIndexResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status: HealthStatus | null = useMemo(() => {
    if (!health) return null;
    if (health.score >= 70) return "optimal";
    if (health.score >= 40) return "caution";
    return "fatigued";
  }, [health]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const snapshot =
          options?.snapshotProvider?.() ??
          ({
            timestamp: new Date().toISOString(),
          } satisfies DriverHealthSnapshot);

        const result = await driverHealthApi({
          snapshot,
          hoursDriven: options?.hoursDriven,
          lastBreakMinutesAgo: options?.lastBreakMinutesAgo,
        });
        setHealth(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    run();
    interval = setInterval(run, (options?.pollSeconds ?? 60) * 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [options?.pollSeconds, options?.snapshotProvider, options?.hoursDriven, options?.lastBreakMinutesAgo]);

  return {
    health,
    loading,
    error,
    status,
    score: health?.score ?? null,
    recommendations: health?.recommendations ?? [],
  };
}
