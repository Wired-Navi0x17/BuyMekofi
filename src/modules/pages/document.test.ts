import { describe, expect, it } from "vitest";
import {
  defaultDocument,
  documentImagePaths,
  parseDocument,
  MAX_BLOCKS,
  MAX_GALLERY_IMAGES,
} from "./document";
import { isOwnImagePath } from "./media";

const uid = "11111111-2222-4333-8444-555555555555";
const img = (n: number) => `${uid}/aaaaaaaa-bbbb-4ccc-8ddd-${String(n).padStart(12, "0")}.png`;

describe("page document v2", () => {
  it("the default Café document is valid and has the three starter blocks", () => {
    const doc = defaultDocument();
    expect(parseDocument(doc)).toEqual(doc);
    expect(doc.version).toBe(2);
    expect(doc.blocks.map((b) => b.type)).toEqual(["about", "links", "support"]);
  });

  it("upgrades a v1 document (already published pages keep working)", () => {
    const v1 = {
      version: 1,
      template: "cafe",
      theme: { preset: "newsprint" },
      blocks: [
        { id: "about", type: "about" },
        { id: "support", type: "support" },
      ],
    };
    const up = parseDocument(v1);
    expect(up.version).toBe(2);
    expect(up.theme.palette).toBe("cafe_2d");
    expect(up.blocks.map((b) => b.id)).toEqual(["about", "support"]);
  });

  it("always keeps exactly one support block", () => {
    const doc = defaultDocument();
    expect(() =>
      parseDocument({ ...doc, blocks: doc.blocks.filter((b) => b.type !== "support") }),
    ).toThrow();
    expect(() =>
      parseDocument({ ...doc, blocks: [...doc.blocks, { id: "s2", type: "support" }] }),
    ).toThrow();
  });

  it("rejects unknown block types and strips unknown fields", () => {
    const doc = defaultDocument();
    expect(() =>
      parseDocument({ ...doc, blocks: [...doc.blocks, { id: "x", type: "script" }] }),
    ).toThrow();
    expect(parseDocument({ ...doc, evil: "<script>" } as unknown)).not.toHaveProperty("evil");
  });

  it("caps blocks, and rejects duplicate ids", () => {
    const doc = defaultDocument();
    const many = Array.from({ length: MAX_BLOCKS }, (_, i) => ({
      id: `d${i}`,
      type: "divider",
      style: "line",
    }));
    expect(() => parseDocument({ ...doc, blocks: [...many, ...doc.blocks] })).toThrow();
    expect(() =>
      parseDocument({ ...doc, blocks: [...doc.blocks, { ...doc.blocks[0] }] }),
    ).toThrow();
  });

  it("validates text, quote and gallery blocks", () => {
    const doc = defaultDocument();
    const withBlocks = (b: unknown) => parseDocument({ ...doc, blocks: [...doc.blocks, b] });
    expect(() =>
      withBlocks({ id: "t", type: "text", title: "Hi", body: "x".repeat(3001) }),
    ).toThrow();
    expect(
      withBlocks({ id: "q", type: "quote", text: "Hello", effect: "pulse" }).blocks.at(-1),
    ).toMatchObject({
      type: "quote",
      effect: "pulse",
    });
    const images = Array.from({ length: MAX_GALLERY_IMAGES + 1 }, (_, i) => ({
      path: img(i),
      alt: "",
    }));
    expect(() => withBlocks({ id: "g", type: "gallery", images })).toThrow();
    expect(() =>
      withBlocks({ id: "g", type: "gallery", images: [{ path: "../x.png", alt: "" }] }),
    ).toThrow();
    expect(() =>
      withBlocks({
        id: "g",
        type: "gallery",
        images: [{ path: "https://evil.example/a.png", alt: "" }],
      }),
    ).toThrow();
  });

  it("accepts a custom palette only with valid hex colours", () => {
    const doc = defaultDocument();
    const custom = {
      background: "#ffffff",
      surface: "#f5f5f5",
      text: "#111111",
      muted: "#444444",
      accent: "#0a5",
      accentText: "#ffffff",
      border: "#111111",
    };
    expect(
      parseDocument({ ...doc, theme: { ...doc.theme, palette: "custom", custom } }).theme.palette,
    ).toBe("custom");
    expect(() =>
      parseDocument({
        ...doc,
        theme: { ...doc.theme, palette: "custom", custom: { ...custom, text: "red;}" } },
      }),
    ).toThrow();
    expect(() => parseDocument({ ...doc, theme: { ...doc.theme, palette: "custom" } })).toThrow();
  });

  it("only allows fonts from the curated list", () => {
    const doc = defaultDocument();
    expect(() =>
      parseDocument({
        ...doc,
        theme: { ...doc.theme, fonts: { ...doc.theme.fonts, display: "Comic Sans" } },
      }),
    ).toThrow();
  });
});

describe("image ownership", () => {
  it("lists cover and gallery paths so the server can check each belongs to the editor", () => {
    const other = "99999999-2222-4333-8444-555555555555";
    const doc = parseDocument({
      ...defaultDocument(),
      theme: { ...defaultDocument().theme, coverPath: img(1) },
      blocks: [
        ...defaultDocument().blocks,
        {
          id: "g",
          type: "gallery",
          images: [
            { path: img(2), alt: "" },
            { path: `${other}/aaaaaaaa-bbbb-4ccc-8ddd-000000000003.png`, alt: "" },
          ],
        },
      ],
    });
    const paths = documentImagePaths(doc);
    expect(paths).toHaveLength(3);
    expect(paths.filter((p) => !isOwnImagePath(uid, p))).toEqual([
      `${other}/aaaaaaaa-bbbb-4ccc-8ddd-000000000003.png`,
    ]);
  });
});
