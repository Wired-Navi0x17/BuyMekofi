import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env/public";
import { contentDefaults, parseContent, type Content, type ContentKey } from "./content";

export const siteTag = (key: ContentKey) => `site:${key}`;

/**
 * Published site content, cached and tagged; falls back to the shipped
 * default when nothing is published or the stored value no longer parses.
 */
export async function getSiteContent<K extends ContentKey>(key: K): Promise<Content<K>> {
  "use cache";
  cacheTag(siteTag(key));
  cacheLife("days");
  const env = publicEnv();
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await db.from("site_content").select("value").eq("key", key).maybeSingle();
  if (!data) return contentDefaults[key];
  const parsed = parseContent(key, data.value);
  return parsed.success ? parsed.data : contentDefaults[key];
}
