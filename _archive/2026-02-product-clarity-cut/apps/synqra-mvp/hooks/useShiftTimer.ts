import { useCallback, useEffect, useRef, useState } from "react";
import { DriverHealthIndexResult, DriverHealthSnapshot } from "@/lib/driver-intel/types";
import { driverHealth as driverHealthApi } from "@/lib/driver-intel/client";

interface ShiftTimerOptions {
  inactivityMinutes?: number;
  healthPollSeconds?: number;
  snapshotProvider?: () => DriverHealthSnapshot;
}

export function useShiftTimer(options?: ShiftTimerOptions) {
  const inactivityMs = (options?.inactivityMinutes ?? 15) * 60 * 1000;
  const healthPollMs = (options?.healthPollSeconds ?? 60) * 1000;

  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [onBreak, setOnBreak] = useState(false);
  const [health, setHealth] = useState<DriverHealthIndexResult | null>(null);

  const lastActivityRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const healthRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (onBreak) setOnBreak(false);
  }, [onBreak]);

  const startShift = useCallback(() => {
    const now = Date.now();
    setStartedAt(now);
    setElapsedMs(0);
    setOnBreak(false);
    lastActivityRef.current = now;
  }, []);

  const stopShift = useCallback(() => {
    setStartedAt(null);
    setOnBreak(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (healthRef.current) clearInterval(healthRef.current);
  }, []);

  const reset = useCallback(() => {
    setStartedAt(null);
    setElapsedMs(0);
    setOnBreak(false);
    setHealth(null);
    lastActivityRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (healthRef.current) clearInterval(healthRef.current);
  }, []);

  // Tick shift timer and detect breaks
  useEffect(() => {
    if (!startedAt) return;

    intervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startedAt);

      const lastActivity = lastActivityRef.current ?? startedAt;
      if (Date.now() - lastActivity >= inactivityMs) {
        setOnBreak(true);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startedAt, inactivityMs]);

  // Poll driver health every 60s
  useEffect(() => {
    if (!startedAt) return;

    const fetchHealth = async () => {
      try {
        const snapshot =
          options?.snapshotProvider?.() ??
          ({
            timestamp: new Date().toISOString(),
          } satisfies DriverHealthSnapshot);

        const result = await driverHealthApi({
          snapshot,
          hoursDriven: elapsedMs / (1000 * 60 * 60),
          lastBreakMinutesAgo: (Date.now() - (lastActivityRef.current ?? startedAt)) / (1000 * 60),
        });
        setHealth(result);
      } catch (error) {
        console.warn("driver health check failed", error);
      }
    };

    fetchHealth();
    healthRef.current = setInterval(fetchHealth, healthPollMs);

    return () => {
      if (healthRef.current) clearInterval(healthRef.current);
    };
  }, [startedAt, elapsedMs, healthPollMs, options?.snapshotProvider]);

  return {
    startedAt,
    elapsedMs,
    onBreak,
    health,
    startShift,
    stopShift,
    reset,
    recordActivity,
  };
}
