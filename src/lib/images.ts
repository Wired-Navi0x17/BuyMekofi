export type ImageKind = "png" | "jpeg" | "webp";

export const IMAGE_MIME: Record<ImageKind, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/**
 * Identify an upload by its first bytes, never by its filename or the
 * browser-supplied type. SVG is deliberately unsupported (it can carry script).
 */
export function sniffImageType(head: Uint8Array): ImageKind | null {
  if (head.length < 12) return null;
  const is = (offset: number, ...sig: number[]) => sig.every((b, i) => head[offset + i] === b);
  if (is(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png";
  if (is(0, 0xff, 0xd8, 0xff)) return "jpeg";
  if (is(0, 0x52, 0x49, 0x46, 0x46) && is(8, 0x57, 0x45, 0x42, 0x50)) return "webp";
  return null;
}
