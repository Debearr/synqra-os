import { useCallback, useEffect, useState } from "react";
import { AuraFxEngineResult, Candle, Timeframe } from "@/lib/aura-fx/types";

interface UseAuraFxAnalysisParams {
  symbol: string;
  timeframe: Timeframe | string;
  candles: Candle[];
  tzOffsetMinutes?: number;
  skip?: boolean;
}

export function useAuraFxAnalysis(params: UseAuraFxAnalysisParams) {
  const { symbol, timeframe, candles, tzOffsetMinutes, skip } = params;

  const [data, setData] = useState<AuraFxEngineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (skip) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/aura-fx/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, timeframe, candles, tzOffsetMinutes }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed ${res.status}`);
      }
      const json = await res.json();
      setData(json.result as AuraFxEngineResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe, candles, tzOffsetMinutes, skip]);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, refetch: run };
}
