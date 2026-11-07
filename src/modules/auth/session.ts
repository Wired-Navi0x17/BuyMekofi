import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SessionUser = { id: string; email: string | null };

/**
 * Data Access Layer entry point for "who is this?". Verifies the JWT
 * (getClaims) rather than trusting the cookie (getSession). Returns a
 * narrow object so session internals never reach components.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  // Session checks compare token expiry with the clock (Date.now), so they
  // must run per request, never during prerendering (Cache Components).
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  return { id: data.claims.sub, email };
}

/** For protected pages and actions. Redirects to login with a return path. */
export async function requireUser(returnTo: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}
