#!/usr/bin/env node
// Grant (or with --revoke, remove) the admin role for an existing account.
// Usage: pnpm admin:grant you@example.com   |   pnpm admin:grant you@example.com --revoke
// Needs .env.local (service-role key). Every change is written to audit_logs.
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const [email, flag] = process.argv.slice(2);
if (!email || !email.includes("@")) {
  console.error("Usage: pnpm admin:grant <email> [--revoke]");
  process.exit(1);
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let user;
for (let page = 1; !user; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (data.users.length < 200) break;
}
if (!user) {
  console.error(`No account for ${email}. Register it at /register first.`);
  process.exit(1);
}

const revoke = flag === "--revoke";
const { error } = revoke
  ? await db.from("user_roles").delete().eq("user_id", user.id).eq("role", "admin")
  : await db.from("user_roles").upsert({ user_id: user.id, role: "admin" });
if (error) throw error;
await db.from("audit_logs").insert({
  actor_kind: "system",
  action: revoke ? "role.revoke" : "role.grant",
  entity_type: "user",
  entity_id: user.id,
  after: { role: "admin", via: "scripts/grant-admin.mjs" },
});
console.log(`${revoke ? "Removed" : "Granted"} admin for ${email} (${user.id}).`);
