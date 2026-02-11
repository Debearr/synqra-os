import { expect, test } from "@playwright/test";

test.describe("homepage routing", () => {
  test("visiting / redirects to /enter with 307 or 308", async ({ request, baseURL }) => {
    const response = await request.get("/", { maxRedirects: 0 });

    expect([307, 308]).toContain(response.status());

    const locationHeader = response.headers()["location"];
    expect(locationHeader).toBeTruthy();

    const resolvedBaseUrl = baseURL ?? "http://127.0.0.1";
    const destinationPath = new URL(locationHeader!, resolvedBaseUrl).pathname;
    expect(destinationPath).toBe("/enter");
  });

  test("visiting /enter returns 200", async ({ request }) => {
    const response = await request.get("/enter", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  });

  test("visiting /demo returns 200", async ({ request }) => {
    const response = await request.get("/demo", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  });
});
