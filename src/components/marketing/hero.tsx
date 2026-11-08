import { Info } from "@phosphor-icons/react/ssr";
import type { Content } from "@/modules/cms/content";
import Link from "next/link";
import { SiteHeader } from "./site-header";
import { PageSpecimen } from "./page-specimen";
import { ClaimBox } from "./claim-box";

type HeroProps = {
  content: Content<"landing.hero">;
  announcement: Content<"site.announcement">;
};

export function Hero({ content, announcement }: HeroProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper">
      {announcement.enabled && (
        <p className="border-b-2 border-ink bg-ink px-4 py-2 text-center text-sm text-sheet">
          {announcement.text}
          {announcement.linkHref && (
            <>
              {" "}
              <Link
                href={announcement.linkHref}
                className="font-semibold underline underline-offset-4"
              >
                {announcement.linkLabel}
              </Link>
            </>
          )}
        </p>
      )}
      <SiteHeader />
      <section
        aria-labelledby="hero-title"
        className="relative mx-auto grid w-full max-w-6xl flex-1 grid-cols-[minmax(0,1fr)] items-start gap-12 overflow-x-clip px-4 pt-[clamp(2rem,7vh,5rem)] pb-12 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-14 md:px-8"
      >
        <div className="relative">
          <h1
            id="hero-title"
            className="font-display text-[clamp(2rem,3.7vw,3.05rem)] leading-[1.08] tracking-[-0.01em] text-balance"
          >
            {content.title}
            <span className="mt-3 block sfx [-webkit-text-stroke-width:1.5px] [text-shadow:3px_3px_0_var(--color-ink)]">
              {content.highlight}
            </span>
          </h1>
          <p className="mt-6 max-w-[52ch] text-[1.0625rem] leading-relaxed whitespace-pre-line text-ink-soft">
            {content.body}
          </p>
          <div className="mt-8">
            <ClaimBox />
          </div>
          <p className="mt-6 flex max-w-[52ch] items-start gap-2 text-sm text-ink-soft">
            <Info aria-hidden className="mt-0.5 shrink-0" size={16} weight="regular" />
            <span>{content.status}</span>
          </p>
        </div>
        <div className="relative">
          {/* Focus lines behind the example page, the way a manga panel frames a reveal. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-10 speedlines [mask-image:radial-gradient(closest-side,black,transparent)]"
          />
          <PageSpecimen />
        </div>
      </section>
    </div>
  );
}
