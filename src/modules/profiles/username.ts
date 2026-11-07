import { brand } from "@/config/brand";

/**
 * Username format rules. The database enforces the same rule with a check
 * constraint and the reserved list with a trigger (DATABASE.md); this
 * module exists to give people a precise message before they submit.
 */
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

export type UsernameProblem = "too_short" | "too_long" | "invalid_chars" | "bad_edges";

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
  if (!/^[a-z0-9_]+$/.test(username)) return { ok: false, reason: "invalid_chars" };
  if (username.startsWith("_") || username.endsWith("_")) return { ok: false, reason: "bad_edges" };
  return { ok: true, username };
}

export const usernameProblemText: Record<UsernameProblem | "taken" | "reserved", string> = {
  too_short: `Use at least ${USERNAME_MIN} characters.`,
  too_long: `Use at most ${USERNAME_MAX} characters.`,
  invalid_chars: "Use only lowercase letters, numbers and underscores.",
  bad_edges: "Start and end with a letter or number.",
  taken: "Someone already has that name. Try another.",
  reserved: "That name is reserved. Try another.",
};
