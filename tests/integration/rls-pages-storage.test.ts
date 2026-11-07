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

describe("page_documents", () => {
  it("owner creates a draft but cannot publish it directly", async () => {
    const created = await a.client
      .from("page_documents")
      .insert({ creator_id: a.id, schema_version: 1, draft: doc });
    expect(created.error).toBeNull();
    const publish = await a.client
      .from("page_documents")
      .update({ published: doc })
      .eq("creator_id", a.id);
    expect(publish.error?.code).toBe("42501");
  });

  it("another creator cannot read or edit the draft", async () => {
    const read = await b.client.from("page_documents").select("draft").eq("creator_id", a.id);
    expect(read.data).toEqual([]);
    const { data } = await b.client
      .from("page_documents")
      .update({ draft: { hijacked: true } })
      .eq("creator_id", a.id)
      .select();
    expect(data ?? []).toEqual([]);
  });

  it("page_versions cannot be written by clients", async () => {
    const { error } = await a.client
      .from("page_versions")
      .insert({ creator_id: a.id, schema_version: 1, document: doc });
    expect(error?.code).toBe("42501");
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
