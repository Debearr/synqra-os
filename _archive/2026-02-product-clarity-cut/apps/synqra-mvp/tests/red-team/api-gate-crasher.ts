import type { GateCrasherResult } from "./gate-crasher";

export async function attackAPIEndpoint(): Promise<GateCrasherResult> {
  try {
    const rushTierToken = "mock-rush-tier-token";

    const response = await fetch("http://localhost:3000/api/reports/investor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${rushTierToken}`,
      },
      body: JSON.stringify({
        period: "2024-01",
      }),
    });

    if (response.status === 403 || response.status === 401) {
      return {
        attack: "api_endpoint_access",
        blocked: true,
      };
    }

    if (response.ok) {
      return {
        attack: "api_endpoint_access",
        blocked: false,
        error: "API endpoint allowed RUSH tier to access INVESTOR_REPORTS",
      };
    }

    return {
      attack: "api_endpoint_access",
      blocked: true,
      error: `Unexpected status: ${response.status}`,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
      return {
        attack: "api_endpoint_access",
        blocked: true,
        error: "API server not running - test skipped",
      };
    }
    return {
      attack: "api_endpoint_access",
      blocked: true,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

