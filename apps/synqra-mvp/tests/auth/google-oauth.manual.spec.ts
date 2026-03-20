import { expect, test } from "@playwright/test";
import { expectSupabaseAuthCookie } from "./helpers/browser";

test.use({ headless: false });

const shouldRunManualGoogle = process.env.PW_AUTH_MANUAL_GOOGLE === "1";
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;

test.describe("manual Google OAuth QA", () => {
  test.skip(!shouldRunManualGoogle, "Manual local Google OAuth QA runs only when PW_AUTH_MANUAL_GOOGLE=1.");

  test("owner/admin Google sign-in reaches dashboard and never falls through to apply", async ({ page, context }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/sign-in\?next=%2Fdashboard/);

    await page.getByTestId("auth-google-link").click();
    await page.waitForURL(/(accounts\.google\.com|\/auth\/v1\/authorize)/, { timeout: 30000 });

    test.info().annotations.push({
      type: "manual",
      description: adminEmail
        ? `Complete Google consent manually with ${adminEmail}, then let the test resume on callback.`
        : "Complete Google consent manually with the configured owner/admin Google account, then let the test resume on callback.",
    });

    await page.waitForURL(/\/dashboard(?:\?|$)/, { timeout: 180000 });
    await expect(page.getByText("Welcome back.")).toBeVisible();
    await expect(page.getByTestId("dashboard-open-studio")).toBeVisible();
    await expect(page).not.toHaveURL(/\/apply/);
    await expectSupabaseAuthCookie(context);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin(?:\?|$)/);
  });
});
