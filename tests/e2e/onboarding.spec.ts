import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { admin, createTestUser, deleteTestUser, type TestUser } from "../integration/helpers";

test.use({ reducedMotion: "reduce" });
// One shared account: the journey is sequential.
test.describe.configure({ mode: "serial" });

// A real 1x1 PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

let user: TestUser;
let password: string;
const username = `e2e_${randomUUID().replaceAll("-", "").slice(0, 10)}`;

test.beforeAll(async () => {
  user = await createTestUser("onb");
  password = `pw-${randomUUID()}`;
  await admin().auth.admin.updateUserById(user.id, {
    password,
    user_metadata: { pending_username: username },
  });
});

test.afterAll(async () => {
  for (const bucket of ["avatars", "covers", "page-media"]) {
    const { data } = await admin().storage.from(bucket).list(user.id);
    if (data?.length)
      await admin()
        .storage.from(bucket)
        .remove(data.map((f) => `${user.id}/${f.name}`));
  }
  await deleteTestUser(user);
});

test("a new creator goes from login to a live public page", async ({ page, browser, isMobile }) => {
  test.skip(isMobile, "one run of the journey is enough; it creates real records");
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();

  // Not set up yet: the dashboard sends them to setup, with the claimed name prefilled.
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole("heading", { name: "Set up your page" })).toBeVisible();
  await expect(page.getByLabel("Page address")).toHaveValue(username);

  await page
    .getByLabel(/^Photo/)
    .setInputFiles({ name: "me.png", mimeType: "image/png", buffer: PNG });
  await page.getByLabel("Name on your page").fill("Test Creator");
  await page.getByLabel(/About you/).fill("I draw comics about trains.");
  await page.getByLabel("Link 1 type").selectOption("website");
  await page.getByLabel("Link 1 address").fill("example.com/portfolio");
  await page.getByRole("button", { name: "Publish my page" }).click();

  await expect(page).toHaveURL(new RegExp(`/${username}$`));
  await expect(page.getByRole("heading", { level: 1, name: "Test Creator" })).toBeVisible();
  await expect(page.getByText("I draw comics about trains.")).toBeVisible();
  await expect(page.getByRole("link", { name: /Website/ })).toHaveAttribute(
    "href",
    "https://example.com/portfolio",
  );
  await expect(page.getByRole("img", { name: "Test Creator" })).toBeVisible();
  // The support panel is honest about payments not being open.
  await expect(page.getByText("Contributions aren't open yet.")).toBeVisible();

  // A signed-out visitor sees the same page.
  const visitor = await browser.newContext({ reducedMotion: "reduce" });
  const v = await visitor.newPage();
  await v.goto(`/${username}`);
  await expect(v.getByRole("heading", { level: 1, name: "Test Creator" })).toBeVisible();
  await visitor.close();

  // Back on the dashboard: live, with links to view and edit.
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Your page is live." })).toBeVisible();
  await page.getByRole("link", { name: "Edit details" }).click();
  await expect(page.getByRole("heading", { name: "Edit your page" })).toBeVisible();
});

test("unknown and malformed usernames are a 404", async ({ page }) => {
  for (const path of [`/nobody_${randomUUID().slice(0, 8)}`, "/Bad..Name", "/coffea"]) {
    const res = await page.request.get(path);
    expect(res.status(), path).toBe(404);
  }
});

test("Studio: restyle, add blocks, publish, and the public page updates", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "runs once, on desktop; it edits the shared test account");
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("link", { name: "Design your page" }).click();
  await expect(page).toHaveURL(/\/dashboard\/studio$/);

  await page.getByRole("button", { name: /Ink night/ }).click();
  await page.getByRole("button", { name: "+ Quote" }).click();
  await page.getByLabel("Quote", { exact: true }).fill("Every tram has a story.");
  await page.getByLabel("Effect").selectOption("pulse");
  await page.getByRole("button", { name: "+ Gallery" }).click();
  await page
    .locator('input[type="file"]')
    .last()
    .setInputFiles({ name: "panel.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByLabel("Description of image 1")).toBeVisible();
  await page.getByLabel("Description of image 1").fill("A tram panel");
  await expect(page.getByRole("status").filter({ hasText: "Draft saved" })).toBeVisible();

  // Drafts are private until published.
  const before = await page.request.get(`/${username}`);
  expect(await before.text()).not.toContain("Every tram has a story.");

  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText(/^Published\./)).toBeVisible();

  await page.goto(`/${username}`);
  await expect(page.getByText("Every tram has a story.")).toBeVisible();
  await expect(page.getByRole("img", { name: "A tram panel" })).toBeVisible();
  const bg = await page
    .locator("main")
    .evaluate((el) => getComputedStyle(el.parentElement!).backgroundColor);
  expect(bg).toBe("rgb(20, 19, 17)"); // Ink night #141311
});
