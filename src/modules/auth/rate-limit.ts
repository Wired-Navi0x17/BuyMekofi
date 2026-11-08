import "server-only";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env/server";
import { AUTH_LIMITS, rateKey, type AuthLimit } from "./rate-limit-policy";

export type RateResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

/** First hop of x-forwarded-for, set by the platform proxy; "unknown" when absent. */
async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

async function hit(key: string, max: number, windowSeconds: number): Promise<RateResult> {
  const { data, error } = await createSupabaseAdminClient().rpc("rate_limit_hit", {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max: max,
  });
  // If the limiter itself is down, fail closed: auth endpoints are abuse targets.
  const row = data?.[0];
  if (error || !row) return { allowed: false, retryAfterSeconds: 60 };
  return row.allowed
    ? { allowed: true }
    : { allowed: false, retryAfterSeconds: row.retry_after_seconds };
}

/**
 * Counts one attempt for this client and, when given, this email, against the
 * named limit plus the coarse per-address ceiling. Returns the longest wait if refused.
 */
export async function limitAuth(limit: AuthLimit, email?: string): Promise<RateResult> {
  const pepper = serverEnv().ELIGIBILITY_PEPPER;
  const ip = await clientIp();
  const { max, windowSeconds } = AUTH_LIMITS[limit];
  const checks = [
    hit(rateKey(`${limit}:ip`, [ip], pepper), AUTH_LIMITS.ip.max, AUTH_LIMITS.ip.windowSeconds),
    hit(rateKey(limit, email ? [ip, email] : [ip], pepper), max, windowSeconds),
  ];
  // An email-keyed bucket on its own, so rotating IPs does not unlock one inbox.
  if (email) checks.push(hit(rateKey(`${limit}:email`, [email], pepper), max * 2, windowSeconds));
  const results = await Promise.all(checks);
  const refused = results.filter((r) => !r.allowed);
  if (refused.length === 0) return { allowed: true };
  return {
    allowed: false,
    retryAfterSeconds: Math.max(...refused.map((r) => (r.allowed ? 0 : r.retryAfterSeconds))),
  };
}
