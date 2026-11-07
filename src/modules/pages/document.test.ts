import { describe, expect, it } from "vitest";
import { defaultDocument, parseDocument, MAX_BLOCKS } from "./document";

describe("page document v1", () => {
  it("the default Café document is valid", () => {
    const doc = defaultDocument();
    expect(parseDocument(doc)).toEqual(doc);
    expect(doc.blocks.map((b) => b.type)).toEqual(["about", "links", "support"]);
  });

  it("always keeps exactly one support block", () => {
    const doc = defaultDocument();
    const noSupport = { ...doc, blocks: doc.blocks.filter((b) => b.type !== "support") };
    expect(() => parseDocument(noSupport)).toThrow();
    const twoSupport = { ...doc, blocks: [...doc.blocks, { id: "s2", type: "support" }] };
    expect(() => parseDocument(twoSupport)).toThrow();
  });

  it("rejects unknown block types and strips unknown fields", () => {
    const doc = defaultDocument();
    expect(() =>
      parseDocument({ ...doc, blocks: [...doc.blocks, { id: "x", type: "script" }] }),
    ).toThrow();
    const parsed = parseDocument({ ...doc, evil: "<script>" } as unknown);
    expect(parsed).not.toHaveProperty("evil");
  });

  it("caps the number of blocks", () => {
    const doc = defaultDocument();
    const many = Array.from({ length: MAX_BLOCKS }, (_, i) => ({ id: `a${i}`, type: "about" }));
    expect(() => parseDocument({ ...doc, blocks: [...many, ...doc.blocks] })).toThrow();
  });

  it("rejects duplicate block ids", () => {
    const doc = defaultDocument();
    expect(() =>
      parseDocument({ ...doc, blocks: [...doc.blocks, { ...doc.blocks[0] }] }),
    ).toThrow();
  });
});
