import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { admin, createTestUser, deleteTestUser, type TestUser } from "../integration/helpers";

test.use({ reducedMotion: "reduce" });
test.describe.configure({ mode: "serial" });

let boss: TestUser;
let creator: TestUser;
const pw = { boss: `pw-${randomUUID()}`, creator: `pw-${randomUUID()}` };
const creatorName = `e2e_${randomUUID().replaceAll("-", "").slice(0, 10)}`;
const doc = {
  version: 2,
  template: "cafe",
  theme: {
    palette: "newsprint",
    fonts: { display: "dela_gothic", body: "geist", accent: "cutive_mono" },
    border: { width: 3, style: "solid" },
    radius: 0,
    shadow: "hard",
    imageShape: "square",
    background: "plain",
    coverPath: null,
  },
  blocks: [{ id: "support", type: "support" }],
};

test.beforeAll(async () => {
  boss = await createTestUser("adm");
  creator = await createTestUser("crt");
  await admin().auth.admin.updateUserById(boss.id, { password: pw.boss });
  await admin().auth.admin.updateUserById(creator.id, { password: pw.creator });
  await admin().from("user_roles").insert({ user_id: boss.id, role: "admin" });
  const now = new Date().toISOString();
  await admin()
    .from("creator_profiles")
    .insert({ user_id: creator.id, username: creatorName, display_name: "Suspend Me" });
  await admin()
    .from("creator_profiles")
    .update({ published_at: now, onboarding_completed_at: now })
    .eq("user_id", creator.id);
  await admin()
    .from("page_drafts")
    .insert({ creator_id: creator.id, schema_version: 2, draft: doc });
  await admin()
    .from("page_documents")
    .insert({ creator_id: creator.id, schema_version: 2, published: doc, published_at: now });
});

test.afterAll(async () => {
  await deleteTestUser(boss);
  await deleteTestUser(creator);
});

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/(dashboard|onboarding)$/);
}

test("the admin area is a 404 for visitors and for creators", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop only");
  for (const path of ["/admin", "/admin/creators", "/admin/content/landing.faq"]) {
    expect((await page.request.get(path)).status(), path).toBe(404);
  }
  await login(page, creator.email, pw.creator);
  for (const path of ["/admin", "/admin/audit"]) {
    expect((await page.request.get(path)).status(), `creator ${path}`).toBe(404);
  }
});

test("an admin publishes an announcement, and it appears on the homepage", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "desktop only");
  const text = `E2E notice ${randomUUID().slice(0, 6)}`;
  await login(page, boss.email, pw.boss);
  await page.goto("/admin/content/site.announcement");
  await page.getByLabel("Show the announcement bar").check();
  await page.getByLabel("Text").fill(text);
  await page.getByRole("button", { name: "Save and publish" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Published." })).toBeVisible();

  await page.goto("/?nointro");
  await expect(page.getByText(text)).toBeVisible();

  // Turn it off again so the shared dev site is left as it was.
  await page.goto("/admin/content/site.announcement");
  await page.getByLabel("Show the announcement bar").uncheck();
  await page.getByRole("button", { name: "Save and publish" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Published." })).toBeVisible();
  await page.goto("/?nointro");
  await expect(page.getByText(text)).toHaveCount(0);

  // Both publishes are in the audit log.
  await page.goto("/admin/audit");
  await expect(page.getByRole("cell", { name: "content.publish" }).first()).toBeVisible();
});

test("suspending a creator hides their page; reinstating brings it back", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "desktop only");
  expect((await page.request.get(`/${creatorName}`)).status()).toBe(200);
  await login(page, boss.email, pw.boss);
  await page.goto(`/admin/creators?q=${creatorName}`);
  await page.getByRole("button", { name: "Suspend…" }).click();
  await page.getByLabel("Reason (kept in the audit log)").fill("E2E test suspension");
  await page.getByRole("button", { name: `Suspend @${creatorName}` }).click();
  await expect(page.getByText("E2E test suspension")).toBeVisible();
  expect((await page.request.get(`/${creatorName}`)).status()).toBe(404);

  await page.getByRole("button", { name: `Reinstate @${creatorName}` }).click();
  await expect(page.getByRole("button", { name: "Suspend…" })).toBeVisible();
  expect((await page.request.get(`/${creatorName}`)).status()).toBe(200);
});
