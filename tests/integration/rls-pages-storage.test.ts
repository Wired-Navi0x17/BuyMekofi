import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  admin,
  anon,
  createTestUser,
  deleteTestUser,
  uniqueUsername,
  type TestUser,
} from "./helpers";

let a: TestUser;
let b: TestUser;
const png = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82,
]);
const doc = {
  version: 1,
  template: "cafe",
  theme: { preset: "newsprint" },
  blocks: [{ id: "support", type: "support" }],
};

beforeAll(async () => {
  a = await createTestUser("pa");
  b = await createTestUser("pb");
  for (const u of [a, b]) {
    const { error } = await u.client
      .from("creator_profiles")
      .insert({ user_id: u.id, username: uniqueUsername("it"), display_name: "Test" });
    if (error) throw error;
  }
});

afterAll(async () => {
  for (const u of [a, b]) {
    if (!u) continue;
    const { data } = await admin().storage.from("avatars").list(u.id);
    if (data?.length)
      await admin()
        .storage.from("avatars")
        .remove(data.map((f) => `${u.id}/${f.name}`));
    await deleteTestUser(u);
  }
});

describe("profile_links", () => {
  it("owner can add links; others cannot add to someone else", async () => {
    const own = await a.client
      .from("profile_links")
      .insert({ creator_id: a.id, platform: "website", url: "https://example.com", position: 0 });
    expect(own.error).toBeNull();
    const other = await b.client
      .from("profile_links")
      .insert({ creator_id: a.id, platform: "website", url: "https://evil.example", position: 1 });
    expect(other.error?.code).toBe("42501");
  });

  it("rejects non-https links at the database", async () => {
    const { error } = await a.client
      .from("profile_links")
      .insert({ creator_id: a.id, platform: "other", url: "javascript:alert(1)", position: 2 });
    expect(error?.code).toBe("23514");
  });

  it("links of an unpublished profile are invisible to the public", async () => {
    const { data } = await anon().from("profile_links").select("url").eq("creator_id", a.id);
    expect(data).toEqual([]);
  });
});

describe("page drafts and documents", () => {
  it("owner saves a draft; nobody else can read or edit it", async () => {
    const created = await a.client
      .from("page_drafts")
      .insert({ creator_id: a.id, schema_version: 2, draft: doc });
    expect(created.error).toBeNull();
    expect(
      (await b.client.from("page_drafts").select("draft").eq("creator_id", a.id)).data,
    ).toEqual([]);
    expect(
      (await anon().from("page_drafts").select("draft").eq("creator_id", a.id)).data ?? [],
    ).toEqual([]);
    const { data } = await b.client
      .from("page_drafts")
      .update({ draft: { hijacked: true } })
      .eq("creator_id", a.id)
      .select();
    expect(data ?? []).toEqual([]);
  });

  it("a published page never exposes its draft (security review 2026-11-08)", async () => {
    await admin()
      .from("creator_profiles")
      .update({ published_at: new Date().toISOString() })
      .eq("user_id", a.id);
    await admin()
      .from("page_documents")
      .upsert({ creator_id: a.id, schema_version: 2, published: doc });
    await a.client
      .from("page_drafts")
      .update({ draft: { ...doc, secret: "unpublished" } })
      .eq("creator_id", a.id);
    const pub = await anon().from("page_documents").select("*").eq("creator_id", a.id).single();
    expect(pub.data).not.toBeNull();
    expect(JSON.stringify(pub.data)).not.toContain("unpublished");
    expect(Object.keys(pub.data ?? {})).not.toContain("draft");
    const draftAsAnon = await anon().from("page_drafts").select("draft").eq("creator_id", a.id);
    expect(draftAsAnon.data ?? []).toEqual([]);
  });

  it("clients cannot write the public document or versions", async () => {
    const pub = await a.client
      .from("page_documents")
      .upsert({ creator_id: a.id, schema_version: 2, published: doc });
    expect(pub.error?.code).toBe("42501");
    const ver = await a.client
      .from("page_versions")
      .insert({ creator_id: a.id, schema_version: 2, document: doc });
    expect(ver.error?.code).toBe("42501");
  });
});

describe("avatar storage", () => {
  it("a user can upload into their own folder", async () => {
    const { error } = await a.client.storage
      .from("avatars")
      .upload(`${a.id}/test.png`, png, { contentType: "image/png" });
    expect(error).toBeNull();
  });

  it("a user cannot upload into someone else's folder", async () => {
    const { error } = await b.client.storage
      .from("avatars")
      .upload(`${a.id}/planted.png`, png, { contentType: "image/png" });
    expect(error).not.toBeNull();
  });

  it("anonymous visitors cannot upload", async () => {
    const { error } = await anon()
      .storage.from("avatars")
      .upload(`${a.id}/anon.png`, png, { contentType: "image/png" });
    expect(error).not.toBeNull();
  });

  it("the bucket refuses types outside its allowlist", async () => {
    const { error } = await a.client.storage
      .from("avatars")
      .upload(`${a.id}/x.svg`, new TextEncoder().encode("<svg/>"), {
        contentType: "image/svg+xml",
      });
    expect(error).not.toBeNull();
  });
});

describe("image paths", () => {
  it("clients cannot write avatar or cover paths directly", async () => {
    const avatar = await a.client
      .from("creator_profiles")
      .update({ avatar_path: `${b.id}/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.png` })
      .eq("user_id", a.id);
    expect(avatar.error?.code).toBe("42501");
    const cover = await a.client
      .from("creator_profiles")
      .update({ cover_path: "../avatars/x.png" })
      .eq("user_id", a.id);
    expect(cover.error?.code).toBe("42501");
  });

  it("the database refuses badly shaped paths even from the service role", async () => {
    const { error } = await admin()
      .from("creator_profiles")
      .update({ avatar_path: `${b.id}/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.png` })
      .eq("user_id", a.id);
    expect(error?.code).toBe("23514");
  });
});

describe("page-media storage", () => {
  it("owner uploads into their own folder; others and anon cannot", async () => {
    const own = await a.client.storage
      .from("page-media")
      .upload(`${a.id}/g.png`, png, { contentType: "image/png" });
    expect(own.error).toBeNull();
    const other = await b.client.storage
      .from("page-media")
      .upload(`${a.id}/planted.png`, png, { contentType: "image/png" });
    expect(other.error).not.toBeNull();
    const anonUpload = await anon()
      .storage.from("page-media")
      .upload(`${a.id}/anon.png`, png, { contentType: "image/png" });
    expect(anonUpload.error).not.toBeNull();
    await admin()
      .storage.from("page-media")
      .remove([`${a.id}/g.png`]);
  });
});
