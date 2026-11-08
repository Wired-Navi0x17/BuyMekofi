import { brand } from "@/config/brand";

/**
 * Username format rules. The database enforces the same rule with a check
 * constraint and the reserved list with a trigger (DATABASE.md); this
 * module exists to give people a precise message before they submit.
 */
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

export type UsernameProblem =
  "too_short" | "too_long" | "invalid_chars" | "bad_edges" | "double_separator";

export type UsernameCheck = { ok: true; username: string } | { ok: false; reason: UsernameProblem };

export function normaliseUsername(input: string): string {
  let v = input.trim().toLowerCase();
  v = v.replace(/^https?:\/\//, "");
  const prefix = `${brand.domain}/`;
  if (v.startsWith(prefix)) v = v.slice(prefix.length);
  if (v.startsWith("@")) v = v.slice(1);
  return v;
}

export function validateUsernameFormat(username: string): UsernameCheck {
  if (username.length < USERNAME_MIN) return { ok: false, reason: "too_short" };
  if (username.length > USERNAME_MAX) return { ok: false, reason: "too_long" };
  if (!/^[a-z0-9_-]+$/.test(username)) return { ok: false, reason: "invalid_chars" };
  if (/^[-_]|[-_]$/.test(username)) return { ok: false, reason: "bad_edges" };
  if (/[-_]{2}/.test(username)) return { ok: false, reason: "double_separator" };
  return { ok: true, username };
}

/**
 * Hyphen and underscore count as the same character for uniqueness, so
 * "riya-draws" cannot be registered to impersonate "riya_draws". The
 * database enforces this with a unique index on the same expression.
 */
export function canonicalUsername(username: string): string {
  return username.toLowerCase().replaceAll("-", "_");
}

export const usernameProblemText: Record<UsernameProblem | "taken" | "reserved", string> = {
  too_short: `Use at least ${USERNAME_MIN} characters.`,
  too_long: `Use at most ${USERNAME_MAX} characters.`,
  invalid_chars: "Use only lowercase letters, numbers, hyphens (-) and underscores (_).",
  bad_edges: "Start and end with a letter or number.",
  double_separator: "Use one hyphen or underscore at a time, not two in a row.",
  taken: "Someone already has that name. Try another.",
  reserved: "That name is reserved. Try another.",
};
