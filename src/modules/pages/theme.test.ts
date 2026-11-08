import { describe, expect, it } from "vitest";
import { contrastRatio, FONTS, fontStylesheetHref, PALETTES, paletteContrast } from "./theme";

describe("contrastRatio (WCAG 2.x)", () => {
  it("is 21:1 for black on white and 1:1 for identical colours", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#777777", "#777777")).toBeCloseTo(1, 5);
  });
  it("matches a known mid value", () => {
    // #767676 on white is the classic 4.54:1 AA threshold colour.
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 1);
  });
});

describe("palettes", () => {
  it("every preset passes AA for body text on both background and surface", () => {
    for (const [name, p] of Object.entries(PALETTES)) {
      const c = paletteContrast(p);
      expect(c.textOnBackground, name).toBeGreaterThanOrEqual(4.5);
      expect(c.textOnSurface, name).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("fonts", () => {
  it("builds one Google Fonts URL for the chosen families only", () => {
    const href = fontStylesheetHref(["fraunces", "space_grotesk"]);
    expect(href).toBe(
      "https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700&family=Space+Grotesk:wght@400;700&display=swap",
    );
  });
  it("returns null when only system fonts are used", () => {
    expect(fontStylesheetHref(["system_sans"])).toBeNull();
  });
  it("every font has a CSS stack with a generic fallback", () => {
    for (const f of Object.values(FONTS))
      expect(f.stack).toMatch(/(serif|sans-serif|monospace|cursive)$/);
  });
});
