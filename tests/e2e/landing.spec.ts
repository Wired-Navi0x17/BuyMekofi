import { expect, test } from "@playwright/test";

test.describe("landing intro", () => {
  test("writes the wordmark on a sheet, and Skip burns it away", async ({ page }) => {
    await page.goto("/");
    const overlay = page.locator(".burn-overlay");
    await expect(overlay).toBeVisible();
    await expect(overlay.getByRole("img", { name: "Coffea et Thea" })).toBeVisible();
    await expect(overlay).toHaveAttribute("data-ready", "true");
    await page.getByRole("button", { name: "Skip intro" }).click();
    await expect(overlay).toHaveCount(0, { timeout: 5_000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("scrolling through the intro removes the sheet", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".burn-overlay")).toHaveAttribute("data-ready", "true");
    await page.mouse.wheel(0, 2_500);
    await expect(page.locator(".burn-overlay")).toHaveCount(0, { timeout: 5_000 });
  });

  test("returning visitors skip the intro", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("coffea.intro.seen", "1"));
    await page.reload();
    await expect(page.locator(".burn-overlay")).toHaveCount(0);
    await expect(page.locator(".intro-spacer")).toHaveAttribute("data-intro", "off");
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("shows the page immediately with no intro", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".burn-overlay")).toBeHidden();
    await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
  });
});

test.describe("landing content", () => {
  test.use({ reducedMotion: "reduce" });

  test("pricing states the real policy and a correct worked example", async ({ page }) => {
    await page.goto("/#pricing");
    const pricing = page.locator("#pricing");
    await expect(pricing.getByRole("row", { name: /after that/ })).toContainText("5%");
    await expect(pricing).toContainText("₹500.00");
    await expect(pricing).toContainText("−₹25.00");
    await expect(pricing).toContainText("₹475.00");
  });

  test("has no horizontal scroll", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("header links reach the real auth pages", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create your page" })).toBeVisible();
  });
});
