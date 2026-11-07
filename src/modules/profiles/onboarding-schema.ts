import { z } from "zod";

export const PLATFORMS = [
  "instagram",
  "youtube",
  "x",
  "linkedin",
  "github",
  "behance",
  "dribbble",
  "spotify",
  "twitch",
  "website",
  "other",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const platformLabel: Record<Platform, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  x: "X",
  linkedin: "LinkedIn",
  github: "GitHub",
  behance: "Behance",
  dribbble: "Dribbble",
  spotify: "Spotify",
  twitch: "Twitch",
  website: "Website",
  other: "Link",
};

export const MAX_LINKS = 8;

/** "instagram.com/riya" -> "https://instagram.com/riya"; anything else unchanged. */
export function normaliseUrl(input: string): string {
  const v = input.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) {
    try {
      return new URL(v).toString();
    } catch {
      return v;
    }
  }
  try {
    return new URL(`https://${v}`).toString();
  } catch {
    return v;
  }
}

export const linkSchema = z.object({
  platform: z.enum(PLATFORMS),
  url: z
    .string()
    .max(2048)
    .transform(normaliseUrl)
    .refine((u) => {
      try {
        const url = new URL(u);
        return url.protocol === "https:" && url.hostname.includes(".");
      } catch {
        return false;
      }
    }, "Use a full https:// link."),
});

export const profileBasicsSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Add the name you want visitors to see.")
    .max(60, "Use at most 60 characters."),
  bio: z
    .string()
    .trim()
    .max(500, "Use at most 500 characters.")
    .transform((b) => (b.length === 0 ? null : b)),
});
