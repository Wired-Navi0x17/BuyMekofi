import { describe, expect, it } from "vitest";
import { sniffImageType } from "./images";

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);

describe("sniffImageType", () => {
  it("recognises png, jpeg and webp by their magic bytes", () => {
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("png");
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("jpeg");
    const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
    expect(sniffImageType(webp)).toBe("webp");
  });

  it("rejects svg, gif, html and anything renamed to look like an image", () => {
    expect(
      sniffImageType(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'>")),
    ).toBe(null);
    expect(sniffImageType(new TextEncoder().encode("GIF89a......"))).toBe(null);
    expect(sniffImageType(new TextEncoder().encode("<html><script>"))).toBe(null);
    expect(sniffImageType(new Uint8Array(3))).toBe(null);
  });
});
