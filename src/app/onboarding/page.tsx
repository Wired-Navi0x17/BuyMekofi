import type { Metadata } from "next";
import { Suspense } from "react";
import { SplitShell } from "@/components/auth/split-shell";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { FormSkeleton } from "@/components/auth/forms";
import { signOut } from "@/modules/auth/actions";
import { requireUser } from "@/modules/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Platform } from "@/modules/profiles/onboarding-schema";

export const metadata: Metadata = { title: "Set up your page" };

export default function OnboardingPage() {
  return (
    <SplitShell
      aside={
        <form action={signOut}>
          <button
            type="submit"
            className="underline decoration-1 underline-offset-4 hover:text-ink"
          >
            Log out
          </button>
        </form>
      }
    >
      <Suspense fallback={<FormSkeleton fields={4} />}>
        <Setup />
      </Suspense>
    </SplitShell>
  );
}

async function Setup() {
  const user = await requireUser("/onboarding");
  const supabase = await createSupabaseServerClient();
  const [{ data: profile }, { data: links }] = await Promise.all([
    supabase
      .from("creator_profiles")
      .select("username, display_name, bio, avatar_path, onboarding_completed_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profile_links")
      .select("platform, url")
      .eq("creator_id", user.id)
      .order("position"),
  ]);

  return (
    <OnboardingForm
      editing={Boolean(profile?.onboarding_completed_at)}
      defaults={{
        username: profile?.username ?? user.pendingUsername ?? "",
        displayName: profile?.display_name ?? "",
        bio: profile?.bio ?? "",
        hasAvatar: Boolean(profile?.avatar_path),
        links: ((links ?? []) as { platform: Platform; url: string }[]).map((l) => ({
          platform: l.platform,
          url: l.url,
        })),
      }}
    />
  );
}
