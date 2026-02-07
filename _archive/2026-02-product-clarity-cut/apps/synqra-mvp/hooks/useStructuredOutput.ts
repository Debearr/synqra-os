import { useCallback, useRef, useState } from "react";
import { parseWithSchema } from "@/engine/structured-output";
import { z } from "zod";

interface UseStructuredOutputState<T> {
  loading: boolean;
  error: string | null;
  result: T | null;
  partial: string;
}

interface RunOptions<T> {
  schema?: z.ZodSchema<T>;
  signal?: AbortSignal;
}

export function useStructuredOutput<T = unknown>() {
  const [state, setState] = useState<UseStructuredOutputState<T>>({
    loading: false,
    error: null,
    result: null,
    partial: "",
  });
  const controllerRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (request: RequestInfo, init?: RequestInit, options?: RunOptions<T>) => {
      if (controllerRef.current) controllerRef.current.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setState((prev) => ({ ...prev, loading: true, error: null, partial: "" }));
      try {
        const res = await fetch(request, {
          ...init,
          signal: options?.signal ?? controller.signal,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed with ${res.status}`);
        }

        // Stream and accumulate partial output
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value, { stream: true });
            setState((prev) => ({ ...prev, partial: accumulated }));
          }
          accumulated += decoder.decode();
        } else {
          accumulated = await res.text();
          setState((prev) => ({ ...prev, partial: accumulated }));
        }

        let parsed: T | null = null;
        try {
          const json = JSON.parse(accumulated);
          const payload = (json as Record<string, unknown>).data ?? (json as Record<string, unknown>).result ?? json;
          parsed = options?.schema ? parseWithSchema(payload, options.schema) : (payload as T);
        } catch (err) {
          throw err;
        }

        setState({ loading: false, error: null, result: parsed, partial: accumulated });
        return parsed;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw error;
      }
    },
    []
  );

  const reset = useCallback(() => {
    if (controllerRef.current) controllerRef.current.abort();
    setState({ loading: false, error: null, result: null, partial: "" });
  }, []);

  return { ...state, run, reset };
}
