/* eslint-disable @next/next/no-img-element -- images are served by Supabase Storage at fixed sizes */
import Link from "next/link";
import {
  BehanceLogo,
  DribbbleLogo,
  GithubLogo,
  GlobeSimple,
  InstagramLogo,
  LinkedinLogo,
  LinkSimple,
  SpotifyLogo,
  TwitchLogo,
  XLogo,
  YoutubeLogo,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import { brand } from "@/config/brand";
import { platformLabel, type Platform } from "@/modules/profiles/onboarding-schema";
import type { PublicPage } from "@/modules/profiles/public-page";
import { Wordmark } from "@/components/marketing/wordmark";

const icons: Record<Platform, Icon> = {
  instagram: InstagramLogo,
  youtube: YoutubeLogo,
  x: XLogo,
  linkedin: LinkedinLogo,
  github: GithubLogo,
  behance: BehanceLogo,
  dribbble: DribbbleLogo,
  spotify: SpotifyLogo,
  twitch: TwitchLogo,
  website: GlobeSimple,
  other: LinkSimple,
};

/**
 * The "Café" template (PAGE_STUDIO.md §6) rendered from a published
 * document. Shared by the public page and, later, the Studio preview.
 */
export function CafePage({ page }: { page: PublicPage }) {
  const initial = page.displayName.trim().charAt(0).toUpperCase() || "?";
  const about = page.document.blocks.some((b) => b.type === "about");
  const links = page.document.blocks.some((b) => b.type === "links") && page.links.length > 0;

  return (
    <div className="min-h-[100dvh] bg-paper">
      <header className="border-b-2 border-ink bg-paper">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5 md:px-8">
          <Link href="/" aria-label={`${brand.name} home`} className="text-ink">
            <Wordmark className="h-7 w-auto" />
          </Link>
          <Link
            href="/register"
            className="text-sm text-ink-soft underline decoration-1 underline-offset-4 hover:text-ink"
          >
            Make your own page
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6 pb-16 md:px-8">
        <div className="overflow-hidden panel">
          <div className="relative aspect-[3/1] border-b-[3px] border-ink bg-paper">
            {page.coverUrl ? (
              <img src={page.coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <>
                <div aria-hidden className="absolute inset-0 tone-mid opacity-20" />
                <div aria-hidden className="absolute inset-0 speedlines" />
              </>
            )}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-5 md:px-7">
            <div className="flex items-end gap-4">
              <div className="relative -mt-12 size-24 shrink-0 border-[3px] border-ink bg-ink md:-mt-14 md:size-28">
                {page.avatarUrl ? (
                  <img
                    src={page.avatarUrl}
                    alt={page.displayName}
                    width={112}
                    height={112}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="grid h-full place-items-center font-display text-4xl text-sheet"
                  >
                    {initial}
                  </span>
                )}
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="text-2xl leading-tight font-semibold tracking-tight md:text-3xl">
                  {page.displayName}
                </h1>
                <p className="text-sm tabular text-ink-soft">@{page.username}</p>
              </div>
            </div>
            <a
              href="#support"
              className="inline-flex min-h-11 items-center border-2 border-ink bg-ink px-6 font-semibold text-sheet press-shadow"
            >
              Support
            </a>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.1fr]">
          <div className="grid content-start gap-4">
            {about && (
              <section aria-labelledby="about-title" className="panel p-5">
                <h2 id="about-title" className="font-display text-lg">
                  About
                </h2>
                {page.bio ? (
                  <p className="mt-2 leading-relaxed whitespace-pre-line text-ink-soft">
                    {page.bio}
                  </p>
                ) : (
                  <p className="mt-2 text-ink-faint">
                    {page.displayName} hasn&apos;t written a bio yet.
                  </p>
                )}
              </section>
            )}
            {links && (
              <section aria-labelledby="links-title" className="panel p-5">
                <h2 id="links-title" className="font-display text-lg">
                  Elsewhere
                </h2>
                <ul className="mt-3 grid gap-2">
                  {page.links.map((l) => {
                    const Icon = icons[l.platform] ?? LinkSimple;
                    return (
                      <li key={l.url}>
                        <a
                          href={l.url}
                          rel="noopener noreferrer ugc nofollow"
                          target="_blank"
                          className="flex min-h-11 items-center gap-3 border-2 border-ink bg-sheet px-3 hover:bg-ink hover:text-sheet"
                        >
                          <Icon aria-hidden size={18} />
                          <span className="font-medium">
                            {l.label ?? platformLabel[l.platform]}
                          </span>
                          <span className="ml-auto truncate text-sm opacity-70">
                            {new URL(l.url).hostname.replace(/^www\./, "")}
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>

          <section id="support" aria-labelledby="support-title" className="scroll-mt-6 panel p-5">
            <h2 id="support-title" className="font-display text-lg">
              Support {page.displayName}
            </h2>
            <p className="mt-3 border-2 border-dashed border-ink px-4 py-3 text-sm leading-relaxed">
              Contributions aren&apos;t open yet. {brand.name} switches them on once our payment
              partner approves the account; this panel will then take UPI, cards and net banking.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
