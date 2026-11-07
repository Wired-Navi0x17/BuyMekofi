import { Info } from "@phosphor-icons/react/ssr";
import { brand, profileUrlFor } from "@/config/brand";
import { ButtonLink } from "@/components/ui/button";
import { SiteHeader } from "./site-header";
import { PageSpecimen } from "./page-specimen";

export function Hero() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper">
      <SiteHeader />
      <section
        aria-labelledby="hero-title"
        className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 py-12 md:grid-cols-[1.25fr_1fr] md:gap-16 md:px-8"
      >
        <div>
          <h1
            id="hero-title"
            className="font-display text-[clamp(2.5rem,4.9vw,4.25rem)] leading-[0.98] tracking-tight text-balance"
          >
            One page for everything you make.
            <span className="block text-ink-soft italic">And a plain way to be paid for it.</span>
          </h1>
          <p className="mt-7 max-w-[52ch] text-[1.0625rem] leading-relaxed text-ink-soft">
            {brand.name} gives creators in India a page at{" "}
            <span className="tabular text-[0.95em] text-ink">{profileUrlFor("yourname")}</span> with
            your links, your portfolio and a support panel. The page costs nothing. We only charge
            commission on contributions that are processed through us.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink href="/register">Create your page</ButtonLink>
            <ButtonLink href="/#pricing" variant="secondary">
              Read the pricing
            </ButtonLink>
          </div>
          <p className="mt-8 flex max-w-[52ch] items-start gap-2 text-sm text-ink-soft">
            <Info aria-hidden className="mt-0.5 shrink-0" size={16} weight="regular" />
            <span>
              {brand.name} is in development. Accounts and payments are not open yet; this page will
              say so when they are.
            </span>
          </p>
        </div>
        <PageSpecimen />
      </section>
    </div>
  );
}
