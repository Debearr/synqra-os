import { expect, test } from "@playwright/test";

test.describe("route access guard", () => {
  test("homepage and enter are publicly reachable", async ({ request }) => {
    const home = await request.get("/", { maxRedirects: 0 });
    const enter = await request.get("/enter", { maxRedirects: 0 });

    expect(home.status()).toBe(200);
    expect(enter.status()).toBe(200);
  });

  test("journey is protected for unauthenticated users", async ({ request, baseURL }) => {
    const response = await request.get("/journey", { maxRedirects: 0 });
    expect([307, 308]).toContain(response.status());

    const location = response.headers()["location"];
    expect(location).toBeTruthy();

    const resolvedBase = baseURL ?? "http://127.0.0.1";
    const destination = new URL(location!, resolvedBase);
    expect(destination.pathname).toBe("/auth/sign-in");
    expect(destination.searchParams.get("next")).toBe("/journey");
  });

  test("studio is protected for unauthenticated users", async ({ request, baseURL }) => {
    const response = await request.get("/studio", { maxRedirects: 0 });
    expect([307, 308]).toContain(response.status());

    const location = response.headers()["location"];
    expect(location).toBeTruthy();

    const resolvedBase = baseURL ?? "http://127.0.0.1";
    const destination = new URL(location!, resolvedBase);
    expect(destination.pathname).toBe("/auth/sign-in");
    expect(destination.searchParams.get("next")).toBe("/studio");
  });

  test("admin is protected for unauthenticated users", async ({ request, baseURL }) => {
    const response = await request.get("/admin", { maxRedirects: 0 });
    expect([307, 308]).toContain(response.status());

    const location = response.headers()["location"];
    expect(location).toBeTruthy();

    const resolvedBase = baseURL ?? "http://127.0.0.1";
    const destination = new URL(location!, resolvedBase);
    expect(destination.pathname).toBe("/auth/sign-in");
    expect(destination.searchParams.get("next")).toBe("/admin");
  });
});
