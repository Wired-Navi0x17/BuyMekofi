import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = () => required("NEXT_PUBLIC_SUPABASE_URL");
const publishable = () => required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set (integration tests need .env.local)`);
  return v;
}

const noPersist = { auth: { persistSession: false, autoRefreshToken: false } };

export const admin = () => createClient(url(), required("SUPABASE_SECRET_KEY"), noPersist);
export const anon = () => createClient(url(), publishable(), noPersist);

export type TestUser = { id: string; email: string; client: SupabaseClient };

/** Creates a confirmed throwaway user and returns a client signed in as them. */
export async function createTestUser(label: string): Promise<TestUser> {
  const email = `it-${label}-${randomUUID().slice(0, 8)}@example.test`;
  const password = `pw-${randomUUID()}`;
  const { data, error } = await admin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("createUser failed");
  const client = anon();
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { id: data.user.id, email, client };
}

/**
 * Removes a test user. Their uploads are deleted first: Supabase refuses to
 * delete a user who still owns storage objects. Fails loudly, so leaked test
 * accounts are noticed instead of piling up in the dev project.
 */
export async function deleteTestUser(user: TestUser | undefined) {
  if (!user) return;
  const db = admin();
  for (const bucket of ["avatars", "covers", "page-media"]) {
    const { data } = await db.storage.from(bucket).list(user.id);
    if (data?.length) await db.storage.from(bucket).remove(data.map((f) => `${user.id}/${f.name}`));
  }
  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) throw new Error(`Could not delete test user ${user.email}: ${error.message}`);
}

export const uniqueUsername = (prefix: string) =>
  `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 10)}`;
