"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { IMAGE_MIME, sniffImageType } from "@/lib/images";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/session";
import { defaultDocument, parseDocument } from "@/modules/pages/document";
import { linkSchema, MAX_LINKS, profileBasicsSchema } from "./onboarding-schema";
import { creatorTag } from "./public-page";
import { normaliseUsername, usernameProblemText, validateUsernameFormat } from "./username";

export type OnboardingState = {
  errors?: Partial<
    Record<"username" | "displayName" | "bio" | "avatar" | "links" | "form", string>
  >;
};

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const text = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string) : "");

/**
 * Creates or updates the creator profile, links and page document, then
 * publishes the page. Writes go through the user's own client (RLS applies);
 * only publication and audit use the service role, after validation.
 */
export async function completeOnboarding(
  _prev: OnboardingState,
  form: FormData,
): Promise<OnboardingState> {
  const user = await requireUser("/onboarding");
  const errors: OnboardingState["errors"] = {};

  const username = validateUsernameFormat(normaliseUsername(text(form, "username")));
  if (!username.ok) errors.username = usernameProblemText[username.reason];

  const basics = profileBasicsSchema.safeParse({
    displayName: text(form, "displayName"),
    bio: text(form, "bio"),
  });
  if (!basics.success) {
    for (const issue of basics.error.issues) {
      const key = issue.path[0] as "displayName" | "bio";
      errors[key] ??= issue.message;
    }
  }

  const platforms = form.getAll("linkPlatform").map(String);
  const urls = form.getAll("linkUrl").map(String);
  const links: { platform: string; url: string }[] = [];
  urls.forEach((url, i) => {
    if (!url.trim()) return;
    const parsed = linkSchema.safeParse({ platform: platforms[i], url });
    if (!parsed.success) errors.links ??= `Link ${i + 1}: ${parsed.error.issues[0]?.message}`;
    else links.push(parsed.data);
  });
  if (links.length > MAX_LINKS) errors.links = `Add at most ${MAX_LINKS} links.`;

  // Avatar: optional. Checked by size and by its actual bytes, not its name.
  let avatar: { bytes: Uint8Array; ext: string; mime: string } | null = null;
  const file = form.get("avatar");
  if (file instanceof File && file.size > 0) {
    if (file.size > AVATAR_MAX_BYTES) {
      errors.avatar = "Use an image under 2 MB.";
    } else {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const kind = sniffImageType(bytes);
      if (!kind) errors.avatar = "Use a JPEG, PNG or WebP image.";
      else avatar = { bytes, ext: kind === "jpeg" ? "jpg" : kind, mime: IMAGE_MIME[kind] };
    }
  }

  if (Object.keys(errors).length > 0 || !username.ok || !basics.success) return { errors };

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("creator_profiles")
    .select("username, avatar_path")
    .eq("user_id", user.id)
    .maybeSingle();

  const profileWrite = existing
    ? supabase
        .from("creator_profiles")
        .update({
          username: username.username,
          display_name: basics.data.displayName,
          bio: basics.data.bio,
        })
        .eq("user_id", user.id)
    : supabase.from("creator_profiles").insert({
        user_id: user.id,
        username: username.username,
        display_name: basics.data.displayName,
        bio: basics.data.bio,
      });
  const { error: profileError } = await profileWrite;
  if (profileError) {
    if (profileError.code === "23505") return { errors: { username: usernameProblemText.taken } };
    if (profileError.code === "23514")
      return { errors: { username: usernameProblemText.reserved } };
    return { errors: { form: "We couldn't save your profile. Try again." } };
  }

  if (avatar) {
    const path = `${user.id}/${randomUUID()}.${avatar.ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, avatar.bytes, { contentType: avatar.mime, upsert: false });
    if (error) return { errors: { avatar: "We couldn't store that image. Try another." } };
    await supabase.from("creator_profiles").update({ avatar_path: path }).eq("user_id", user.id);
    if (existing?.avatar_path)
      await supabase.storage.from("avatars").remove([existing.avatar_path]);
  }

  // Links: replace the whole set in order.
  await supabase.from("profile_links").delete().eq("creator_id", user.id);
  if (links.length > 0) {
    const { error } = await supabase.from("profile_links").insert(
      links.map((l, position) => ({
        creator_id: user.id,
        platform: l.platform,
        url: l.url,
        position,
      })),
    );
    if (error)
      return { errors: { links: "We couldn't save your links. Check them and try again." } };
  }

  // Page document: create the Café default on first run.
  const { data: doc } = await supabase
    .from("page_documents")
    .select("draft")
    .eq("creator_id", user.id)
    .maybeSingle();
  let draft = doc?.draft;
  if (!draft) {
    draft = defaultDocument();
    const { error } = await supabase
      .from("page_documents")
      .insert({ creator_id: user.id, schema_version: draft.version, draft });
    if (error) return { errors: { form: "We couldn't create your page. Try again." } };
  }

  // Publish (service role, after validation) and record it.
  const published = parseDocument(draft);
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const results = await Promise.all([
    admin.from("page_documents").update({ published, published_at: now }).eq("creator_id", user.id),
    admin.from("page_versions").insert({
      creator_id: user.id,
      schema_version: published.version,
      document: published,
      published_by: user.id,
    }),
    admin
      .from("creator_profiles")
      .update({ published_at: now, onboarding_completed_at: now })
      .eq("user_id", user.id)
      .is("onboarding_completed_at", null),
    admin.from("audit_logs").insert({
      actor_id: user.id,
      actor_kind: "user",
      action: "page.publish",
      entity_type: "creator_profile",
      entity_id: user.id,
      after: { username: username.username, links: links.length, avatar: Boolean(avatar) },
    }),
  ]);
  if (results.some((r) => r.error)) {
    return { errors: { form: "Your details are saved, but publishing failed. Try again." } };
  }

  updateTag(creatorTag(username.username));
  if (existing && existing.username !== username.username) {
    updateTag(creatorTag(existing.username));
  }
  redirect(`/${username.username}`);
}
