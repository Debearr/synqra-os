import { expect, test } from "@playwright/test";
import { signInWithEmail } from "../auth/helpers/browser";
import { createSubscriberUser, deleteUserById, type ProvisionedUser } from "../auth/helpers/supabase";

function buildStudioSuccessResponse(requestId: string) {
  return {
    draft:
      "Serious sellers in River North are responding to pricing discipline, clean presentation, and timing that matches real buyer demand. If you want a current read on what is moving and where leverage is shifting, I can walk you through the comps this week.",
    next_actions: ["Use this as the opening note for a serious seller conversation."],
    notes: "Concise and trust-first.",
    compliance: { status: "ok" },
    replies: [],
    comments: [],
    follow_up: null,
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    tier: "default",
    metadata: { requestId, risk: "BASELINE" },
  };
}

async function signInToPath(page: Parameters<typeof signInWithEmail>[0], user: ProvisionedUser, nextPath: string) {
  await page.goto(`/auth/sign-in?next=${encodeURIComponent(nextPath)}`);
  await signInWithEmail(page, user.email, user.password);
  await page.waitForURL(new RegExp(`${nextPath.replace("/", "\\/")}(?:\\?|$)`), { timeout: 20000 });
}

async function fillValidStudioBrief(page: Parameters<typeof signInWithEmail>[0]) {
  await page.getByTestId("studio-vertical-realtor").click();
  await page.getByTestId("studio-goal").fill(
    "Write a LinkedIn note that shows local market authority and invites one serious seller conversation."
  );
  await page.getByTestId("studio-platform").selectOption("LinkedIn");
  await page.getByTestId("studio-voice").selectOption("Direct");
}

test.describe("studio regression guard", () => {
  let user: ProvisionedUser;

  test.beforeEach(async () => {
    user = await createSubscriberUser();
  });

  test.afterEach(async () => {
    await deleteUserById(user.userId);
  });

  test("dashboard entry starts with choose realtor or travel advisor", async ({ page }) => {
    await signInToPath(page, user, "/dashboard");

    await expect(page.getByTestId("dashboard-open-studio")).toBeVisible();
    await expect(page.getByText(/choose realtor or travel advisor, pick one surface, and generate one clean draft/i)).toBeVisible();
  });

  test("missing vertical guidance appears before create and no dispatch occurs", async ({ page }) => {
    let councilRequestCount = 0;
    await page.route("**/api/council", async (route) => {
      councilRequestCount += 1;
      await route.abort();
    });

    await signInToPath(page, user, "/studio");
    await page.getByTestId("studio-create").click();

    await expect(page.getByText("Select a vertical before creating a draft.")).toBeVisible();
    expect(councilRequestCount).toBe(0);
  });

  test("duplicate fast clicks do not create duplicate submissions", async ({ page }) => {
    let councilRequestCount = 0;
    await page.route("**/api/council", async (route) => {
      councilRequestCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(buildStudioSuccessResponse("studio-regression-double")),
      });
    });

    await signInToPath(page, user, "/studio");
    await fillValidStudioBrief(page);

    const createButton = page.getByTestId("studio-create");
    await createButton.click();
    await createButton.click({ timeout: 500 }).catch(() => {});

    await expect(page.getByTestId("studio-success-state")).toBeVisible({ timeout: 10000 });
    expect(councilRequestCount).toBe(1);
  });

  test("provider 503 shows the calm truthful Studio message", async ({ page }) => {
    let councilRequestCount = 0;
    await page.route("**/api/council", async (route) => {
      councilRequestCount += 1;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Creation provider unavailable",
          message: "This operation was aborted",
        }),
      });
    });

    await signInToPath(page, user, "/studio");
    await fillValidStudioBrief(page);
    await page.getByTestId("studio-create").click();

    await expect(page.getByTestId("studio-failure-state")).toContainText(
      "Synqra could not complete this draft cleanly right now. Please try again in a moment."
    );
    expect(councilRequestCount).toBe(2);
  });

  test("copy draft shows visible fallback feedback when clipboard fails", async ({ page }) => {
    await page.route("**/api/council", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(buildStudioSuccessResponse("studio-regression-copy")),
      });
    });

    await signInToPath(page, user, "/studio");
    await fillValidStudioBrief(page);
    await page.getByTestId("studio-create").click();
    await expect(page.getByTestId("studio-success-state")).toBeVisible({ timeout: 10000 });

    await page.evaluate(() => {
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async () => {
            throw new Error("clipboard denied");
          },
        },
      });
    });

    const copyButton = page.getByRole("button", { name: /Copy/ });
    await copyButton.click();
    await expect(copyButton).toHaveText("Copy unavailable");
  });
});
