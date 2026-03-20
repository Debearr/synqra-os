import { expect, type BrowserContext, type Page } from "@playwright/test";

export async function signInWithEmail(page: Page, email: string, password: string) {
  await page.getByTestId("auth-sign-in-email").fill(email);
  await page.getByTestId("auth-sign-in-password").fill(password);
  await page.getByTestId("auth-sign-in-submit").click();
}

export async function signUpWithEmail(page: Page, email: string, password: string) {
  await page.getByTestId("auth-sign-up-email").fill(email);
  await page.getByTestId("auth-sign-up-password").fill(password);
  await page.getByTestId("auth-sign-up-submit").click();
}

export async function expectSupabaseAuthCookie(context: BrowserContext) {
  await expect
    .poll(async () => {
      const cookies = await context.cookies();
      return cookies.some((cookie) => /^sb-.*auth-token/.test(cookie.name) && cookie.value.trim().length > 0);
    })
    .toBeTruthy();
}
