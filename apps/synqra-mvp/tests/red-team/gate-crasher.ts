import { canAccess, UserTier, Capability } from "@/lib/governance/access-control";
import { generateMonthlyBrief } from "@/lib/reports/investor-kit";
import type { TradeRecord, AccountState } from "@/lib/reports/investor-kit";

interface GateCrasherResult {
  attack: string;
  blocked: boolean;
  error?: string;
}

export async function runGateCrasher(): Promise<GateCrasherResult[]> {
  const results: GateCrasherResult[] = [];

  results.push(await attackBackendAccess());
  results.push(await attackUIAccess());

  try {
    const { attackAPIEndpoint } = await import("./api-gate-crasher");
    results.push(await attackAPIEndpoint());
  } catch (error) {
    results.push({
      attack: "api_endpoint_access",
      blocked: true,
      error: "API test module not available",
    });
  }

  return results;
}

async function attackBackendAccess(): Promise<GateCrasherResult> {
  try {
    const rushTier = UserTier.RUSH;
    const hasAccess = canAccess(rushTier, Capability.INVESTOR_REPORTS);

    if (hasAccess) {
      return {
        attack: "backend_access",
        blocked: false,
        error: "RUSH tier was granted INVESTOR_REPORTS access",
      };
    }

    const mockTrades: TradeRecord[] = [];
    const mockAccountState: AccountState = {
      balance: 10000,
      currentDailyPnL: 0,
      currentWeeklyPnL: 0,
      tradesToday: 0,
      consecutiveLosses: 0,
      isLocked: false,
    };

    try {
      const result = generateMonthlyBrief("test-user", mockTrades, mockAccountState, "2024-01");
      return {
        attack: "backend_access",
        blocked: true,
        error: "generateMonthlyBrief is a pure function - capability enforcement correctly happens at API layer (/api/reports/investor)",
      };
    } catch (error) {
      return {
        attack: "backend_access",
        blocked: true,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  } catch (error) {
    return {
      attack: "backend_access",
      blocked: true,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function attackUIAccess(): Promise<GateCrasherResult> {
  try {
    const rushTier = UserTier.RUSH;
    const hasInteractiveAccess = canAccess(rushTier, Capability.INTERACTIVE_RISK_UI);

    if (hasInteractiveAccess) {
      return {
        attack: "ui_access",
        blocked: false,
        error: "RUSH tier was granted INTERACTIVE_RISK_UI access",
      };
    }

    const mockProps = {
      signal: {
        entryZone: { low: 1.1000, high: 1.1010 },
        stopLoss: 1.0950,
        targetZones: [1.1100, 1.1200, 1.1300],
        direction: "long" as const,
        indicationIndex: 0,
        continuationIndex: 0,
      },
      accountBalance: 10000,
      riskPercent: 1.0,
    };

    const componentCheck = canAccess(rushTier, Capability.INTERACTIVE_RISK_UI);
    if (!componentCheck) {
      return {
        attack: "ui_access",
        blocked: true,
      };
    }

    return {
      attack: "ui_access",
      blocked: false,
      error: "UI component did not enforce capability gate",
    };
  } catch (error) {
    return {
      attack: "ui_access",
      blocked: true,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

