/**
 * Creator page theming (PAGE_STUDIO.md §2, layer 1). The platform UI is
 * strictly monochrome; creator pages may use colour, chosen here.
 */

export type Palette = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
  border: string;
};

/** Presets. Each one passes AA (4.5:1) for body text; see theme.test.ts. */
export const PALETTES = {
  cafe_2d: {
    background: "#f7f7f4",
    surface: "#fffefc",
    text: "#1b1b1a",
    muted: "#4a4a47",
    accent: "#1b1b1a",
    accentText: "#fffefc",
    border: "#1b1b1a",
  },
  newsprint: {
    background: "#ede6d6",
    surface: "#f6f1e4",
    text: "#1d1b18",
    muted: "#4a4640",
    accent: "#1d1b18",
    accentText: "#f6f1e4",
    border: "#1d1b18",
  },
  ink_night: {
    background: "#141311",
    surface: "#1f1d1a",
    text: "#efe8d8",
    muted: "#b9b0a0",
    accent: "#efe8d8",
    accentText: "#141311",
    border: "#efe8d8",
  },
  matcha: {
    background: "#e6eadb",
    surface: "#f4f6ee",
    text: "#1e2a1c",
    muted: "#46553f",
    accent: "#2f5a2a",
    accentText: "#f4f6ee",
    border: "#1e2a1c",
  },
  indigo_print: {
    background: "#e4e7f0",
    surface: "#f3f4f9",
    text: "#141a33",
    muted: "#3f4766",
    accent: "#27346e",
    accentText: "#f3f4f9",
    border: "#141a33",
  },
  rose_zine: {
    background: "#f3e3e3",
    surface: "#fbf3f2",
    text: "#2b1517",
    muted: "#6a4245",
    accent: "#8a2638",
    accentText: "#fbf3f2",
    border: "#2b1517",
  },
} satisfies Record<string, Palette>;

export type PaletteName = keyof typeof PALETTES;
export const PALETTE_NAMES = Object.keys(PALETTES) as PaletteName[];
export const paletteLabel: Record<PaletteName, string> = {
  cafe_2d: "2D café",
  newsprint: "Newsprint",
  ink_night: "Ink night",
  matcha: "Matcha",
  indigo_print: "Indigo print",
  rose_zine: "Rose zine",
};

/** Curated Google Fonts (plus system stacks). A page may use at most 3. */
export const FONTS = {
  system_sans: {
    label: "System sans",
    google: null,
    stack: "ui-sans-serif, system-ui, sans-serif",
  },
  geist: { label: "Geist", google: "Geist", stack: "'Geist', ui-sans-serif, sans-serif" },
  space_grotesk: {
    label: "Space Grotesk",
    google: "Space Grotesk",
    stack: "'Space Grotesk', sans-serif",
  },
  dm_sans: { label: "DM Sans", google: "DM Sans", stack: "'DM Sans', sans-serif" },
  bricolage: {
    label: "Bricolage Grotesque",
    google: "Bricolage Grotesque",
    stack: "'Bricolage Grotesque', sans-serif",
  },
  fraunces: { label: "Fraunces", google: "Fraunces", stack: "'Fraunces', Georgia, serif" },
  playfair: {
    label: "Playfair Display",
    google: "Playfair Display",
    stack: "'Playfair Display', Georgia, serif",
  },
  instrument_serif: {
    label: "Instrument Serif",
    google: "Instrument Serif",
    stack: "'Instrument Serif', Georgia, serif",
  },
  cormorant: {
    label: "Cormorant Garamond",
    google: "Cormorant Garamond",
    stack: "'Cormorant Garamond', Georgia, serif",
  },
  dela_gothic: {
    label: "Dela Gothic One",
    google: "Dela Gothic One",
    stack: "'Dela Gothic One', sans-serif",
  },
  bebas: { label: "Bebas Neue", google: "Bebas Neue", stack: "'Bebas Neue', sans-serif" },
  fjalla: { label: "Fjalla One", google: "Fjalla One", stack: "'Fjalla One', sans-serif" },
  cutive_mono: {
    label: "Cutive Mono",
    google: "Cutive Mono",
    stack: "'Cutive Mono', ui-monospace, monospace",
  },
  jetbrains_mono: {
    label: "JetBrains Mono",
    google: "JetBrains Mono",
    stack: "'JetBrains Mono', ui-monospace, monospace",
  },
  caveat: { label: "Caveat", google: "Caveat", stack: "'Caveat', cursive" },
  yatra_one: { label: "Yatra One", google: "Yatra One", stack: "'Yatra One', cursive" },
} as const;

export type FontName = keyof typeof FONTS;
export const FONT_NAMES = Object.keys(FONTS) as FontName[];

// Single-weight families on Google Fonts; requesting wght axes for them fails.
const SINGLE_WEIGHT = new Set([
  "Dela Gothic One",
  "Bebas Neue",
  "Fjalla One",
  "Cutive Mono",
  "Instrument Serif",
  "Yatra One",
]);

export function fontStylesheetHref(names: FontName[]): string | null {
  const families = [...new Set(names)]
    .map((n) => FONTS[n].google)
    .filter((g): g is NonNullable<typeof g> => Boolean(g))
    .map((g) => {
      const fam = g.replaceAll(" ", "+");
      return SINGLE_WEIGHT.has(g) ? `family=${fam}` : `family=${fam}:wght@400;700`;
    });
  if (families.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

// ---- WCAG contrast -------------------------------------------------------

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const v = hex.replace("#", "");
  const n = parseInt(v.length === 3 ? [...v].map((c) => c + c).join("") : v, 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function paletteContrast(p: Palette) {
  return {
    textOnBackground: contrastRatio(p.text, p.background),
    textOnSurface: contrastRatio(p.text, p.surface),
    mutedOnSurface: contrastRatio(p.muted, p.surface),
    accentText: contrastRatio(p.accentText, p.accent),
  };
}
