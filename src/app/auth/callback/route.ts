import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/modules/auth/schemas";
import { publicEnv } from "@/lib/env/public";

/**
 * Landing point for links in auth emails (sign-up confirmation, password
 * recovery). Exchanges the PKCE code for a session cookie, then redirects
 * to a same-origin path only.
 */
export async function GET(request: NextRequest) {
  const site = publicEnv().NEXT_PUBLIC_SITE_URL;
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, site));
  }
  return NextResponse.redirect(new URL("/login?error=link", site));
}
