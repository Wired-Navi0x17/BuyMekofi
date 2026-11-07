import { GlobeSimple, InstagramLogo, YoutubeLogo } from "@phosphor-icons/react/ssr";
import { profileUrlFor } from "@/config/brand";

/**
 * A drawing of the default creator page ("Café" template, PAGE_STUDIO.md §6).
 * Labelled as an example; contains no invented people, numbers or supporters.
 */
export function PageSpecimen() {
  return (
    <figure className="relative w-full max-w-lg justify-self-center md:justify-self-end">
      <div aria-hidden className="panel press-shadow">
        <div className="flex items-center justify-between border-b-2 border-ink px-3 py-1.5">
          <span className="text-xs tabular text-ink-soft">{profileUrlFor("yourname")}</span>
          <span className="text-xs text-ink-soft">example</span>
        </div>

        {/* Cover art */}
        <div className="relative aspect-[3/1] overflow-hidden border-b-2 border-ink bg-paper">
          <div className="absolute inset-0 tone-mid opacity-25" />
          <div className="absolute inset-0 speedlines opacity-70" />
          <span className="absolute right-2 bottom-1.5 bg-sheet px-1.5 text-[0.65rem] text-ink-soft">
            your cover art
          </span>
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-end justify-between gap-3">
            <div className="relative -mt-8 grid size-16 shrink-0 place-items-center border-2 border-ink bg-ink font-display text-2xl text-sheet">
              Y
            </div>
            <div className="flex gap-2 pt-3">
              <div className="border-2 border-ink bg-sheet px-3 py-1 text-xs font-medium">
                Share
              </div>
              <div className="border-2 border-ink bg-ink px-3 py-1 text-xs font-medium text-sheet press-shadow">
                Support
              </div>
            </div>
          </div>
          <p className="mt-2 leading-tight font-medium">Your name</p>
          <p className="text-xs tabular text-ink-soft">@yourname</p>
        </div>

        <div className="flex gap-5 border-y-2 border-ink px-4 text-xs font-medium">
          <span className="border-b-[3px] border-ink py-2">About</span>
          <span className="py-2 text-ink-soft">Gallery</span>
          <span className="py-2 text-ink-soft">Posts</span>
        </div>

        <div className="grid gap-3 bg-paper p-3 sm:grid-cols-[1fr_1.15fr]">
          <div className="grid content-start gap-3">
            <div className="border-2 border-ink bg-sheet p-3">
              <p className="text-xs font-medium">About</p>
              <p className="mt-1 text-[0.7rem] leading-snug text-ink-soft">
                A few lines about what you make and who it is for.
              </p>
              <div className="mt-2 flex gap-2 text-ink-soft">
                <InstagramLogo size={14} />
                <YoutubeLogo size={14} />
                <GlobeSimple size={14} />
              </div>
            </div>
            <div className="border-2 border-ink bg-sheet p-3">
              <p className="text-xs font-medium">Gallery</p>
              <div className="mt-2 grid grid-cols-3 gap-1">
                <div className="aspect-square hatch" />
                <div className="aspect-square bg-sheet tone-light" />
                <div className="aspect-square hatch" />
              </div>
            </div>
          </div>

          <div className="border-2 border-ink bg-sheet p-3">
            <p className="text-xs font-medium">Support Your name</p>
            <div className="mt-2 border-2 border-ink px-2 py-1 text-xs tabular">₹ 100</div>
            <div className="mt-1.5 border border-rule-strong px-2 py-1 text-[0.7rem] text-ink-faint">
              Name (optional)
            </div>
            <div className="mt-1.5 h-9 border border-rule-strong px-2 py-1 text-[0.7rem] text-ink-faint">
              Message
            </div>
            <div className="mt-2 border-2 border-ink bg-ink py-1.5 text-center text-xs font-medium text-sheet">
              Support ₹100
            </div>
            <p className="mt-2 text-[0.65rem] leading-snug text-ink-soft">
              UPI, cards, net banking. Or pay their UPI ID directly: no fee, not anonymous.
            </p>
          </div>
        </div>
      </div>
      <figcaption className="mt-4 text-sm text-ink-soft">
        The starting layout: cover, about, gallery and a support panel. Restyle every part of it;
        only the support panel keeps its recognisable form.
      </figcaption>
    </figure>
  );
}
