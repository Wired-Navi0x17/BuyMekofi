import Link from "next/link";
import { AdminHeading, formatWhen } from "@/components/admin/ui";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/modules/auth/admin";

export default async function AdminOverview() {
  await requireAdmin();
  const db = createSupabaseAdminClient();
  const [all, live, suspended, audit] = await Promise.all([
    db.from("creator_profiles").select("*", { count: "exact", head: true }),
    db
      .from("creator_profiles")
      .select("*", { count: "exact", head: true })
      .not("published_at", "is", null)
      .eq("status", "active"),
    db
      .from("creator_profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "suspended"),
    db
      .from("audit_logs")
      .select("id, action, entity_type, entity_id, actor_kind, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const stats = [
    { label: "Creators", value: all.count ?? 0, href: "/admin/creators" },
    { label: "Live pages", value: live.count ?? 0, href: "/admin/creators" },
    { label: "Suspended", value: suspended.count ?? 0, href: "/admin/creators?status=suspended" },
  ];

  return (
    <>
      <AdminHeading
        title="Overview"
        lead="Live counts from the database. Nothing here is estimated."
      />
      <dl className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="block panel p-4 hover:bg-ink hover:text-sheet"
          >
            <dt className="text-sm">{s.label}</dt>
            <dd className="mt-1 font-display text-3xl tabular">{s.value}</dd>
          </Link>
        ))}
      </dl>
      <section className="mt-10">
        <h2 className="font-display text-lg">Latest activity</h2>
        {audit.data?.length ? (
          <ol className="mt-3 divide-y divide-rule border-y-2 border-ink">
            {audit.data.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                <span>
                  <span className="font-semibold">{a.action}</span>{" "}
                  <span className="text-ink-soft">
                    {a.entity_type} {a.entity_id?.slice(0, 18)}
                  </span>
                </span>
                <span className="tabular text-ink-soft">{formatWhen(a.created_at)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-ink-soft">No activity recorded yet.</p>
        )}
      </section>
    </>
  );
}
