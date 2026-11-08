import { z } from "zod";
import { FONT_NAMES, PALETTE_NAMES, type FontName, type PaletteName } from "./theme";

/**
 * Page document (PAGE_STUDIO.md §3). Version 2 adds the theme layer and the
 * Studio v1 blocks. v1 documents are upgraded on read. Every save and
 * publish goes through parseDocument; unknown fields are stripped.
 */
export const DOCUMENT_VERSION = 2;
export const MAX_BLOCKS = 40;
export const MAX_GALLERY_IMAGES = 12;

const blockId = z.string().regex(/^[a-z0-9_-]{1,24}$/);
const hex = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a hex colour like #1d1b18.");
const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
/** "<owner uuid>/<uuid>.<ext>"; the renderer also checks the owner. */
export const imagePath = z.string().regex(new RegExp(`^${uuid}/${uuid}\\.(jpg|png|webp)$`));

const fontName = z.enum(FONT_NAMES as [FontName, ...FontName[]]);
const paletteName = z.enum(PALETTE_NAMES as [PaletteName, ...PaletteName[]]);

const customPalette = z.object({
  background: hex,
  surface: hex,
  text: hex,
  muted: hex,
  accent: hex,
  accentText: hex,
  border: hex,
});

const theme = z
  .object({
    palette: z.union([paletteName, z.literal("custom")]),
    custom: customPalette.optional(),
    // Three roles = at most three typefaces per page.
    fonts: z.object({ display: fontName, body: fontName, accent: fontName }),
    border: z.object({
      width: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
      style: z.enum(["solid", "double", "dashed"]),
    }),
    radius: z.union([z.literal(0), z.literal(4), z.literal(10), z.literal(20)]),
    shadow: z.enum(["none", "hard", "soft"]),
    imageShape: z.enum(["square", "circle", "slant", "arch"]),
    background: z.enum(["plain", "tone", "lines"]),
    coverPath: imagePath.nullable(),
  })
  .refine((t) => t.palette !== "custom" || t.custom !== undefined, {
    message: "A custom palette needs its colours.",
    path: ["custom"],
  });

const block = z.discriminatedUnion("type", [
  z.object({ id: blockId, type: z.literal("about") }),
  z.object({ id: blockId, type: z.literal("links") }),
  z.object({ id: blockId, type: z.literal("support") }),
  z.object({
    id: blockId,
    type: z.literal("text"),
    title: z.string().trim().max(80).default(""),
    body: z.string().trim().max(3000),
  }),
  z.object({
    id: blockId,
    type: z.literal("quote"),
    text: z.string().trim().min(1).max(280),
    attribution: z.string().trim().max(80).default(""),
    effect: z.enum(["none", "pulse"]).default("none"),
  }),
  z.object({
    id: blockId,
    type: z.literal("gallery"),
    title: z.string().trim().max(80).default(""),
    images: z
      .array(z.object({ path: imagePath, alt: z.string().trim().max(140).default("") }))
      .max(MAX_GALLERY_IMAGES),
  }),
  z.object({ id: blockId, type: z.literal("divider"), style: z.enum(["line", "tone", "space"]) }),
]);

export const documentSchema = z
  .object({
    version: z.literal(DOCUMENT_VERSION),
    template: z.literal("cafe"),
    theme,
    blocks: z.array(block).min(1).max(MAX_BLOCKS),
  })
  .superRefine((doc, ctx) => {
    const ids = new Set<string>();
    for (const b of doc.blocks) {
      if (ids.has(b.id)) ctx.addIssue({ code: "custom", message: `duplicate block id ${b.id}` });
      ids.add(b.id);
    }
    if (doc.blocks.filter((b) => b.type === "support").length !== 1) {
      ctx.addIssue({ code: "custom", message: "a page must have exactly one support block" });
    }
  });

export type PageDocument = z.infer<typeof documentSchema>;
export type PageBlock = PageDocument["blocks"][number];
export type PageTheme = PageDocument["theme"];
export type BlockType = PageBlock["type"];

export function defaultTheme(): PageTheme {
  return {
    palette: "newsprint",
    fonts: { display: "dela_gothic", body: "geist", accent: "cutive_mono" },
    border: { width: 3, style: "solid" },
    radius: 0,
    shadow: "hard",
    imageShape: "square",
    background: "plain",
    coverPath: null,
  };
}

export function defaultDocument(): PageDocument {
  return {
    version: DOCUMENT_VERSION,
    template: "cafe",
    theme: defaultTheme(),
    blocks: [
      { id: "about", type: "about" },
      { id: "links", type: "links" },
      { id: "support", type: "support" },
    ],
  };
}

/** v1 had only `theme.preset` and the about/links/support blocks. */
function upgrade(input: unknown): unknown {
  if (input && typeof input === "object" && (input as { version?: unknown }).version === 1) {
    const v1 = input as { blocks?: unknown };
    return { version: 2, template: "cafe", theme: defaultTheme(), blocks: v1.blocks };
  }
  return input;
}

export function parseDocument(input: unknown): PageDocument {
  return documentSchema.parse(upgrade(input));
}

export function safeParseDocument(input: unknown) {
  return documentSchema.safeParse(upgrade(input));
}

/** Every image path a document references (cover and gallery images). */
export function documentImagePaths(doc: PageDocument): string[] {
  return [
    doc.theme.coverPath,
    ...doc.blocks.flatMap((b) => (b.type === "gallery" ? b.images.map((i) => i.path) : [])),
  ].filter((p): p is string => p !== null);
}
