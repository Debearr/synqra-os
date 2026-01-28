/**
 * Budget Usage Tracking Service
 * Monitors API budget usage and determines throttling state
 */

import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/env";
import {
  getThrottlingStateInfo,
  evaluateAssessmentRequest,
  shouldTriggerAlert,
} from "./throttling-state-machine";
import type {
  BudgetUsage,
  ThrottlingState,
  ThrottlingStateInfo,
  AssessmentRequestResult,
  AdminAlert,
} from "./types";

export class BudgetService {
  private supabase;

  constructor(authToken?: string) {
    const headers = authToken ? { Authorization: authToken } : {};
    this.supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      global: { headers },
    });
  }

  /**
   * Get current budget usage from database
   */
  async getCurrentBudgetUsage(): Promise<BudgetUsage> {
    const { data, error } = await this.supabase
      .from("budget_usage")
      .select("*")
      .order("period_start", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      throw new Error(`Failed to get budget usage: ${error.message}`);
    }

    if (!data) {
      // Return default if no data
      return {
        used: 0,
        limit: 100,
        percentage: 0,
        period_start: new Date().toISOString(),
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        last_updated: new Date().toISOString(),
      };
    }

    return {
      used: data.used,
      limit: data.limit,
      percentage: (data.used / data.limit) * 100,
      period_start: data.period_start,
      period_end: data.period_end,
      last_updated: data.last_updated,
    };
  }

  /**
   * Get current throttling state
   */
  async getThrottlingState(): Promise<ThrottlingStateInfo> {
    const usage = await this.getCurrentBudgetUsage();
    return getThrottlingStateInfo(usage.percentage, usage.last_updated);
  }

  /**
   * Evaluate if an assessment request should be allowed
   */
  async evaluateRequest(
    timeframe: "H4" | "D1",
    hasCachedData: boolean = false,
    cacheAge?: number
  ): Promise<AssessmentRequestResult> {
    const throttlingInfo = await this.getThrottlingState();

    return evaluateAssessmentRequest(
      timeframe,
      throttlingInfo.state,
      hasCachedData,
      cacheAge
    );
  }

  /**
   * Record budget usage (called after API request)
   */
  async recordUsage(cost: number): Promise<void> {
    const { error } = await this.supabase.rpc("increment_budget_usage", {
      p_cost: cost,
    });

    if (error) {
      console.error("Failed to record budget usage:", error);
      // Don't throw - this is tracking only
    }
  }

  /**
   * Check if state transition should trigger alert
   */
  async checkAndTriggerAlert(): Promise<AdminAlert | null> {
    // Get previous state
    const { data: previousRecord } = await this.supabase
      .from("budget_tracking")
      .select("throttling_state")
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    const previousState: ThrottlingState = previousRecord?.throttling_state || "NORMAL";

    // Get current state
    const currentState = await this.getThrottlingState();

    // Check if alert should be triggered
    if (shouldTriggerAlert(previousState, currentState.state)) {
      const alert: AdminAlert = {
        id: crypto.randomUUID(),
        threshold: currentState.percentage,
        state: currentState.state,
        message: currentState.adminMessage,
        severity: this.getAlertSeverity(currentState.state),
        triggered_at: new Date().toISOString(),
        acknowledged: false,
      };

      // Store alert
      await this.supabase.from("admin_alerts").insert(alert);

      return alert;
    }

    return null;
  }

  /**
   * Get alert severity based on throttling state
   */
  private getAlertSeverity(
    state: ThrottlingState
  ): "info" | "warning" | "critical" {
    switch (state) {
      case "NORMAL":
        return "info";
      case "ALERT":
      case "CACHE_EXTENDED":
        return "warning";
      case "D1_DISABLED":
      case "STALE_ONLY":
      case "HARD_STOP":
        return "critical";
    }
  }

  /**
   * Get unacknowledged admin alerts
   */
  async getUnacknowledgedAlerts(): Promise<AdminAlert[]> {
    const { data, error } = await this.supabase
      .from("admin_alerts")
      .select("*")
      .eq("acknowledged", false)
      .order("triggered_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get alerts: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Acknowledge an admin alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    const { error } = await this.supabase
      .from("admin_alerts")
      .update({ acknowledged: true })
      .eq("id", alertId);

    if (error) {
      throw new Error(`Failed to acknowledge alert: ${error.message}`);
    }
  }

  /**
   * Get budget tracking history
   */
  async getTrackingHistory(hours: number = 24) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    const { data, error } = await this.supabase
      .from("budget_tracking")
      .select("*")
      .gte("timestamp", cutoffTime.toISOString())
      .order("timestamp", { ascending: false });

    if (error) {
      throw new Error(`Failed to get tracking history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Record tracking snapshot
   */
  async recordTrackingSnapshot(
    requestsAllowed: number,
    requestsThrottled: number,
    cacheHits: number,
    cacheMisses: number
  ): Promise<void> {
    const usage = await this.getCurrentBudgetUsage();
    const state = getThrottlingStateInfo(usage.percentage);

    const { error } = await this.supabase.from("budget_tracking").insert({
      timestamp: new Date().toISOString(),
      usage_percentage: usage.percentage,
      throttling_state: state.state,
      requests_allowed: requestsAllowed,
      requests_throttled: requestsThrottled,
      cache_hits: cacheHits,
      cache_misses: cacheMisses,
    });

    if (error) {
      console.error("Failed to record tracking snapshot:", error);
    }
  }
}
