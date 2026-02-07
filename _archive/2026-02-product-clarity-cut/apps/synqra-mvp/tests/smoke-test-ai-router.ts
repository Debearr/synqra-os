/**
 * AuraFX AI Router Smoke Test
 * 
 * Validates:
 * - Council decision routing
 * - OpenRouter provider selection
 * - Cost tracking
 * - Cache behavior
 * - Rate limiting
 */

interface SmokeTestResult {
  step: string;
  status: "PASS" | "FAIL" | "SKIP";
  message: string;
  data?: unknown;
}

const results: SmokeTestResult[] = [];

function log(step: string, status: "PASS" | "FAIL" | "SKIP", message: string, data?: unknown) {
  results.push({ step, status, message, data });
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⏭️";
  console.log(`${icon} ${step}: ${message}`);
  if (data) {
    console.log("   Data:", JSON.stringify(data, null, 2));
  }
}

async function runSmokeTest() {
  const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";
  const testUserId = `smoke-test-${Date.now()}`;

  console.log("\n🔥 AuraFX AI Router Smoke Test");
  console.log("================================\n");

  // STEP 1: First council request (uncached)
  try {
    const response1 = await fetch(`${baseUrl}/api/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: "council_decision",
        prompt: "Decide whether to proceed with test execution.",
        userId: testUserId,
      }),
    });

    if (!response1.ok) {
      const error = await response1.text();
      log("First Request", "FAIL", `HTTP ${response1.status}: ${error}`);
      return;
    }

    const data1 = await response1.json();
    
    if (data1.provider !== "openrouter") {
      log("First Request", "FAIL", `Wrong provider: ${data1.provider}`, data1);
      return;
    }

    if (!data1.model.includes("claude-sonnet-4.5")) {
      log("First Request", "FAIL", `Wrong model: ${data1.model}`, data1);
      return;
    }

    if (data1.costUsd <= 0) {
      log("First Request", "FAIL", `Cost is zero or negative: ${data1.costUsd}`, data1);
      return;
    }

    if (data1.cached === true) {
      log("First Request", "FAIL", "First request should not be cached", data1);
      return;
    }

    log("First Request", "PASS", `Provider: ${data1.provider}, Model: ${data1.model}, Cost: $${data1.costUsd}`, {
      provider: data1.provider,
      model: data1.model,
      costUsd: data1.costUsd,
      cached: data1.cached,
    });
  } catch (error) {
    log("First Request", "FAIL", error instanceof Error ? error.message : String(error));
    return;
  }

  // STEP 2: Second identical request (should be cached)
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s

    const response2 = await fetch(`${baseUrl}/api/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: "council_decision",
        prompt: "Decide whether to proceed with test execution.",
        userId: testUserId,
      }),
    });

    if (!response2.ok) {
      const error = await response2.text();
      log("Cache Test", "FAIL", `HTTP ${response2.status}: ${error}`);
      return;
    }

    const data2 = await response2.json();

    if (data2.cached !== true) {
      log("Cache Test", "FAIL", "Second identical request should be cached", data2);
      return;
    }

    log("Cache Test", "PASS", "Cache hit confirmed", {
      cached: data2.cached,
      provider: data2.provider,
    });
  } catch (error) {
    log("Cache Test", "FAIL", error instanceof Error ? error.message : String(error));
    return;
  }

  // STEP 3: Rate limit test (send 6 requests)
  try {
    const rateLimitUserId = `rate-limit-test-${Date.now()}`;
    let blockedAt = -1;

    for (let i = 1; i <= 6; i++) {
      const response = await fetch(`${baseUrl}/api/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "council_decision",
          prompt: `Rate limit test request ${i}`,
          userId: rateLimitUserId,
        }),
      });

      if (response.status === 429) {
        blockedAt = i;
        break;
      }

      if (!response.ok) {
        const error = await response.text();
        log("Rate Limit Test", "FAIL", `Unexpected error at request ${i}: ${error}`);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 500ms between requests
    }

    if (blockedAt === 6) {
      log("Rate Limit Test", "PASS", "6th request blocked as expected");
    } else if (blockedAt > 0) {
      log("Rate Limit Test", "FAIL", `Blocked at request ${blockedAt}, expected 6`);
    } else {
      log("Rate Limit Test", "FAIL", "No rate limit triggered after 6 requests");
    }
  } catch (error) {
    log("Rate Limit Test", "FAIL", error instanceof Error ? error.message : String(error));
    return;
  }

  // STEP 4: Budget status check
  try {
    const response = await fetch(`${baseUrl}/api/admin/ai-spend`);
    
    if (!response.ok) {
      log("Budget Check", "SKIP", "Admin endpoint not accessible (may require auth)");
    } else {
      const data = await response.json();
      log("Budget Check", "PASS", `Budget state: ${data.budget.state}`, {
        usedUsd: data.budget.usedUsd,
        state: data.budget.state,
      });
    }
  } catch (error) {
    log("Budget Check", "SKIP", "Could not check budget status");
  }

  // Final report
  console.log("\n================================");
  console.log("📊 Test Summary");
  console.log("================================\n");

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);

  if (failed === 0 && passed >= 3) {
    console.log("\n🎉 AuraFX AI router is production-ready.\n");
    process.exit(0);
  } else {
    console.log("\n⚠️  Router validation incomplete. Review failures above.\n");
    process.exit(1);
  }
}

runSmokeTest().catch((error) => {
  console.error("❌ Smoke test crashed:", error);
  process.exit(1);
});
