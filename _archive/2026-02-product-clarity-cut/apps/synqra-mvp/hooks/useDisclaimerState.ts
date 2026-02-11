"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { AssessmentType, AcknowledgmentTrigger } from "@/app/api/aura-fx/disclaimer/types";
import { getDisclaimerContent } from "@/lib/compliance/disclaimer-manager";

interface DisclaimerState {
  isLoading: boolean;
  requiresAcknowledgment: boolean;
  trigger: AcknowledgmentTrigger | null;
  version: string;
  content: string;
  methodologyContent: string;
  triggerMessage: string;
  error: string | null;
}

interface UseDisclaimerStateOptions {
  assessmentType: AssessmentType;
  userId?: string;
  autoCheck?: boolean;
}

/**
 * Hook to manage disclaimer state for assessment views
 * Handles checking, acknowledgment, and re-checking logic
 */
export function useDisclaimerState({
  assessmentType,
  userId,
  autoCheck = true,
}: UseDisclaimerStateOptions) {
  const [state, setState] = useState<DisclaimerState>({
    isLoading: true,
    requiresAcknowledgment: true,
    trigger: "initial",
    version: "local",
    content: "",
    methodologyContent: "",
    triggerMessage: "Please acknowledge the disclaimer to continue.",
    error: null,
  });

  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const checkTimeoutRef = useRef<number | null>(null);

  /**
   * Check disclaimer state from API
   */
  const checkDisclaimerState = useCallback(async () => {
    if (!userId) {
      const fallback = getDisclaimerContent("assessment");
      setState((prev) => ({
        ...prev,
        isLoading: false,
        requiresAcknowledgment: true,
        trigger: "initial",
        version: "local",
        content: fallback.short,
        methodologyContent: fallback.methodology,
        triggerMessage: "Please acknowledge the disclaimer to continue.",
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      console.info("[demo] disclaimer check start");

      const controller = new AbortController();
      if (checkTimeoutRef.current) {
        window.clearTimeout(checkTimeoutRef.current);
      }
      checkTimeoutRef.current = window.setTimeout(() => {
        controller.abort();
      }, 8000);

      const response = await fetch("/api/aura-fx/disclaimer/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, assessmentType }),
        signal: controller.signal,
      });

      if (checkTimeoutRef.current) {
        window.clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }

      if (!response.ok) {
        throw new Error("Failed to check disclaimer state");
      }

      const data = await response.json().catch(() => null);
      if (!data || typeof data !== "object") {
        throw new Error("Malformed disclaimer response");
      }

      setState({
        isLoading: false,
        requiresAcknowledgment: data.requiresAcknowledgment,
        trigger: data.trigger,
        version: data.version,
        content: data.content,
        methodologyContent: data.methodologyContent,
        triggerMessage: data.triggerMessage,
        error: null,
      });
      console.info("[demo] disclaimer check complete");
    } catch (error) {
      if (checkTimeoutRef.current) {
        window.clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }
      const fallback = getDisclaimerContent("assessment");
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.warn("[demo] disclaimer check fallback", message);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        requiresAcknowledgment: true,
        trigger: "initial",
        version: "local",
        content: fallback.short,
        methodologyContent: fallback.methodology,
        triggerMessage: "Please acknowledge the disclaimer to continue.",
        error: message,
      }));
    }
  }, [userId, assessmentType]);

  /**
   * Acknowledge disclaimer
   */
  const acknowledge = useCallback(async () => {
    if (!userId || !state.version || !state.trigger) {
      return;
    }

    try {
      setIsAcknowledging(true);

      const response = await fetch("/api/aura-fx/disclaimer/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          version: state.version,
          trigger: state.trigger,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to acknowledge disclaimer");
      }

      // Update state to reflect acknowledgment
      setState((prev) => ({
        ...prev,
        requiresAcknowledgment: false,
        trigger: null,
        triggerMessage: "",
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to acknowledge",
      }));
    } finally {
      setIsAcknowledging(false);
    }
  }, [userId, state.version, state.trigger]);

  /**
   * Auto-check on mount if enabled
   */
  useEffect(() => {
    if (autoCheck) {
      checkDisclaimerState();
    }
  }, [autoCheck, checkDisclaimerState]);

  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        window.clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    isAcknowledging,
    acknowledge,
    recheckState: checkDisclaimerState,
  };
}
