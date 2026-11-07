import { Info } from "@phosphor-icons/react/ssr";
import { brand } from "@/config/brand";
import { SiteHeader } from "./site-header";
import { PageSpecimen } from "./page-specimen";
import { ClaimBox } from "./claim-box";

export function Hero() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper">
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
            A page as personal as your own website.
            <span className="mt-2 block text-shu">And a way to get paid for it.</span>
          </h1>
          <p className="mt-6 max-w-[52ch] text-[1.0625rem] leading-relaxed text-ink-soft">
            Shape it however you like: layouts, typefaces, colours, backgrounds, collages, tabs and
            hover details. Your portfolio lives there, and so does a support panel. The page costs
            nothing; we charge commission only on contributions processed through {brand.name}.
          </p>
          <div className="mt-8">
            <ClaimBox />
          </div>
          <p className="mt-6 flex max-w-[52ch] items-start gap-2 text-sm text-ink-soft">
            <Info aria-hidden className="mt-0.5 shrink-0" size={16} weight="regular" />
            <span>
              {brand.name} is in development. You can create an account now; pages and payments open
              as they are finished, and this page will say so.
            </span>
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
