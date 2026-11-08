import "server-only";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser, type SessionUser } from "./session";

/**
 * Admin gate for pages and actions. Non-admins, signed in or not, get a 404:
 * the admin area does not confirm its own existence. Role comes from
 * user_roles via has_role(), never from user metadata.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) notFound();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("has_role", { required: "admin" });
  if (error || data !== true) notFound();
  return user;
}
