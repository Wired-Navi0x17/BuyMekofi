import { z } from "zod";

/**
 * Page document, schema v1 (PAGE_STUDIO.md §3). Milestone 3 ships the
 * "Café" template with three blocks; Studio (Milestone 4) adds theme fields
 * and more block types. Every save and publish goes through parseDocument.
 */
export const DOCUMENT_VERSION = 1;
export const MAX_BLOCKS = 40;

const blockId = z.string().regex(/^[a-z0-9_-]{1,24}$/);

const block = z.discriminatedUnion("type", [
  z.object({ id: blockId, type: z.literal("about") }),
  z.object({ id: blockId, type: z.literal("links") }),
  z.object({ id: blockId, type: z.literal("support") }),
]);

export const documentSchema = z
  .object({
    version: z.literal(DOCUMENT_VERSION),
    template: z.literal("cafe"),
    theme: z.object({ preset: z.literal("newsprint") }),
    blocks: z.array(block).min(1).max(MAX_BLOCKS),
  })
  .superRefine((doc, ctx) => {
    const ids = new Set<string>();
    for (const b of doc.blocks) {
      if (ids.has(b.id)) ctx.addIssue({ code: "custom", message: `duplicate block id ${b.id}` });
      ids.add(b.id);
    }
    const supports = doc.blocks.filter((b) => b.type === "support").length;
    if (supports !== 1) {
      ctx.addIssue({ code: "custom", message: "a page must have exactly one support block" });
    }
  });

export type PageDocument = z.infer<typeof documentSchema>;
export type PageBlock = PageDocument["blocks"][number];

export function parseDocument(input: unknown): PageDocument {
  return documentSchema.parse(input);
}

export function defaultDocument(): PageDocument {
  return {
    version: DOCUMENT_VERSION,
    template: "cafe",
    theme: { preset: "newsprint" },
    blocks: [
      { id: "about", type: "about" },
      { id: "links", type: "links" },
      { id: "support", type: "support" },
    ],
  };
}
