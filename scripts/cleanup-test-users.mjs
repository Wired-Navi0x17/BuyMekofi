#!/usr/bin/env node
// Lists, and with --yes deletes, accounts created by the test suites.
// Only addresses on the reserved @example.test domain are ever touched.
// Usage: pnpm cleanup:test-users          (list only)
//        pnpm cleanup:test-users --yes    (delete them and their uploads)
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const confirm = process.argv.includes("--yes");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const users = [];
for (let page = 1; ; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  users.push(...data.users);
  if (data.users.length < 200) break;
}
const targets = users.filter((u) => u.email?.toLowerCase().endsWith("@example.test"));
console.log(`${targets.length} test account(s) of ${users.length} total:`);
for (const u of targets) console.log(`  ${u.email}`);
if (!confirm) {
  console.log("\nNothing deleted. Re-run with --yes to delete these accounts.");
  process.exit(0);
}
for (const u of targets) {
  for (const bucket of ["avatars", "covers", "page-media"]) {
    const { data } = await db.storage.from(bucket).list(u.id);
    if (data?.length) await db.storage.from(bucket).remove(data.map((f) => `${u.id}/${f.name}`));
  }
  const { error } = await db.auth.admin.deleteUser(u.id);
  console.log(error ? `  FAILED ${u.email}: ${error.message}` : `  deleted ${u.email}`);
}
