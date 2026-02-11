/**
 * Agent Audit Log Query API
 * ADMIN ONLY - For human review and debugging
 * 
 * CRITICAL: This endpoint must be protected with admin authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { TraceabilityService } from "../traceability-service";
import type { AuditLogFilters } from "../types";

/**
 * Query agent audit logs
 * GET /api/aura-fx/agent-traceability/audit
 * 
 * Query params:
 * - assessment_id: Filter by assessment ID
 * - agent_name: Filter by agent name
 * - date_from: Filter by date range (ISO 8601)
 * - date_to: Filter by date range (ISO 8601)
 * - limit: Max records to return (default 100)
 */
export async function GET(req: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // if (!isAdmin(req)) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    // }

    const url = new URL(req.url);
    const filters: AuditLogFilters = {
      assessment_id: url.searchParams.get("assessment_id") || undefined,
      agent_name: url.searchParams.get("agent_name") || undefined,
      date_from: url.searchParams.get("date_from") || undefined,
      date_to: url.searchParams.get("date_to") || undefined,
      limit: parseInt(url.searchParams.get("limit") || "100"),
    };

    const service = new TraceabilityService();
    const result = await service.queryAuditLogs(filters);

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        audit_only: true,
        warning: "This data is for human review only - do not use in decision logic",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to query audit logs", detail: message },
      { status: 500 }
    );
  }
}

/**
 * Get reasoning snapshot
 * GET /api/aura-fx/agent-traceability/audit/reasoning/:snapshotId
 */
export async function POST(req: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // if (!isAdmin(req)) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    // }

    const body = await req.json();
    const { snapshot_id } = body;

    if (!snapshot_id) {
      return NextResponse.json(
        { error: "snapshot_id is required" },
        { status: 400 }
      );
    }

    const service = new TraceabilityService();
    const snapshot = await service.getReasoningSnapshot(snapshot_id);

    if (!snapshot) {
      return NextResponse.json(
        { error: "Reasoning snapshot not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: snapshot,
      meta: {
        audit_only: true,
        warning: "This data is for human review only - do not use in decision logic",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to get reasoning snapshot", detail: message },
      { status: 500 }
    );
  }
}
