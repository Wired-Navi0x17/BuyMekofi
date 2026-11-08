import { createHmac } from "node:crypto";

/** Fixed-window limits for the auth surfaces (SECURITY.md section 6). */
export const AUTH_LIMITS = {
  login: { max: 5, windowSeconds: 15 * 60 },
  signup: { max: 5, windowSeconds: 15 * 60 },
  recovery: { max: 5, windowSeconds: 15 * 60 },
  // Supabase itself refuses a second email within a minute; this caps abuse of the button.
  resend: { max: 3, windowSeconds: 60 * 60 },
  confirm: { max: 10, windowSeconds: 15 * 60 },
  // Coarse per-address ceiling across all emails, against spraying many accounts.
  ip: { max: 40, windowSeconds: 15 * 60 },
} as const;

export type AuthLimit = keyof typeof AUTH_LIMITS;

/**
 * HMAC of the scope and parts. Parts are length-prefixed so ["ab","c"] and
 * ["a","bc"] differ, and emails are lower-cased. Nothing identifying is stored.
 */
export function rateKey(scope: string, parts: string[], pepperBase64: string): string {
  const material = [scope, ...parts.map((p) => p.trim().toLowerCase())]
    .map((p) => `${p.length}:${p}`)
    .join("|");
  return createHmac("sha256", Buffer.from(pepperBase64, "base64")).update(material).digest("hex");
}

export function waitMessage(retryAfterSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Too many attempts. Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
}
