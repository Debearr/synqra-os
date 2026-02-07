/**
 * Disclaimer Acknowledgment Service
 * Handles checking, recording, and tracking disclaimer acknowledgments
 */

import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/env";
import { getDisclaimerContent } from "@/lib/compliance/disclaimer-manager";
import type {
  DisclaimerCheckResult,
  AcknowledgmentTrigger,
  AssessmentType,
  DisclaimerVersion,
} from "./types";

export class DisclaimerService {
  private supabase;
  private supabaseReady: boolean;

  constructor(authToken?: string) {
    const headers: Record<string, string> | undefined =
      authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    try {
      this.supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
        global: { headers },
      });
      this.supabaseReady = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("[disclaimer] Supabase unavailable, using fallback:", message);
      this.supabase = null;
      this.supabaseReady = false;
    }
  }

  private getFallbackCheckResult(): DisclaimerCheckResult {
    return {
      required: true,
      reason: "initial",
      last_acknowledgment: null,
      current_version: "local",
    };
  }

  private getFallbackVersion(): DisclaimerVersion {
    const fallback = getDisclaimerContent("assessment");
    const now = new Date().toISOString();
    return {
      id: "local",
      version: "local",
      content: fallback.short,
      methodology_content: fallback.methodology,
      effective_date: now,
      is_active: true,
      created_at: now,
    };
  }

  /**
   * Check if user needs to acknowledge disclaimer
   */
  async checkAcknowledgmentRequired(
    userId: string
  ): Promise<DisclaimerCheckResult> {
    if (!this.supabaseReady || !this.supabase) {
      console.warn("[disclaimer] Supabase not ready, skipping check");
      return this.getFallbackCheckResult();
    }

    const { data, error } = await this.supabase.rpc(
      "check_disclaimer_acknowledgment_required",
      { p_user_id: userId }
    );

    if (error) {
      console.warn("[disclaimer] Failed to check disclaimer:", error.message);
      return this.getFallbackCheckResult();
    }

    if (!data || data.length === 0) {
      console.warn("[disclaimer] No disclaimer check result returned");
      return this.getFallbackCheckResult();
    }

    return data[0];
  }

  /**
   * Record assessment view (for 10+ views/24h tracking)
   */
  async recordAssessmentView(
    userId: string,
    assessmentType: AssessmentType
  ): Promise<void> {
    if (!this.supabaseReady || !this.supabase) {
      console.warn("[disclaimer] Supabase not ready, skipping assessment view");
      return;
    }

    const { error } = await this.supabase.rpc("record_assessment_view", {
      p_user_id: userId,
      p_assessment_type: assessmentType,
    });

    if (error) {
      console.error("Failed to record assessment view:", error);
      // Don't throw - this is tracking only, shouldn't block user
    }
  }

  /**
   * Record disclaimer acknowledgment
   */
  async recordAcknowledgment(
    userId: string,
    version: string,
    trigger: AcknowledgmentTrigger
  ): Promise<string> {
    if (!this.supabaseReady || !this.supabase) {
      throw new Error("Supabase unavailable");
    }

    const { data, error } = await this.supabase.rpc(
      "record_disclaimer_acknowledgment",
      {
        p_user_id: userId,
        p_disclaimer_version: version,
        p_trigger: trigger,
      }
    );

    if (error) {
      throw new Error(`Failed to record acknowledgment: ${error.message}`);
    }

    return data;
  }

  /**
   * Get active disclaimer version
   */
  async getActiveDisclaimerVersion(): Promise<DisclaimerVersion> {
    if (!this.supabaseReady || !this.supabase) {
      console.warn("[disclaimer] Supabase not ready, using fallback version");
      return this.getFallbackVersion();
    }

    const { data, error } = await this.supabase
      .from("disclaimer_versions")
      .select("*")
      .eq("is_active", true)
      .order("effective_date", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.warn(
        "[disclaimer] Failed to get disclaimer version:",
        error?.message || "No data returned"
      );
      return this.getFallbackVersion();
    }

    return data;
  }

  /**
   * Get user's acknowledgment history
   */
  async getUserAcknowledgmentHistory(userId: string) {
    if (!this.supabaseReady || !this.supabase) {
      console.warn("[disclaimer] Supabase not ready, skipping history");
      return [];
    }

    const { data, error } = await this.supabase
      .from("user_disclaimer_acknowledgments")
      .select("*")
      .eq("user_id", userId)
      .order("acknowledged_at", { ascending: false });

    if (error) {
      throw new Error(
        `Failed to get acknowledgment history: ${error.message}`
      );
    }

    return data;
  }

  /**
   * Get user's recent assessment views
   */
  async getUserRecentViews(userId: string, hours: number = 24) {
    if (!this.supabaseReady || !this.supabase) {
      console.warn("[disclaimer] Supabase not ready, skipping recent views");
      return [];
    }

    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    const { data, error } = await this.supabase
      .from("user_assessment_views")
      .select("*")
      .eq("user_id", userId)
      .gte("viewed_at", cutoffTime.toISOString())
      .order("viewed_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get recent views: ${error.message}`);
    }

    return data;
  }

  /**
   * Combined operation: Check, record view, and return disclaimer state
   */
  async getDisclaimerState(userId: string, assessmentType: AssessmentType) {
    // Record the view (non-blocking)
    await this.recordAssessmentView(userId, assessmentType);

    // Check if acknowledgment required
    const checkResult = await this.checkAcknowledgmentRequired(userId);

    // Get active version content
    const version = await this.getActiveDisclaimerVersion();

    return {
      requiresAcknowledgment: checkResult.required,
      trigger: checkResult.reason as AcknowledgmentTrigger,
      version: version.version,
      content: version.content,
      methodologyContent: version.methodology_content,
      lastAcknowledgment: checkResult.last_acknowledgment,
    };
  }
}

/**
 * Helper to get trigger display message
 */
export function getTriggerMessage(trigger: AcknowledgmentTrigger): string {
  switch (trigger) {
    case "initial":
      return "Please acknowledge the disclaimer to continue.";
    case "90_day_expiry":
      return "It's been 90 days since your last acknowledgment. Please review and acknowledge again.";
    case "10_view_threshold":
      return "You've viewed 10+ assessments in the last 24 hours. Please re-acknowledge the disclaimer.";
    case "version_update":
      return "The disclaimer has been updated. Please review and acknowledge the new version.";
    default:
      return "Please acknowledge the disclaimer to continue.";
  }
}
