import { test, expect } from "@playwright/test";

test.describe("critical smoke", () => {
  test("home loads in Hebrew RTL", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "he");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByText("Polymarket Edge Lab").first()).toBeVisible();
  });

  test("markets page opens", async ({ page }) => {
    await page.goto("/markets");
    await expect(page.getByRole("heading", { name: "שווקים" })).toBeVisible();
  });

  test("health endpoint", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json).toHaveProperty("status");
    expect(json).toHaveProperty("polymarket");
    expect(json).not.toHaveProperty("SUPABASE_SERVICE_ROLE_KEY");
  });

  test("no horizontal overflow at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("legal disclaimer page", async ({ page }) => {
    await page.goto("/disclaimer");
    await expect(page.getByText(/מידע וניתוח בלבד/i).first()).toBeVisible();
  });
});
