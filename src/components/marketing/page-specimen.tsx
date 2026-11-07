import { GlobeSimple, InstagramLogo, YoutubeLogo } from "@phosphor-icons/react/ssr";
import { profileUrlFor } from "@/config/brand";

/**
 * A drawing of a creator page's layout, not a real creator. It is labelled
 * as an example and contains no invented people, numbers or supporters.
 */
export function PageSpecimen() {
  return (
    <figure className="w-full max-w-md justify-self-center md:justify-self-end">
      <div aria-hidden className="border border-ink bg-sheet">
        <div className="flex items-center justify-between border-b border-rule px-4 py-2">
          <span className="tabular text-xs text-ink-faint">{profileUrlFor("yourname")}</span>
          <span className="tabular text-xs text-ink-faint">example</span>
        </div>

        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start gap-4">
            <div className="grid size-16 shrink-0 place-items-center bg-ink font-display text-3xl text-sheet italic">
              Y
            </div>
            <div className="min-w-0">
              <p className="text-lg leading-tight font-medium">Your name</p>
              <p className="tabular text-sm text-ink-soft">@yourname</p>
              <p className="mt-2 text-sm leading-snug text-ink-soft">
                One or two lines about what you make and who it is for.
              </p>
            </div>
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
            <li className="flex items-center gap-1.5">
              <InstagramLogo size={16} /> Instagram
            </li>
            <li className="flex items-center gap-1.5">
              <YoutubeLogo size={16} /> YouTube
            </li>
            <li className="flex items-center gap-1.5">
              <GlobeSimple size={16} /> Website
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-[1.4fr_1fr] gap-px border-y border-rule bg-[var(--color-rule)]">
          <div className="bg-sheet p-3">
            <div className="aspect-[4/3] hatch" />
            <p className="mt-2 text-xs font-medium">Featured project</p>
          </div>
          <div className="grid gap-px bg-sheet">
            <div className="p-3">
              <div className="aspect-[4/3] hatch" />
              <p className="mt-2 text-xs font-medium">Project</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm font-medium">Support my work</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[50, 100, 250].map((r) => (
              <div
                key={r}
                className={`border py-2 text-center tabular text-sm ${r === 100 ? "border-ink bg-ink text-sheet" : "border-rule"}`}
              >
                ₹{r}
              </div>
            ))}
          </div>
          <dl className="mt-4 grid gap-1.5 text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Through the page</dt>
              <dd>UPI, cards, net banking</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Direct to UPI ID</dt>
              <dd>no fee, not anonymous</dd>
            </div>
          </dl>
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-ink-soft">
        The layout every page follows. Your links, your work, then the support panel.
      </figcaption>
    </figure>
  );
}
