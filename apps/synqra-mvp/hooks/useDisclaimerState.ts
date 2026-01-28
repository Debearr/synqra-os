"use client";

import { useState, useEffect, useCallback } from "react";
import type { AssessmentType, AcknowledgmentTrigger } from "@/app/api/aura-fx/disclaimer/types";

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
    requiresAcknowledgment: false,
    trigger: null,
    version: "",
    content: "",
    methodologyContent: "",
    triggerMessage: "",
    error: null,
  });

  const [isAcknowledging, setIsAcknowledging] = useState(false);

  /**
   * Check disclaimer state from API
   */
  const checkDisclaimerState = useCallback(async () => {
    if (!userId) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch("/api/aura-fx/disclaimer/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, assessmentType }),
      });

      if (!response.ok) {
        throw new Error("Failed to check disclaimer state");
      }

      const data = await response.json();

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
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
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

  return {
    ...state,
    isAcknowledging,
    acknowledge,
    recheckState: checkDisclaimerState,
  };
}
