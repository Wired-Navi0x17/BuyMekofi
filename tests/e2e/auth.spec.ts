import { expect, test } from "@playwright/test";
import { createTestUser, deleteTestUser, type TestUser } from "../integration/helpers";
import { randomUUID } from "node:crypto";
import { admin } from "../integration/helpers";

test.use({ reducedMotion: "reduce" });

test("protected pages send signed-out visitors to log in, keeping the return path", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
});

test("login rejects a wrong password without saying which part was wrong", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@example.test");
  await page.getByLabel("Password", { exact: true }).fill("definitely-wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "That email and password don't match an account." }),
  ).toBeVisible();
});

test("register asks for a username first, then account details", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByText("Choose a username for your page.")).toBeVisible();
  await page.getByLabel("Username").fill("admin");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("That name is reserved. Try another.")).toBeVisible();
  const name = `e2e_${Date.now().toString(36)}`;
  await page.getByLabel("Username").fill(name);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText(`coffeaetthea.in/${name}`)).toBeVisible();
  await page.getByRole("button", { name: "Change" }).click();
  await expect(page.getByLabel("Username")).toBeVisible();
});

test("register validates email and password length on the server", async ({ page }) => {
  await page.goto(`/register?username=e2e_${Date.now().toString(36)}`);
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText("Use at least 10 characters.")).toBeVisible();
});

test("forgot password gives the same answer for any address", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(`unknown-${randomUUID().slice(0, 6)}@example.test`);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText("If there is an account for");
});

test("auth callback without a valid code goes back to login with a notice", async ({ page }) => {
  await page.goto("/auth/callback?code=bogus&next=https://evil.example");
  await expect(page).toHaveURL(/\/login\?error=link$/);
  await expect(
    page.getByRole("alert").filter({ hasText: "expired or was already used" }),
  ).toBeVisible();
});

test.describe("signed-in journey", () => {
  let user: TestUser;
  let password: string;

  test.beforeAll(async () => {
    user = await createTestUser("e2e");
    password = `pw-${randomUUID()}`;
    await admin().auth.admin.updateUserById(user.id, { password });
  });
  test.afterAll(async () => deleteTestUser(user));

  test("log in, land on the requested page, log out", async ({ page }) => {
    await page.goto("/login?next=%2Fdashboard");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    // No page yet, so the dashboard hands them to setup.
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(page.getByRole("heading", { name: "Set up your page" })).toBeVisible();

    // Signed-in users skip the guest-only pages.
    await page.goto("/login");
    await expect(page).toHaveURL(/\/onboarding$/);

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
