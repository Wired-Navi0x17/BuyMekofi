import { z } from "zod";

/**
 * Variables that are safe to ship to the browser. Next.js inlines
 * NEXT_PUBLIC_* at build time, so each must be referenced literally.
 */
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ protocol: /^https?$/ }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  // Canonical origin for links in auth emails. Never derived from the Host header.
  NEXT_PUBLIC_SITE_URL: z.url({ protocol: /^https?$/ }).default("http://localhost:3000"),
});

export type PublicEnv = z.infer<typeof schema>;

let cached: PublicEnv | undefined;

export function publicEnv(): PublicEnv {
  cached ??= schema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  });
  return cached;
}
