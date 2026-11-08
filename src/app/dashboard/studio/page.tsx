import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Studio } from "@/components/studio/studio";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/session";
import { defaultDocument, safeParseDocument } from "@/modules/pages/document";
import { mediaUrl } from "@/modules/pages/media";
import type { Platform } from "@/modules/profiles/onboarding-schema";

export const metadata: Metadata = { title: "Page Studio" };

export default function StudioPage() {
  return (
    <Suspense fallback={<div aria-hidden className="min-h-[100dvh] animate-pulse bg-paper" />}>
      <StudioLoader />
    </Suspense>
  );
}

async function StudioLoader() {
  const user = await requireUser("/dashboard/studio");
  const supabase = await createSupabaseServerClient();
  const [{ data: profile }, { data: links }, { data: doc }] = await Promise.all([
    supabase
      .from("creator_profiles")
      .select("username, display_name, bio, avatar_path, onboarding_completed_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profile_links")
      .select("platform, url, label")
      .eq("creator_id", user.id)
      .order("position"),
    supabase.from("page_documents").select("draft").eq("creator_id", user.id).maybeSingle(),
  ]);
  if (!profile?.onboarding_completed_at) redirect("/onboarding");

  const parsed = safeParseDocument(doc?.draft);
  return (
    <Studio
      initialDocument={parsed.success ? parsed.data : defaultDocument()}
      profile={{
        ownerId: user.id,
        username: profile.username,
        displayName: profile.display_name,
        bio: profile.bio,
        avatarUrl: mediaUrl("avatars", user.id, profile.avatar_path),
        coverUrl: null,
        links: (links ?? []) as { platform: Platform; url: string; label: string | null }[],
      }}
    />
  );
}
