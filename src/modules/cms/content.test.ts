import { describe, expect, it } from "vitest";
import { CONTENT_KEYS, contentDefaults, isContentKey, parseContent } from "./content";

describe("site content", () => {
  it("every default is valid against its own schema", () => {
    for (const key of CONTENT_KEYS)
      expect(parseContent(key, contentDefaults[key]).success, key).toBe(true);
  });

  it("the steps page keeps exactly four panels", () => {
    const steps = contentDefaults["landing.steps"];
    expect(
      parseContent("landing.steps", { ...steps, items: steps.items.slice(0, 3) }).success,
    ).toBe(false);
  });

  it("caps lengths and requires titles", () => {
    const hero = contentDefaults["landing.hero"];
    expect(parseContent("landing.hero", { ...hero, title: "  " }).success).toBe(false);
    expect(parseContent("landing.hero", { ...hero, body: "x".repeat(601) }).success).toBe(false);
  });

  it("announcement links must be same-origin paths or https", () => {
    const base = {
      enabled: true,
      text: "Sign-ups are open",
      linkLabel: "Join",
      linkHref: "/register",
    };
    expect(parseContent("site.announcement", base).success).toBe(true);
    expect(
      parseContent("site.announcement", { ...base, linkHref: "https://example.com/x" }).success,
    ).toBe(true);
    for (const bad of [
      "javascript:alert(1)",
      "//evil.example",
      "http://plain.example",
      "data:text/html,x",
    ]) {
      expect(parseContent("site.announcement", { ...base, linkHref: bad }).success, bad).toBe(
        false,
      );
    }
    expect(parseContent("site.announcement", { ...base, linkLabel: "" }).success).toBe(false);
    expect(parseContent("site.announcement", { ...base, text: "" }).success).toBe(false);
  });

  it("strips unknown fields and rejects unknown keys", () => {
    const r = parseContent("landing.pricing_note", { body: "ok", html: "<script>" });
    expect(r.success && r.data).toEqual({ body: "ok" });
    expect(isContentKey("landing.hero")).toBe(true);
    expect(isContentKey("landing.secrets")).toBe(false);
  });
});
