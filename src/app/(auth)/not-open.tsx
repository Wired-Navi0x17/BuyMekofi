import Link from "next/link";
import { brand } from "@/config/brand";
import { Wordmark } from "@/components/marketing/wordmark";

/** Temporary until Milestone 2 ships real auth. States the truth, collects nothing. */
export function NotOpenYet({ title }: { title: string }) {
  return (
    <main className="mx-auto grid min-h-[100dvh] max-w-6xl content-center px-4 md:px-8">
      <Link href="/" aria-label={`${brand.name} home`} className="w-28">
        <Wordmark />
      </Link>
      <h1 className="mt-10 font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1] tracking-tight">
        {title}
      </h1>
      <p className="mt-5 max-w-[52ch] leading-relaxed text-ink-soft">
        Accounts are not open yet. {brand.name} is in development, and sign-up will open here once
        it works end to end. We are not collecting emails in the meantime.
      </p>
      <Link href="/" className="mt-8 w-fit text-cherry underline decoration-1 underline-offset-4">
        Back to the home page
      </Link>
    </main>
  );
}
