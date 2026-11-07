# Design System: Coffea et Thea

Every screen is built against this file. If a component needs something that isn't listed here, add it here first.

## 0. Dials

VARIANCE: 6 | MOTION: 6 on the landing intro, 3 inside the app | DENSITY: 4 on marketing, 6 on the dashboard and admin

## 1. Atmosphere

**Theme (2026-11-07, revised): comic manga on the original paper-and-ink palette.** It's black-and-white first, like a printed manga, with inked panel borders (3px), screentone, focus lines and outlined SFX lettering. Cherry is the one spot colour. **No orange anywhere** (founder). There are also no accent bars down one side of a box; boxes are fully bordered or not bordered at all.

Paper and ink. The site reads like a well-made notebook: warm off-white paper, charcoal ink, hairline rules and no rounded corners. It looks calm and exact, the way a receipt you trust does. Motion is reserved for one moment (the intro) and for confirming things. Money is always set with tabular figures and right-aligned, the way a ledger is.

## 1b. Signature element (exactly one)

**"Written in ink, burned into view."** On the first visit the wordmark _Coffea et Thea_ is written stroke by stroke in ink on a sheet of paper. When the visitor scrolls, the sheet burns away from its edges to reveal the site.

- **Layer:** motion and materiality.
- **Why it belongs to this business:** a creator page is the creator's own signature. The ink stroke is the act of signing, and the burn is the paper giving way to the creator's world.
- **Where it recurs:** the same ink-stroke draw marks confirmed moments: a voucher being claimed (the expiry date is underlined in ink), a page being published (the `@username` is underlined), and a test-mode contribution being recorded. Ink appears only when something is real and saved, never as decoration.

## 2. Palette and roles: strictly monochrome (founder, 2026-11-07)

This follows the earliest manga print: black letterpress ink on cheap, yellowed postwar newsprint (the akahon era). It has **no accent colour, no red and no orange.** Emphasis comes from solid black, outline lettering, hatching and tone. States are told apart by icon, wording and line style (solid or dashed), never by hue.

| Token         | Hex     | Role                                                        |
| ------------- | ------- | ----------------------------------------------------------- |
| `paper`       | #EDE6D6 | page background: yellowed newsprint                         |
| `sheet`       | #F6F1E4 | panels, inputs, the intro sheet                             |
| `ink`         | #1D1B18 | letterpress black: text, borders, solid buttons, focus ring |
| `ink-soft`    | #4A4640 | secondary text (≥ 7:1 on paper)                             |
| `ink-faint`   | #7E786E | metadata and placeholders only                              |
| `rule`        | #C9C0AE | hairlines                                                   |
| `rule-strong` | #A69C88 | input hover, secondary borders                              |

The burn intro chars to neutral black, and its edge smoulders ash-white rather than orange.

## 2b. Manga materials

- `panel`: a 3px ink border on `sheet`. Sections are panels, not floating cards.
- `press-shadow`: a hard 4px ink offset, only on things you press (Claim, primary buttons, the example page). Pressing collapses it like a rubber stamp.
- `tone-light`, `tone-mid`, `tone-dense`: CSS halftone dots, always masked to fade, and never behind body text at full strength.
- `sfx`: comic sound-effect lettering, with paper fill, ink outline and a hard ink drop, for panel words like "Claim!".
- `speedlines`: focus lines, at most once per view, framing the thing that matters.

## 4. Components

- **Radius: 0 everywhere.** `--radius-*` is set to 0 in the theme. Avatars are square too.
- **Buttons:** `primary` has an ink fill and paper text, and `stamp` is cherry for Support and Claim; both have a 2px ink border and the press shadow. `secondary` has a 1px ink border on a transparent background. `quiet` is text in ink-soft with an underline on hover. They are 44px high (40px in dense tables), use `translate-y-px` on `:active`, have no glow and no gradients, and show a 2px cherry focus ring with a 2px offset.
- **Inputs:** label above, helper text below the label, error below the field. 1px `rule` border on `sheet`. The border turns `ink` on focus, plus a cherry ring. No floating labels.
- **Surfaces:** no cards stacked on cards. Sections are separated by `border-t border-rule` and whitespace. A table is a ruled list.
- **No tags.** No eyebrow labels or pills above headings, and no "New" chips. Status in tables is plain text in a semantic colour with an icon.
- **Loading:** skeleton blocks with the real layout's dimensions, in `rule` at 40% with an opacity pulse. No spinners.
- **Empty states:** they show what will appear and how to make it appear, for example "Your first supporter will appear here. Share coffeaetthea.in/riya to get started" with a copy-link button.
- **Errors:** inline, next to their cause, in the form "What happened. What to do."
- **Money rows:** amount right-aligned in mono. Commission is shown as its own line with the rate and where it came from ("0% · welcome voucher until 10 Jan 2027"). Nothing is hidden in a tooltip.

## 5. Layout

- Grid first. Containers are `max-w-6xl mx-auto px-4 md:px-8`.
- The marketing hero is split and left-aligned, never centred.
- No three identical cards in a row. Steps run as a numbered vertical sequence with mono numerals, and features alternate between two columns.
- Full-height sections use `min-h-[100dvh]`.
- Below 768px every layout is one column, with no horizontal scroll and tap targets of at least 44px.
- Section spacing is `clamp(3rem, 8vw, 6rem)`.

## 6. Motion

- **Tiers:** CSS for hovers and reveals. GSAP and ScrollTrigger are used _only_ in the landing intro client component. Raw WebGL draws the burn. Nothing else on the site loads GSAP.
- Only `transform` and `opacity` are animated, plus `stroke-dashoffset` on SVG.
- The ink stroke draws linearly, as a pen does. Everything else uses `cubic-bezier(.2,.7,.2,1)` at 180–260ms.
- **`prefers-reduced-motion: reduce`:** no burn and no writing. The wordmark appears already drawn and the page is shown immediately. If WebGL is unavailable the result is the same. Content is visible by default and never waits on JS.
- Cleanup: the intro component kills its GSAP context and ScrollTrigger, cancels requestAnimationFrame and releases the WebGL context on unmount.

## 7. Anti-patterns (banned)

Emojis in UI. Inter. Pure #000. Glows, neon and gradient text. Rounded corners. Eyebrow tags and pills. Three identical cards. Fake testimonials, fake user counts, invented stats, fake creator pages presented as real, and logo walls of companies that don't use us. Placeholder people named John Doe or Priya Sharma presented as real users (demo content is labelled as an example). Copy clichés such as "Elevate", "Seamless", "Unleash", "Empower" and "Next-gen". Filler such as "Scroll to explore" and bouncing chevrons; the intro uses a single static line, "Scroll to open", which describes the interaction. Custom cursors. Spinners.

## 8. Sources and licences

See `CREDITS.md`.
