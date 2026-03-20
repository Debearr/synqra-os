import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium, expect, test } from "@playwright/test";
import { expectSupabaseAuthCookie, signInWithEmail, signUpWithEmail } from "./helpers/browser";
import {
  confirmAndPromoteUserByEmail,
  createSubscriberUser,
  deleteUserById,
  deleteUsersByEmail,
  findAuthUsersByEmail,
  loadAuthQaEnv,
  uniqueTestEmail,
  uniqueTestPassword,
  waitForAuthUserByEmail,
} from "./helpers/supabase";

const env = loadAuthQaEnv();

test.describe("auth QA harness", () => {
  test("email sign-up creates a Supabase user and can be completed into dashboard access", async ({ page, context }) => {
    test.setTimeout(60000);
    const email = uniqueTestEmail("auth-signup");
    const password = uniqueTestPassword();

    try {
      await page.goto("/auth/sign-up?next=/dashboard");
      await signUpWithEmail(page, email, password);

      const signUpError = page.getByTestId("auth-sign-up-error");
      const signUpNotice = page.getByTestId("auth-sign-up-notice");
      await expect(signUpError.or(signUpNotice)).toBeVisible();
      if ((await signUpError.isVisible().catch(() => false)) === true) {
        await expect(signUpError).toContainText(/rate limit exceeded/i);
        test.skip(true, "Supabase email sign-up is currently rate-limited for this project.");
      }

      const createdUser = await waitForAuthUserByEmail(email);
      await confirmAndPromoteUserByEmail(email);

      if (!/\/dashboard(?:\?|$)/.test(page.url())) {
        await expect(signUpNotice).toBeVisible();
        await page.goto(`/auth/sign-in?next=%2Fdashboard&email=${encodeURIComponent(email)}`);
        await signInWithEmail(page, email, password);
      }

      await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
      await expectSupabaseAuthCookie(context);
      await page.goto("/account");
      await expect(page).toHaveURL(/\/account(?:\?|$)/);
      await expect(page.getByTestId("account-email")).toHaveValue(email);

      await deleteUserById(createdUser.id);
    } finally {
      await deleteUsersByEmail(email);
    }
  });

  test("email sign-in honors next redirects, persists across refresh and tab reopen, and logs out cleanly", async ({ page, context }) => {
    const user = await createSubscriberUser();

    try {
      await page.goto("/auth/sign-in?next=%2Fstudio");
      await signInWithEmail(page, user.email, user.password);

      await expect(page).toHaveURL(/\/studio(?:\?|$)/);
      await expect(page.getByTestId("studio-goal")).toBeVisible();
      await expectSupabaseAuthCookie(context);

      await page.reload();
      await expect(page).toHaveURL(/\/studio(?:\?|$)/);
      await expect(page.getByTestId("studio-goal")).toBeVisible();

      await page.close();
      const reopenedPage = await context.newPage();
      await reopenedPage.goto("/dashboard");
      await expect(reopenedPage).toHaveURL(/\/dashboard(?:\?|$)/);
      await expect(reopenedPage.getByTestId("dashboard-open-studio")).toBeVisible();

      await reopenedPage.goto("/account");
      await expect(reopenedPage).toHaveURL(/\/account(?:\?|$)/);
      await expect(reopenedPage.getByTestId("account-email")).toHaveValue(user.email);

      await reopenedPage.getByTestId("account-sign-out").click();
      await expect(reopenedPage).toHaveURL(/\/(?:\?|$)/);

      await reopenedPage.goto("/dashboard");
      await expect(reopenedPage).toHaveURL(/\/auth\/sign-in\?next=%2Fdashboard/);
    } finally {
      await deleteUserById(user.userId);
    }
  });

  test("session survives a full browser relaunch in a normal persistent profile", async () => {
    const user = await createSubscriberUser();
    const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "synqra-auth-qa-"));

    try {
      const firstContext = await chromium.launchPersistentContext(userDataDir, {
        baseURL: env.baseUrl,
        headless: true,
      });
      const firstPage = firstContext.pages()[0] ?? (await firstContext.newPage());

      await firstPage.goto("/auth/sign-in?next=%2Fdashboard");
      await signInWithEmail(firstPage, user.email, user.password);
      await expect(firstPage).toHaveURL(/\/dashboard(?:\?|$)/);
      await expectSupabaseAuthCookie(firstContext);
      await firstContext.close();

      const secondContext = await chromium.launchPersistentContext(userDataDir, {
        baseURL: env.baseUrl,
        headless: true,
      });
      const secondPage = secondContext.pages()[0] ?? (await secondContext.newPage());

      await secondPage.goto("/dashboard");
      await expect(secondPage).toHaveURL(/\/dashboard(?:\?|$)/);
      await expect(secondPage.getByTestId("dashboard-open-studio")).toBeVisible();
      await secondContext.close();
    } finally {
      await deleteUserById(user.userId);
      await fs.rm(userDataDir, { recursive: true, force: true });
    }
  });

  test("invalid password and repeated sign-up attempts stay bounded", async ({ page }) => {
    test.setTimeout(60000);
    const existingUser = await createSubscriberUser();
    const duplicatePassword = uniqueTestPassword();
    const duplicateUser = await createSubscriberUser(uniqueTestEmail("auth-duplicate"), duplicatePassword);

    try {
      await page.goto("/auth/sign-in");
      await signInWithEmail(page, existingUser.email, `${existingUser.password}-wrong`);
      await expect(page.getByTestId("auth-sign-in-error")).toBeVisible();

      await page.goto("/auth/sign-up");
      await signUpWithEmail(page, duplicateUser.email, duplicatePassword);

      const duplicateUsers = await findAuthUsersByEmail(duplicateUser.email);
      expect(duplicateUsers.length).toBe(1);

      const duplicateError = page.getByTestId("auth-sign-up-error");
      const duplicateNotice = page.getByTestId("auth-sign-up-notice");
      await expect(duplicateError.or(duplicateNotice)).toBeVisible();
    } finally {
      await deleteUserById(existingUser.userId);
      await deleteUserById(duplicateUser.userId);
    }
  });
});
