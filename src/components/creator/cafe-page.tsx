/* eslint-disable @next/next/no-img-element -- images are served by Supabase Storage */
import Link from "next/link";
import type { CSSProperties } from "react";
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
import type { PageBlock, PageDocument, PageTheme } from "@/modules/pages/document";
import { mediaUrl } from "@/modules/pages/media";
import { FONTS, fontStylesheetHref, PALETTES, type Palette } from "@/modules/pages/theme";
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

export type CafePageData = {
  ownerId: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  links: { platform: Platform; url: string; label: string | null }[];
  document: PageDocument;
};

function palette(theme: PageTheme): Palette {
  return theme.palette === "custom" && theme.custom
    ? theme.custom
    : PALETTES[theme.palette === "custom" ? "newsprint" : theme.palette];
}

/** Theme -> CSS custom properties, scoped to the page root. */
function themeVars(theme: PageTheme): CSSProperties {
  const p = palette(theme);
  const shadow = {
    none: "none",
    hard: `4px 4px 0 ${p.border}`,
    soft: "0 10px 30px rgb(0 0 0 / 0.12)",
  }[theme.shadow];
  return {
    "--pg-bg": p.background,
    "--pg-surface": p.surface,
    "--pg-text": p.text,
    "--pg-muted": p.muted,
    "--pg-accent": p.accent,
    "--pg-accent-text": p.accentText,
    "--pg-border": p.border,
    "--pg-bw": `${theme.border.width}px`,
    "--pg-bs": theme.border.style,
    "--pg-radius": `${theme.radius}px`,
    "--pg-shadow": shadow,
    "--pg-font-display": FONTS[theme.fonts.display].stack,
    "--pg-font-body": FONTS[theme.fonts.body].stack,
    "--pg-font-accent": FONTS[theme.fonts.accent].stack,
  } as CSSProperties;
}

const shapeClass: Record<PageTheme["imageShape"], string> = {
  square: "",
  circle: "rounded-full",
  slant: "[clip-path:polygon(10%_0,100%_0,90%_100%,0_100%)]",
  arch: "rounded-t-full",
};

const panel =
  "bg-[var(--pg-surface)] [border:var(--pg-bw)_var(--pg-bs)_var(--pg-border)] rounded-[var(--pg-radius)] shadow-[var(--pg-shadow)]";
const heading = "font-[family-name:var(--pg-font-display)] text-lg";

/**
 * The "Café" template (PAGE_STUDIO.md §6). Server-rendered on the public page
 * and rendered client-side as the Studio preview, from the same document.
 */
export function CafePage({ page, preview = false }: { page: CafePageData; preview?: boolean }) {
  const { theme, blocks } = page.document;
  const fontsHref = fontStylesheetHref([theme.fonts.display, theme.fonts.body, theme.fonts.accent]);
  const cover = mediaUrl("covers", page.ownerId, theme.coverPath) ?? page.coverUrl;
  const initial = page.displayName.trim().charAt(0).toUpperCase() || "?";
  const content = blocks.filter((b) => b.type !== "support");
  const background =
    theme.background === "tone"
      ? "bg-[radial-gradient(color-mix(in_srgb,var(--pg-text)_16%,transparent)_1px,transparent_1.4px)] [background-size:7px_7px]"
      : theme.background === "lines"
        ? "bg-[repeating-linear-gradient(0deg,color-mix(in_srgb,var(--pg-text)_8%,transparent)_0_1px,transparent_1px_28px)]"
        : "";

  return (
    <div
      style={themeVars(theme)}
      className={`min-h-[100dvh] bg-[var(--pg-bg)] font-[family-name:var(--pg-font-body)] text-[var(--pg-text)] ${background}`}
    >
      {fontsHref && <link rel="stylesheet" href={fontsHref} precedence="default" />}
      {!preview && (
        <header className="border-b-2 border-ink bg-paper font-sans text-ink">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5 md:px-8">
            <Link href="/" aria-label={`${brand.name} home`}>
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
      )}

      <main className="mx-auto max-w-5xl px-4 pt-6 pb-16 md:px-8">
        <div className={`${panel} overflow-hidden`}>
          <div className="relative aspect-[3/1] bg-[var(--pg-bg)] [border-bottom:var(--pg-bw)_var(--pg-bs)_var(--pg-border)]">
            {cover ? (
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(color-mix(in_srgb,var(--pg-text)_22%,transparent)_1.2px,transparent_1.5px)] [background-size:6px_6px] opacity-60"
              />
            )}
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-5 md:px-7">
            <div className="flex min-w-0 items-end gap-4">
              <div
                className={`relative -mt-12 size-24 shrink-0 overflow-hidden bg-[var(--pg-accent)] [border:var(--pg-bw)_var(--pg-bs)_var(--pg-border)] md:-mt-14 md:size-28 ${shapeClass[theme.imageShape]}`}
              >
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
                    className="grid h-full place-items-center font-[family-name:var(--pg-font-display)] text-4xl text-[var(--pg-accent-text)]"
                  >
                    {initial}
                  </span>
                )}
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="font-[family-name:var(--pg-font-display)] text-2xl leading-tight md:text-3xl">
                  {page.displayName}
                </h1>
                <p className="font-[family-name:var(--pg-font-accent)] text-sm text-[var(--pg-muted)]">
                  @{page.username}
                </p>
              </div>
            </div>
            <a
              href="#support"
              className="inline-flex min-h-11 items-center rounded-[var(--pg-radius)] bg-[var(--pg-accent)] px-6 font-semibold text-[var(--pg-accent-text)] shadow-[var(--pg-shadow)] [border:var(--pg-bw)_var(--pg-bs)_var(--pg-border)]"
            >
              Support
            </a>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="grid min-w-0 content-start gap-4">
            {content.map((b) => (
              <Block key={b.id} block={b} page={page} />
            ))}
          </div>
          <section
            id="support"
            aria-labelledby="support-title"
            className={`${panel} scroll-mt-6 self-start p-5`}
          >
            <h2 id="support-title" className={heading}>
              Support {page.displayName}
            </h2>
            <p className="mt-3 rounded-[var(--pg-radius)] border-2 border-dashed border-[var(--pg-border)] px-4 py-3 text-sm leading-relaxed">
              Contributions aren&apos;t open yet. {brand.name} switches them on once our payment
              partner approves the account; this panel will then take UPI, cards and net banking.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

function Block({ block, page }: { block: PageBlock; page: CafePageData }) {
  const shape = shapeClass[page.document.theme.imageShape];
  switch (block.type) {
    case "about":
      return (
        <section className={`${panel} p-5`}>
          <h2 className={heading}>About</h2>
          {page.bio ? (
            <p className="mt-2 leading-relaxed whitespace-pre-line text-[var(--pg-muted)]">
              {page.bio}
            </p>
          ) : (
            <p className="mt-2 text-[var(--pg-muted)]">
              {page.displayName} hasn&apos;t written a bio yet.
            </p>
          )}
        </section>
      );
    case "links":
      if (page.links.length === 0) return null;
      return (
        <section className={`${panel} p-5`}>
          <h2 className={heading}>Elsewhere</h2>
          <ul className="mt-3 grid gap-2">
            {page.links.map((l) => {
              const IconCmp = icons[l.platform] ?? LinkSimple;
              return (
                <li key={l.url}>
                  <a
                    href={l.url}
                    rel="noopener noreferrer ugc nofollow"
                    target="_blank"
                    className="flex min-h-11 items-center gap-3 rounded-[var(--pg-radius)] border-2 border-[var(--pg-border)] px-3 hover:bg-[var(--pg-accent)] hover:text-[var(--pg-accent-text)]"
                  >
                    <IconCmp aria-hidden size={18} />
                    <span className="font-medium">{l.label ?? platformLabel[l.platform]}</span>
                    <span className="ml-auto truncate text-sm opacity-70">
                      {new URL(l.url).hostname.replace(/^www\./, "")}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      );
    case "text":
      if (!block.title && !block.body) return null;
      return (
        <section className={`${panel} p-5`}>
          {block.title && <h2 className={heading}>{block.title}</h2>}
          {block.body && (
            <p className="mt-2 leading-relaxed whitespace-pre-line text-[var(--pg-muted)]">
              {block.body}
            </p>
          )}
        </section>
      );
    case "quote":
      return (
        <figure className={`${panel} px-6 py-7 text-center`}>
          <blockquote
            className={`font-[family-name:var(--pg-font-display)] text-xl leading-snug md:text-2xl ${block.effect === "pulse" ? "pg-pulse" : ""}`}
          >
            {block.text}
          </blockquote>
          {block.attribution && (
            <figcaption className="mt-3 font-[family-name:var(--pg-font-accent)] text-sm text-[var(--pg-muted)]">
              {block.attribution}
            </figcaption>
          )}
        </figure>
      );
    case "gallery": {
      const images = block.images
        .map((i) => ({ ...i, url: mediaUrl("page-media", page.ownerId, i.path) }))
        .filter((i): i is typeof i & { url: string } => Boolean(i.url));
      if (images.length === 0) return null;
      return (
        <section className={`${panel} p-5`}>
          {block.title && <h2 className={heading}>{block.title}</h2>}
          <div className={`grid grid-cols-2 gap-2 sm:grid-cols-3 ${block.title ? "mt-3" : ""}`}>
            {images.map((i) => (
              <img
                key={i.path}
                src={i.url}
                alt={i.alt}
                loading="lazy"
                className={`aspect-square w-full object-cover ${shape}`}
              />
            ))}
          </div>
        </section>
      );
    }
    case "divider":
      if (block.style === "space") return <div aria-hidden className="h-6" />;
      if (block.style === "tone")
        return (
          <div
            aria-hidden
            className="h-6 bg-[radial-gradient(var(--pg-text)_1px,transparent_1.3px)] [background-size:6px_6px] opacity-40"
          />
        );
      return <hr className="border-0 [border-top:var(--pg-bw)_var(--pg-bs)_var(--pg-border)]" />;
    default:
      return null;
  }
}
