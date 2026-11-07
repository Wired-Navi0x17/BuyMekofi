import type { Metadata } from "next";
import { Suspense } from "react";
import { Wordmark } from "@/components/marketing/wordmark";
import { redirect } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/modules/auth/actions";
import { requireUser } from "@/modules/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="min-h-[100dvh]">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Wordmark className="h-7 w-auto text-ink" />
          <form action={signOut}>
            <Button type="submit" variant="quiet" className="text-sm">
              Log out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <Suspense fallback={<div aria-hidden className="h-24 max-w-md animate-pulse bg-rule/40" />}>
          <Account />
        </Suspense>
      </main>
    </div>
  );
}

async function Account() {
  const user = await requireUser("/dashboard");
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("username, onboarding_completed_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.onboarding_completed_at) redirect("/onboarding");

  return (
    <section aria-labelledby="dash-title" className="max-w-xl">
      <h1 id="dash-title" className="text-[1.75rem] font-medium tracking-tight">
        Your page is live.
      </h1>
      <p className="mt-2 text-lg tabular">
        {brand.domain}/{profile.username}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href={`/${profile.username}`}>View your page</ButtonLink>
        <ButtonLink href="/onboarding" variant="secondary">
          Edit your page
        </ButtonLink>
      </div>
      <p className="mt-8 border-t-2 border-ink pt-6 text-ink-soft">
        Signed in as <span className="text-ink">{user.email}</span>. Earnings, supporters and the
        page designer arrive here as they are built.
      </p>
    </section>
  );
}
