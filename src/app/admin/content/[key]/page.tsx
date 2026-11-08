import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeading, formatWhen } from "@/components/admin/ui";
import { ContentEditor, RestoreButton } from "@/components/admin/content-editor";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/modules/auth/admin";
import { contentDefaults, contentLabels, isContentKey, parseContent } from "@/modules/cms/content";

export default async function AdminContentKey({ params }: PageProps<"/admin/content/[key]">) {
  await requireAdmin();
  const { key } = await params;
  if (!isContentKey(key)) notFound();

  const db = createSupabaseAdminClient();
  const [{ data: draft }, { data: live }, { data: versions }] = await Promise.all([
    db.from("site_content_drafts").select("draft, updated_at").eq("key", key).maybeSingle(),
    db.from("site_content").select("value, published_at").eq("key", key).maybeSingle(),
    db
      .from("site_content_versions")
      .select("id, created_at")
      .eq("key", key)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const start = [draft?.draft, live?.value, contentDefaults[key]]
    .map((v) => parseContent(key, v))
    .find((p) => p.success);

  return (
    <>
      <Link href="/admin/content" className="text-sm underline underline-offset-4">
        ← Site content
      </Link>
      <div className="mt-3">
        <AdminHeading
          title={contentLabels[key].title}
          lead={`${contentLabels[key].where}. ${live ? `Live since ${formatWhen(live.published_at)}.` : "Currently showing the built-in copy."}`}
        />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <ContentEditor
          contentKey={key}
          initial={start?.success ? start.data : contentDefaults[key]}
        />
        <aside aria-labelledby="history-title">
          <h2 id="history-title" className="font-display text-lg">
            History
          </h2>
          {versions?.length ? (
            <ol className="mt-3 divide-y divide-rule border-y-2 border-ink">
              {versions.map((v, i) => (
                <li key={v.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="tabular">
                    {formatWhen(v.created_at)}
                    {i === 0 && <span className="block text-xs text-ink-soft">live</span>}
                  </span>
                  {i > 0 && <RestoreButton contentKey={key} versionId={v.id} />}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">Nothing published yet.</p>
          )}
        </aside>
      </div>
    </>
  );
}
