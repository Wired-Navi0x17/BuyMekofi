"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normaliseUsername, usernameProblemText, validateUsernameFormat } from "./username";

export type ClaimState = { error?: string; value?: string; ok?: boolean };

/** Format + availability. Nothing is reserved: the unique constraint decides at onboarding. */
async function checkUsername(raw: unknown): Promise<ClaimState> {
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
  return { ok: true, value };
}

/** Landing-page claim box: if free, go to registration with the name prefilled. */
export async function claimUsername(_prev: ClaimState, form: FormData): Promise<ClaimState> {
  const result = await checkUsername(form.get("username"));
  if (!result.ok || !result.value) return result;
  redirect(`/register?username=${encodeURIComponent(result.value)}`);
}

/** Step 1 of registration: same check, but the form moves on in place. */
export async function checkUsernameStep(_prev: ClaimState, form: FormData): Promise<ClaimState> {
  return checkUsername(form.get("username"));
}
