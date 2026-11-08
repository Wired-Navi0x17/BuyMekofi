import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env/public";
import { parseDocument, type PageDocument } from "@/modules/pages/document";
import { mediaUrl } from "@/modules/pages/media";
export { isOwnImagePath } from "@/modules/pages/media";
import type { Platform } from "./onboarding-schema";
import { validateUsernameFormat } from "./username";

export const creatorTag = (username: string) => `creator:${username.toLowerCase()}`;

export type PublicPage = {
  ownerId: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  links: { platform: Platform; url: string; label: string | null }[];
  document: PageDocument;
};

/**
 * Public, cacheable read of a published page. Uses an anonymous client (no
 * cookies), so RLS shows only what any visitor may see. Invalidated by
 * updateTag(creatorTag(username)) when the creator publishes.
 */
export async function getPublicPage(rawUsername: string): Promise<PublicPage | null> {
  "use cache";
  const check = validateUsernameFormat(rawUsername.toLowerCase());
  if (!check.ok) return null;
  cacheTag(creatorTag(check.username));
  cacheLife("hours");

  const env = publicEnv();
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile } = await db
    .from("creator_profiles")
    .select("user_id, username, display_name, bio, avatar_path, cover_path")
    .eq("username", check.username)
    .maybeSingle();
  if (!profile) return null;

  const [{ data: links }, { data: doc }] = await Promise.all([
    db
      .from("profile_links")
      .select("platform, url, label")
      .eq("creator_id", profile.user_id)
      .order("position"),
    db.from("page_documents").select("published").eq("creator_id", profile.user_id).maybeSingle(),
  ]);
  if (!doc?.published) return null;

  return {
    ownerId: profile.user_id,
    username: profile.username,
    displayName: profile.display_name,
    bio: profile.bio,
    avatarUrl: mediaUrl("avatars", profile.user_id, profile.avatar_path),
    coverUrl: mediaUrl("covers", profile.user_id, profile.cover_path),
    links: (links ?? []) as PublicPage["links"],
    document: parseDocument(doc.published),
  };
}
