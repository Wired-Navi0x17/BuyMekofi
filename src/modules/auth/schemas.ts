import { z } from "zod";

export const PASSWORD_MIN = 10;
const PASSWORD_MAX = 128;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "That email address is too long.")
  .pipe(z.email("Enter a valid email address."));

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
  .max(PASSWORD_MAX, `Use at most ${PASSWORD_MAX} characters.`);

export const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "The two passwords do not match.",
  });

export const DEFAULT_AFTER_LOGIN = "/dashboard";

/**
 * Only allow same-origin relative paths as post-auth redirects, so the
 * `next` parameter cannot be used as an open redirect.
 */
export function safeNextPath(input: string | null | undefined): string {
  if (!input) return DEFAULT_AFTER_LOGIN;
  let decoded: string;
  try {
    decoded = decodeURIComponent(input);
  } catch {
    return DEFAULT_AFTER_LOGIN;
  }
  for (const candidate of [input, decoded]) {
    if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
      return DEFAULT_AFTER_LOGIN;
    }
  }
  try {
    const url = new URL(input, "http://local.invalid");
    if (url.origin !== "http://local.invalid") return DEFAULT_AFTER_LOGIN;
    // Validate the normalised output too: "/.//evil.example" normalises to
    // "//evil.example", a protocol-relative URL to another host.
    const out = url.pathname + url.search;
    if (!out.startsWith("/") || out.startsWith("//") || out.includes("\\")) {
      return DEFAULT_AFTER_LOGIN;
    }
    return out;
  } catch {
    return DEFAULT_AFTER_LOGIN;
  }
}

export type FieldErrors = Partial<Record<string, string>>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
