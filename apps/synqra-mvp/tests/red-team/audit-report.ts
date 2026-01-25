import { runGreedBot } from "./greed-bot";
import { runHypeBot } from "./hype-bot";
import { runGateCrasher } from "./gate-crasher";
import * as fs from "fs";
import * as path from "path";

export interface AuditReport {
  verdict: "SOVEREIGN" | "COMPROMISED";
  timestamp: string;
  greed_attacks_blocked: number;
  greed_attacks_total: number;
  hype_phrases_blocked: number;
  hype_phrases_total: number;
  unauthorized_access_blocked: number;
  unauthorized_access_total: number;
  failures: Array<{
    bot: string;
    attack: string;
    reason: string;
  }>;
}

export async function runAudit(): Promise<AuditReport> {
  const failures: Array<{ bot: string; attack: string; reason: string }> = [];

  const greedResults = await runGreedBot();
  const greedBlocked = greedResults.filter((r) => r.blocked).length;
  const greedFailed = greedResults.filter((r) => !r.blocked);

  for (const failure of greedFailed) {
    failures.push({
      bot: "greed-bot",
      attack: failure.attack,
      reason: failure.error || "Attack was not blocked",
    });
  }

  const hypeResults = await runHypeBot();
  const hypeBlocked = hypeResults.filter((r) => r.blocked).length;
  const hypeFailed = hypeResults.filter((r) => !r.blocked);

  for (const failure of hypeFailed) {
    failures.push({
      bot: "hype-bot",
      attack: failure.phrase,
      reason: failure.violation || "Hype phrase was not blocked",
    });
  }

  const gateCrasherResults = await runGateCrasher();
  const gateCrasherBlocked = gateCrasherResults.filter((r) => r.blocked).length;
  const gateCrasherFailed = gateCrasherResults.filter((r) => !r.blocked);

  for (const failure of gateCrasherFailed) {
    failures.push({
      bot: "gate-crasher",
      attack: failure.attack,
      reason: failure.error || "Unauthorized access was not blocked",
    });
  }

  const verdict: "SOVEREIGN" | "COMPROMISED" =
    failures.length === 0 ? "SOVEREIGN" : "COMPROMISED";

  const report: AuditReport = {
    verdict,
    timestamp: new Date().toISOString(),
    greed_attacks_blocked: greedBlocked,
    greed_attacks_total: greedResults.length,
    hype_phrases_blocked: hypeBlocked,
    hype_phrases_total: hypeResults.length,
    unauthorized_access_blocked: gateCrasherBlocked,
    unauthorized_access_total: gateCrasherResults.length,
    failures,
  };

  const reportPath = path.join(process.cwd(), "tests/red-team/audit-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return report;
}

export async function main() {
  try {
    const report = await runAudit();

    console.log("\n=== SOVEREIGN AUDIT REPORT ===");
    console.log(`Verdict: ${report.verdict}`);
    console.log(`Greed Attacks: ${report.greed_attacks_blocked}/${report.greed_attacks_total} blocked`);
    console.log(`Hype Phrases: ${report.hype_phrases_blocked}/${report.hype_phrases_total} blocked`);
    console.log(
      `Unauthorized Access: ${report.unauthorized_access_blocked}/${report.unauthorized_access_total} blocked`
    );

    if (report.failures.length > 0) {
      console.log("\n=== FAILURES ===");
      for (const failure of report.failures) {
        console.log(`[${failure.bot}] ${failure.attack}: ${failure.reason}`);
      }
    }

    if (report.verdict === "COMPROMISED") {
      console.error("\n❌ SYSTEM COMPROMISED - DEPLOYMENT BLOCKED");
      process.exit(1);
    } else {
      console.log("\n✅ SYSTEM SOVEREIGN - DEPLOYMENT APPROVED");
      process.exit(0);
    }
  } catch (error) {
    console.error("Audit execution failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

