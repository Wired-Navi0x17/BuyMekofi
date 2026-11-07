import Link from "next/link";
import type { ReactNode } from "react";
import { brand } from "@/config/brand";
import { Wordmark } from "@/components/marketing/wordmark";

const panels = [
  { sfx: "Page", text: "A page at your own address, styled your way." },
  { sfx: "Work", text: "Your portfolio and links, in one place." },
  { sfx: "Support", text: "A way for your audience to pay you." },
];

/**
 * Two-pane shell for sign-up, log-in and page setup: what you get on the
 * left as a small comic strip, one focused question on the right.
 */
export function SplitShell({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] grid-rows-[auto_1fr] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:grid-rows-1">
      <aside className="flex flex-col gap-8 border-b-[3px] border-ink bg-sheet px-4 py-5 md:border-r-[3px] md:border-b-0 md:px-10 md:py-10">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" aria-label={`${brand.name} home`} className="block w-40 text-ink md:w-52">
            <Wordmark />
          </Link>
        </div>
        <div className="hidden flex-1 flex-col justify-center md:flex">
          <p className="font-display text-2xl leading-tight">Welcome to {brand.name}.</p>
          <ol className="mt-6 grid max-w-sm gap-3">
            {panels.map((p, i) => (
              <li key={p.sfx} className="relative overflow-hidden panel px-4 py-3">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 right-0 w-1/2 tone-light [mask-image:linear-gradient(to_left,black,transparent)] opacity-25"
                />
                <span className="relative bg-ink px-1.5 text-xs tabular text-sheet">{i + 1}</span>
                <p
                  aria-hidden
                  className="relative mt-1 sfx text-2xl leading-none [-webkit-text-stroke-width:1.5px] [text-shadow:2px_2px_0_var(--color-ink)]"
                >
                  {p.sfx}
                </p>
                <p className="relative mt-1 text-sm text-ink-soft">{p.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </aside>
      <div className="flex flex-col">
        {aside && (
          <div className="flex justify-end px-4 pt-5 text-sm text-ink-soft md:px-10">{aside}</div>
        )}
        <main className="flex flex-1 items-start px-4 py-10 md:items-center md:px-16">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
