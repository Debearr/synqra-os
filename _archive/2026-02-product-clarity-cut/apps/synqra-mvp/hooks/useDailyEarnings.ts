import { useCallback, useEffect, useMemo, useState } from "react";
import { dailyEarnings as dailyEarningsApi } from "@/lib/driver-intel/client";
import { ShiftDay } from "@/lib/driver-intel/types";

interface UseDailyEarningsParams {
  day: ShiftDay;
  refreshMs?: number;
  vehicleCostPerMile?: number;
  targetEarningsPerHour?: number;
}

export function useDailyEarnings(params: UseDailyEarningsParams) {
  const refreshMs = params.refreshMs ?? 60_000;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [gross, setGross] = useState(0);
  const [net, setNet] = useState(0);
  const [perMile, setPerMile] = useState(0);
  const [perHour, setPerHour] = useState(0);
  const [projection, setProjection] = useState(0);

  const loadDailyEarnings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dailyEarningsApi({
        day: params.day,
        vehicleCostPerMile: params.vehicleCostPerMile,
        targetEarningsPerHour: params.targetEarningsPerHour,
      });

      setGross(result.grossTotal);
      setNet(result.netTotal);
      setPerMile(result.earningsPerMile);
      setPerHour(result.earningsPerHour);
      setProjection(
        result.varianceFromTargetPerHour !== undefined
          ? result.netTotal + result.varianceFromTargetPerHour
          : result.netTotal
      );
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [params.day, params.vehicleCostPerMile, params.targetEarningsPerHour]);

  useEffect(() => {
    loadDailyEarnings();
    const id = setInterval(loadDailyEarnings, refreshMs);
    return () => clearInterval(id);
  }, [loadDailyEarnings, refreshMs]);

  const metrics = useMemo(
    () => ({ gross, net, perMile, perHour, projection }),
    [gross, net, perMile, perHour, projection]
  );

  return {
    metrics,
    loading,
    error,
    lastUpdated,
    refresh: loadDailyEarnings,
  };
}
