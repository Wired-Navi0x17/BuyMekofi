"use server";

import { updateTag } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/modules/auth/admin";
import { creatorTag } from "@/modules/profiles/public-page";
import { isContentKey, parseContent, type ContentKey } from "./content";
import { siteTag } from "./read";

type Result = { ok: true } | { ok: false; error: string };

async function audit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  after: unknown,
  before?: unknown,
) {
  await createSupabaseAdminClient()
    .from("audit_logs")
    .insert({
      actor_id: actorId,
      actor_kind: "admin",
      action,
      entity_type: entityType,
      entity_id: entityId,
      before: before ?? null,
      after: after ?? null,
    });
}

function checkKey(key: string): key is ContentKey {
  return isContentKey(key);
}

/** Save a draft for one content key (validated; not public until published). */
export async function saveContentDraft(key: string, value: unknown): Promise<Result> {
  const admin = await requireAdmin();
  if (!checkKey(key)) return { ok: false, error: "Unknown content." };
  const parsed = parseContent(key, value);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { ok: false, error: `${i?.path.join(" › ") || "Content"}: ${i?.message ?? "invalid"}` };
  }
  const { error } = await createSupabaseAdminClient()
    .from("site_content_drafts")
    .upsert({ key, draft: parsed.data, updated_by: admin.id });
  if (error) return { ok: false, error: "Couldn't save the draft." };
  await audit(admin.id, "content.draft_save", "site_content", key, parsed.data);
  return { ok: true };
}

/** Publish the saved draft: snapshot, make live, refresh pages that use it. */
export async function publishContent(key: string): Promise<Result> {
  const admin = await requireAdmin();
  if (!checkKey(key)) return { ok: false, error: "Unknown content." };
  const db = createSupabaseAdminClient();
  const [{ data: draft }, { data: current }] = await Promise.all([
    db.from("site_content_drafts").select("draft").eq("key", key).maybeSingle(),
    db.from("site_content").select("value").eq("key", key).maybeSingle(),
  ]);
  if (!draft) return { ok: false, error: "Save a draft first." };
  const parsed = parseContent(key, draft.draft);
  if (!parsed.success)
    return { ok: false, error: "The draft no longer passes validation. Edit and save it again." };

  const now = new Date().toISOString();
  const results = await Promise.all([
    db
      .from("site_content")
      .upsert({ key, value: parsed.data, published_at: now, published_by: admin.id }),
    db.from("site_content_versions").insert({ key, value: parsed.data, published_by: admin.id }),
  ]);
  if (results.some((r) => r.error)) return { ok: false, error: "Publishing failed. Try again." };
  await audit(admin.id, "content.publish", "site_content", key, parsed.data, current?.value);
  updateTag(siteTag(key));
  return { ok: true };
}

/** Copy an old published version into the draft (publish it to go live). */
export async function restoreContentVersion(key: string, versionId: number): Promise<Result> {
  const admin = await requireAdmin();
  if (!checkKey(key) || !Number.isSafeInteger(versionId))
    return { ok: false, error: "Unknown version." };
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("site_content_versions")
    .select("value")
    .eq("id", versionId)
    .eq("key", key)
    .maybeSingle();
  if (!data) return { ok: false, error: "Unknown version." };
  return saveContentDraft(key, data.value).then(async (r) => {
    if (r.ok) await audit(admin.id, "content.restore", "site_content", key, { versionId });
    return r;
  });
}

/** Suspend or reinstate a creator. Suspended pages disappear from public view. */
export async function setCreatorStatus(
  userId: string,
  status: "active" | "suspended",
  reason: string,
): Promise<Result> {
  const admin = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/.test(userId)) return { ok: false, error: "Unknown creator." };
  const why = reason.trim();
  if (status === "suspended" && (why.length < 3 || why.length > 300)) {
    return { ok: false, error: "Give a reason (3–300 characters). It is kept in the audit log." };
  }
  const db = createSupabaseAdminClient();
  const { data: before } = await db
    .from("creator_profiles")
    .select("username, status, suspended_reason")
    .eq("user_id", userId)
    .maybeSingle();
  if (!before) return { ok: false, error: "Unknown creator." };
  const { error } = await db
    .from("creator_profiles")
    .update({ status, suspended_reason: status === "suspended" ? why : null })
    .eq("user_id", userId);
  if (error) return { ok: false, error: "Couldn't update the creator." };
  await audit(
    admin.id,
    status === "suspended" ? "creator.suspend" : "creator.reinstate",
    "creator_profile",
    userId,
    { status, reason: why || null },
    before,
  );
  updateTag(creatorTag(before.username));
  return { ok: true };
}
