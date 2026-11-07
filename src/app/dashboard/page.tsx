import type { Metadata } from "next";
import { Suspense } from "react";
import { Wordmark } from "@/components/marketing/wordmark";
import { Button } from "@/components/ui/button";
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
  return (
    <section aria-labelledby="dash-title" className="max-w-xl">
      <h1 id="dash-title" className="text-[1.75rem] font-medium tracking-tight">
        Your account is ready.
      </h1>
      <p className="mt-2 text-ink-soft">
        Signed in as <span className="text-ink">{user.email}</span>.
      </p>
      <p className="mt-6 border-t border-rule pt-6 text-ink-soft">
        Choosing your username and building your page come next. That part of the product is being
        built now and will appear here when it works.
      </p>
    </section>
  );
}
