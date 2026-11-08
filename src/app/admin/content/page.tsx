import Link from "next/link";
import { AdminHeading, formatWhen } from "@/components/admin/ui";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/modules/auth/admin";
import { CONTENT_KEYS, contentLabels } from "@/modules/cms/content";

export default async function AdminContent() {
  await requireAdmin();
  const db = createSupabaseAdminClient();
  const [{ data: live }, { data: drafts }] = await Promise.all([
    db.from("site_content").select("key, published_at"),
    db.from("site_content_drafts").select("key, updated_at"),
  ]);
  const liveAt = new Map((live ?? []).map((r) => [r.key, r.published_at as string]));
  const draftAt = new Map((drafts ?? []).map((r) => [r.key, r.updated_at as string]));

  return (
    <>
      <AdminHeading
        title="Site content"
        lead="Edit the homepage without a deploy. Changes stay in a draft until you publish them; every publish is kept as a version."
      />
      <ul className="grid gap-3 md:grid-cols-2">
        {CONTENT_KEYS.map((key) => {
          const published = liveAt.get(key);
          const draft = draftAt.get(key);
          const unpublished = draft && (!published || draft > published);
          return (
            <li key={key}>
              <Link
                href={`/admin/content/${key}`}
                className="panel block p-4 hover:bg-ink hover:text-sheet"
              >
                <span className="font-display text-lg">{contentLabels[key].title}</span>
                <span className="mt-1 block text-sm opacity-80">{contentLabels[key].where}</span>
                <span className="mt-3 block text-xs">
                  {published ? `Published ${formatWhen(published)}` : "Showing the built-in copy"}
                  {unpublished ? " · unpublished draft" : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
