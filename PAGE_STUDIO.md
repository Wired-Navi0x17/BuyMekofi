# Page Studio: how creators design their pages

The goal is that a creator page can look as personal as a hand-built site. The founder's reference is a layered "character sheet": stacked and clipped photos, three typefaces mixed in one paragraph, tabbed sections, cards that open on hover, a pulsing quote, a textured background. Studio has to reach that range without anyone writing code, and without giving a creator page the power to attack its visitors.

## 1. The safety line

**No raw HTML. No JavaScript. Custom CSS only inside a sandbox.**

A creator page sits on our domain, next to a payment panel. If arbitrary HTML or JS were allowed, any page could:

- steal sessions;
- draw a fake "Pay" button or a fake UPI QR code;
- phish supporters;
- get the whole domain blocklisted.

The pasted reference uses no JavaScript, only HTML structure and CSS effects. Everything in it can be built from **blocks**, which give the structure, plus **styling**, which gives the effects.

## 2. Three layers

### Layer 1: Theme (no code, every creator)

- **Palette:** background, surface, text, muted text and accent, with contrast warnings in the editor.
- **Background:** a colour, an uploaded image (fixed or scrolling, cover or tile) or a texture, with an overlay tint.
- **Typefaces:** up to **3 per page**, chosen from a curated Google Fonts list of about 60 serif, sans, display, mono and script faces. The editor offers roles: display, body, accent.
- **Type details:** scale, letter-spacing, case and line height, per role.
- **Shape:**
  - border width, style (solid, dotted, double) and colour;
  - outline offset (the reference's double frame);
  - corner radius (creators may round corners; our own UI doesn't);
  - drop shadows.
- **Image treatments:** grayscale, opacity, and clip shapes such as slant, parallelogram, arch and circle, or a custom polygon from presets.

### Layer 2: Blocks (structure, drag to arrange)

| Block                                                                                                                           | Covers in the reference                     |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Identity (name, @handle, avatar, tagline)                                                                                       | header                                      |
| Text, with inline marks (bold, italic, small caps, letter-spaced, highlight, wavy underline, accent colour, alternate typeface) | the mixed-font paragraphs                   |
| Image                                                                                                                           | portraits                                   |
| Collage: layered images with offset, rotation, clip shape and overlap                                                           | the three slanted photos and the GIF strips |
| Tabs: icon or label tabs that switch panels                                                                                     | the Maeve / Pills / People buttons          |
| Reveal card: image or cover that opens to text on hover or tap                                                                  | the Atlas / Jeremy pop-out cards            |
| Quote, with effect (pulse-blur, glow on hover, rotated caption)                                                                 | the pulsing moon line                       |
| Links / socials                                                                                                                 |                                             |
| Portfolio grid and project pages                                                                                                |                                             |
| Gallery                                                                                                                         |                                             |
| Embed, from an allowlist only (YouTube, Spotify, SoundCloud, Vimeo, Bandcamp)                                                   |                                             |
| Divider / spacer                                                                                                                |                                             |
| **Support panel (locked)**                                                                                                      |                                             |

**Layout modes:**

- **Flow:** blocks stack and reflow on mobile. This is the default.
- **Canvas:** blocks are freely positioned and layered on a fixed-ratio board, like the reference's 850×610 card. Canvas sections store a separate mobile arrangement, auto-stacked and then hand-adjustable, because absolute layouts don't survive a 375px screen.

**Interactions:** per-block hover and enter effects (fade, slide, tilt, reveal, delay). All of them are CSS, and all are off under `prefers-reduced-motion`.

### Layer 3: Custom CSS (advanced, opt-in)

- Targets stable class names that Studio emits, such as `.ct-page`, `.ct-block`, `.ct-block--collage` and `.ct-text`.
- It is parsed and rewritten on the server with a CSS AST library, csstree (to be added when this ships):
  - every selector is prefixed with the page scope;
  - `@import` is dropped;
  - `url()` is allowed only for our Storage domain;
  - legacy script vectors (`expression()`, `behavior`, `-moz-binding`) are dropped;
  - the size cap is 20 KB.
- Containment: the content root has `contain: layout paint; isolation: isolate`. That makes even `position: fixed` relative to the content box and clipped to it, so custom CSS cannot cover anything outside the page content.
- The **support panel renders outside the styled root**, with platform styles only. A supporter always sees a genuine panel.

## 3. Data model (implemented in Milestone 3)

- `page_documents`: `creator_id`, `draft jsonb`, `published jsonb`, `schema_version`, `updated_at`.
- `page_versions`: append-only snapshots on every publish, for rollback.
- The document is a typed tree `{ theme, sections: [{ mode, blocks[] }] }`. A Zod schema validates it on every save, with limits on block count, text length, image count and nesting depth. Unknown fields are stripped.
- One renderer (`src/modules/pages/render`) draws both the editor preview and the public page, so what the creator sees is what visitors get.
- Assets live in Storage only (no hotlinking). GIFs are allowed up to 5 MB.

## 4. Editor

- A live preview pane, a block list with drag reordering, and an inspector for the selected block. Canvas sections get direct manipulation: drag, resize and rotate handles.
- Changes autosave to `draft`. **Publish** copies the draft to `published`, writes a version and revalidates the page cache.
- A desktop/mobile preview toggle.

## 5. Delivery plan

- **v1 (Milestone 4): shipped 2026-11-08.** theme layer; flow layout; Identity, Text, Image, Links, Portfolio, Gallery, Quote, Divider and Support blocks; publish and versions.
- **v2 (Milestone 10):** canvas layout, Collage, Tabs, Reveal cards, interactions, curated embeds, and sandboxed custom CSS.

## 6. Default template: "Café" (the founder's reference, 2026-11-07)

Every new page starts from this structure. It's the familiar creator-support layout, drawn in our own manga-café style: inked panels, screentone and a hanko-red support button. It is not a copy of any other site's look.

1. **Cover art band** (3:1), uploaded by the creator. Before an upload it shows screentone and speed lines. It can carry an optional credit line ("Cover art by …").
2. **Identity row:** a square avatar overlapping the cover, display name and @handle. On the right are **Support** (hanko red, opens or scrolls to the support panel) and **Share**.
3. **Tabs:** About · Gallery · Posts · Shop. Posts and Shop appear only once those modules exist (see the roadmap). We never show empty tabs.
4. **Two columns:**
   - **Left:** the About panel (bio, website link, social icons), a Gallery strip with a "View gallery" link, and Supporters.
   - **Right:** the **Support panel**: amount in ₹ with presets, display name (optional), message, a public-anonymity toggle, and a "Support ₹N" button. Under it, the Direct UPI option with its plain-language note.
5. **Supporters:** the newest supporters, showing only real, gateway-verified contributions. A supporter who chose anonymity appears as "Someone". With no supporters, the panel shows an empty state, never placeholder people.
6. **No vanity numbers:** no follower counts until a follow feature exists, and no "sold" counts until a shop exists.

Studio treats each of these as a block, so creators can reorder, restyle or remove everything except the Support panel.
