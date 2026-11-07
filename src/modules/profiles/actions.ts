"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normaliseUsername, usernameProblemText, validateUsernameFormat } from "./username";

export type ClaimState = { error?: string; value?: string };

/**
 * Landing-page claim box: checks a name and, if free, sends the visitor to
 * registration with it prefilled. Nothing is reserved yet; the name is
 * actually taken when the profile row is created during onboarding, where
 * the unique constraint is the final arbiter.
 */
export async function claimUsername(_prev: ClaimState, form: FormData): Promise<ClaimState> {
  const raw = form.get("username");
  const value = normaliseUsername(typeof raw === "string" ? raw : "");
  const format = validateUsernameFormat(value);
  if (!format.ok) return { error: usernameProblemText[format.reason], value };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("username_availability", { candidate: value });
  if (error) return { error: "We couldn't check that name just now. Try again.", value };
  const status = String(data);
  if (status === "taken" || status === "reserved") {
    return { error: usernameProblemText[status], value };
  }
  if (status !== "available") return { error: usernameProblemText.invalid_chars, value };

  redirect(`/register?username=${encodeURIComponent(value)}`);
}
