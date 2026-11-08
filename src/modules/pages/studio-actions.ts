"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { IMAGE_MIME, sniffImageType } from "@/lib/images";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/session";
import { creatorTag } from "@/modules/profiles/public-page";
import { documentImagePaths, safeParseDocument, type PageDocument } from "./document";
import { isOwnImagePath } from "./media";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const MEDIA_MAX_BYTES = 5 * 1024 * 1024;

/** Every image a document points at must live in this creator's own folder. */
function foreignImage(doc: PageDocument, ownerId: string): boolean {
  return documentImagePaths(doc).some((p) => !isOwnImagePath(ownerId, p));
}

function validate(input: unknown, ownerId: string): Result<{ doc: PageDocument }> {
  const parsed = safeParseDocument(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `That change isn't valid: ${issue?.message ?? "check the page"}.` };
  }
  if (foreignImage(parsed.data, ownerId)) {
    return { ok: false, error: "An image on this page isn't one of your uploads." };
  }
  return { ok: true, doc: parsed.data };
}

/** Autosave target. Writes only the draft, through the user's own client (RLS). */
export async function saveDraft(input: unknown): Promise<Result<{ savedAt: string }>> {
  const user = await requireUser("/dashboard/studio");
  const v = validate(input, user.id);
  if (!v.ok) return v;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("page_drafts")
    .update({ draft: v.doc, schema_version: v.doc.version })
    .eq("creator_id", user.id)
    .select("updated_at")
    .single();
  if (error)
    return { ok: false, error: "We couldn't save. Your changes are still here; try again." };
  return { ok: true, savedAt: data.updated_at };
}

/** Publish the saved draft: validate, snapshot, audit, refresh the public page. */
export async function publishPage(): Promise<Result<{ username: string }>> {
  const user = await requireUser("/dashboard/studio");
  const supabase = await createSupabaseServerClient();
  const [{ data: doc }, { data: profile }] = await Promise.all([
    supabase.from("page_drafts").select("draft").eq("creator_id", user.id).single(),
    supabase.from("creator_profiles").select("username").eq("user_id", user.id).single(),
  ]);
  if (!doc || !profile) return { ok: false, error: "Finish setting up your page first." };

  const v = validate(doc.draft, user.id);
  if (!v.ok) return v;

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const results = await Promise.all([
    admin.from("page_documents").upsert({
      creator_id: user.id,
      schema_version: v.doc.version,
      published: v.doc,
      published_at: now,
    }),
    admin.from("page_versions").insert({
      creator_id: user.id,
      schema_version: v.doc.version,
      document: v.doc,
      published_by: user.id,
    }),
    admin.from("audit_logs").insert({
      actor_id: user.id,
      actor_kind: "user",
      action: "page.publish",
      entity_type: "creator_profile",
      entity_id: user.id,
      after: { blocks: v.doc.blocks.length, palette: v.doc.theme.palette },
    }),
  ]);
  if (results.some((r) => r.error)) return { ok: false, error: "Publishing failed. Try again." };
  updateTag(creatorTag(profile.username));
  return { ok: true, username: profile.username };
}

/** Upload a cover or gallery image. Returns the storage path to put in the document. */
export async function uploadPageImage(form: FormData): Promise<Result<{ path: string }>> {
  const user = await requireUser("/dashboard/studio");
  const kind = form.get("kind") === "cover" ? "covers" : "page-media";
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image." };
  if (file.size > MEDIA_MAX_BYTES) return { ok: false, error: "Use an image under 5 MB." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(bytes);
  if (!type) return { ok: false, error: "Use a JPEG, PNG or WebP image." };

  const path = `${user.id}/${randomUUID()}.${type === "jpeg" ? "jpg" : type}`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage
    .from(kind)
    .upload(path, bytes, { contentType: IMAGE_MIME[type], upsert: false });
  if (error) return { ok: false, error: "We couldn't store that image. Try another." };
  return { ok: true, path };
}
