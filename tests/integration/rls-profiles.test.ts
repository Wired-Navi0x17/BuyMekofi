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
const usernameA = uniqueUsername("ita");

beforeAll(async () => {
  a = await createTestUser("a");
  b = await createTestUser("b");
});

afterAll(async () => {
  await deleteTestUser(a);
  await deleteTestUser(b);
});

describe("creator_profiles RLS", () => {
  it("lets a creator create their own profile", async () => {
    const { error } = await a.client
      .from("creator_profiles")
      .insert({ user_id: a.id, username: usernameA, display_name: "Creator A" });
    expect(error).toBeNull();
  });

  it("refuses creating a profile for someone else", async () => {
    const { error } = await a.client
      .from("creator_profiles")
      .insert({ user_id: b.id, username: uniqueUsername("itx"), display_name: "Not me" });
    expect(error?.code).toBe("42501");
  });

  it("refuses reserved and malformed usernames", async () => {
    const reserved = await b.client
      .from("creator_profiles")
      .insert({ user_id: b.id, username: "admin", display_name: "B" });
    expect(reserved.error?.code).toBe("23514");
    const malformed = await b.client
      .from("creator_profiles")
      .insert({ user_id: b.id, username: "Bad Name!", display_name: "B" });
    expect(malformed.error?.code).toBe("23514");
  });

  it("does not let a creator publish themselves or change status", async () => {
    const pub = await a.client
      .from("creator_profiles")
      .update({ published_at: new Date().toISOString() })
      .eq("user_id", a.id);
    expect(pub.error?.code).toBe("42501");
    const status = await a.client
      .from("creator_profiles")
      .update({ status: "active" })
      .eq("user_id", a.id);
    expect(status.error?.code).toBe("42501");
  });

  it("hides an unpublished profile from other users and the public", async () => {
    const asB = await b.client.from("creator_profiles").select("user_id").eq("user_id", a.id);
    expect(asB.data).toEqual([]);
    const asAnon = await anon().from("creator_profiles").select("user_id").eq("user_id", a.id);
    expect(asAnon.data).toEqual([]);
  });

  it("does not let another creator edit the profile", async () => {
    const { data } = await b.client
      .from("creator_profiles")
      .update({ display_name: "Hijacked" })
      .eq("user_id", a.id)
      .select();
    expect(data ?? []).toEqual([]);
    const { data: own } = await admin()
      .from("creator_profiles")
      .select("display_name")
      .eq("user_id", a.id)
      .single();
    expect(own?.display_name).toBe("Creator A");
  });

  it("shows a published profile to the public", async () => {
    await admin()
      .from("creator_profiles")
      .update({ published_at: new Date().toISOString() })
      .eq("user_id", a.id);
    const { data } = await anon().from("creator_profiles").select("username").eq("user_id", a.id);
    expect(data).toEqual([{ username: usernameA }]);
  });
});

describe("roles and audit", () => {
  it("normal users are not admins and cannot grant themselves roles", async () => {
    const { data } = await a.client.rpc("has_role", { required: "admin" });
    expect(data).toBe(false);
    const grant = await a.client.from("user_roles").insert({ user_id: a.id, role: "admin" });
    expect(grant.error?.code).toBe("42501");
  });

  it("audit_logs are invisible to normal users", async () => {
    await admin().from("audit_logs").insert({
      actor_kind: "system",
      action: "test.integration",
      entity_type: "test",
      entity_id: a.id,
    });
    const { data } = await a.client.from("audit_logs").select("id").eq("entity_id", a.id);
    expect(data).toEqual([]);
  });

  it("audit_logs are append-only even for the service role", async () => {
    const { error } = await admin()
      .from("audit_logs")
      .update({ action: "test.tampered" })
      .eq("entity_id", a.id);
    expect(error?.message).toMatch(/append-only/);
  });

  it("reserved_usernames are not readable by clients", async () => {
    const { data } = await anon().from("reserved_usernames").select("username").limit(1);
    expect(data ?? []).toEqual([]);
  });
});

describe("site CMS tables", () => {
  it("published content is public; drafts and history are not", async () => {
    await admin()
      .from("site_content_drafts")
      .upsert({ key: "landing.pricing_note", draft: { body: "secret draft" } });
    const draftAnon = await anon().from("site_content_drafts").select("draft");
    expect(draftAnon.data ?? []).toEqual([]);
    const draftCreator = await a.client.from("site_content_drafts").select("draft");
    expect(draftCreator.data ?? []).toEqual([]);
    const history = await a.client.from("site_content_versions").select("id");
    expect(history.data ?? []).toEqual([]);
    const live = await anon().from("site_content").select("key");
    expect(live.error).toBeNull();
    await admin().from("site_content_drafts").delete().eq("key", "landing.pricing_note");
  });

  it("clients cannot write site content", async () => {
    const pub = await a.client
      .from("site_content")
      .upsert({ key: "landing.hero", value: { title: "pwned" } });
    expect(pub.error?.code).toBe("42501");
    const draft = await a.client
      .from("site_content_drafts")
      .upsert({ key: "landing.hero", draft: { title: "pwned" } });
    expect(draft.error?.code).toBe("42501");
  });

  it("creators cannot set their own suspension fields", async () => {
    const { error } = await a.client
      .from("creator_profiles")
      .update({ suspended_reason: null, status: "active" })
      .eq("user_id", a.id);
    expect(error?.code).toBe("42501");
  });
});

describe("account deletion with history", () => {
  it("a user with audit entries and page versions can be deleted; history survives anonymised", async () => {
    const u = await createTestUser("del");
    await admin()
      .from("creator_profiles")
      .insert({ user_id: u.id, username: uniqueUsername("del"), display_name: "Del" });
    await admin()
      .from("page_versions")
      .insert({ creator_id: u.id, schema_version: 2, document: {}, published_by: u.id });
    const { data: entry } = await admin()
      .from("audit_logs")
      .insert({
        actor_id: u.id,
        actor_kind: "user",
        action: "test.delete_me",
        entity_type: "test",
        entity_id: u.id,
      })
      .select("id")
      .single();
    await deleteTestUser(u); // throws if deletion fails
    const { data: after } = await admin()
      .from("audit_logs")
      .select("actor_id")
      .eq("id", entry!.id)
      .single();
    expect(after?.actor_id).toBeNull();
    const { data: versions } = await admin()
      .from("page_versions")
      .select("id")
      .eq("creator_id", u.id);
    expect(versions).toEqual([]);
  });

  it("direct edits and deletes of history are still refused", async () => {
    const del = await admin().from("audit_logs").delete().eq("action", "test.delete_me");
    expect(del.error?.message).toMatch(/append-only/);
  });
});
