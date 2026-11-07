"use server";

import { redirect } from "next/navigation";
import { publicEnv } from "@/lib/env/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  credentialsSchema,
  emailSchema,
  fieldErrors,
  newPasswordSchema,
  safeNextPath,
  DEFAULT_AFTER_LOGIN,
  type FieldErrors,
} from "./schemas";
import { normaliseUsername, validateUsernameFormat } from "@/modules/profiles/username";

export type FormState = {
  status: "idle" | "error" | "sent";
  message?: string;
  errors?: FieldErrors;
  email?: string;
};

const str = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
};

function callbackUrl(next: string) {
  return `${publicEnv().NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`;
}

/** Messages for Supabase Auth error codes. Never echo raw provider errors. */
function authErrorMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return "That email and password don't match an account.";
    case "email_not_confirmed":
      return "Confirm your email first. The link is in the message we sent when you registered.";
    case "weak_password":
      return "Choose a stronger password: longer, and not a common one.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Wait a few minutes and try again.";
    case "email_address_not_authorized":
      return "We can't send email to that address yet. Email delivery is still being set up.";
    case "same_password":
      return "Choose a password you haven't used for this account.";
    default:
      return "Something went wrong on our side. Try again in a minute.";
  }
}

export async function signUp(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = credentialsSchema.safeParse({
    email: str(form, "email"),
    password: str(form, "password"),
  });
  if (!parsed.success) {
    return { status: "error", errors: fieldErrors(parsed.error), email: str(form, "email") };
  }

  // A name chosen in the landing claim box is carried as a prefill only;
  // onboarding re-validates it and the unique constraint decides.
  const wanted = validateUsernameFormat(normaliseUsername(str(form, "username")));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: callbackUrl("/onboarding"),
      data: wanted.ok ? { pending_username: wanted.username } : undefined,
    },
  });

  // An already-registered email returns success without a session (Supabase
  // obfuscates it), so the response is identical and does not leak accounts.
  if (error && error.code !== "user_already_exists") {
    return { status: "error", message: authErrorMessage(error.code), email: parsed.data.email };
  }
  return { status: "sent", email: parsed.data.email };
}

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = credentialsSchema.safeParse({
    email: str(form, "email"),
    password: str(form, "password"),
  });
  if (!parsed.success) {
    // Don't reveal password rules on login; just say the pair is wrong.
    return {
      status: "error",
      errors: parsed.error.issues.some((i) => i.path[0] === "email")
        ? { email: "Enter a valid email address." }
        : undefined,
      message: parsed.error.issues.some((i) => i.path[0] === "email")
        ? undefined
        : authErrorMessage("invalid_credentials"),
      email: str(form, "email"),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { status: "error", message: authErrorMessage(error.code), email: parsed.data.email };
  }
  // Creators without a page go straight to setup instead of bouncing via the dashboard.
  const next = safeNextPath(str(form, "next"));
  if (next === DEFAULT_AFTER_LOGIN) {
    const { data: profile } = await supabase
      .from("creator_profiles")
      .select("onboarding_completed_at")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (!profile?.onboarding_completed_at) redirect("/onboarding");
  }
  redirect(next);
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(str(form, "email"));
  if (!parsed.success) {
    return { status: "error", errors: { email: "Enter a valid email address." } };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: callbackUrl("/reset-password"),
  });
  // Same answer whether or not the account exists; only rate limits surface.
  if (
    error &&
    (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit")
  ) {
    return { status: "error", message: authErrorMessage(error.code), email: parsed.data };
  }
  return { status: "sent", email: parsed.data };
}

export async function updatePassword(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse({
    password: str(form, "password"),
    confirm: str(form, "confirm"),
  });
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return {
      status: "error",
      message: "This reset link has expired. Request a new one from the login page.",
    };
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", message: authErrorMessage(error.code) };
  redirect("/dashboard");
}
