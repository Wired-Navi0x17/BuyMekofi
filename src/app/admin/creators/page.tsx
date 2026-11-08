import Link from "next/link";
import { AdminHeading, formatWhen } from "@/components/admin/ui";
import { CreatorStatusControl } from "@/components/admin/creator-status";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/modules/auth/admin";

export default async function AdminCreators({ searchParams }: PageProps<"/admin/creators">) {
  await requireAdmin();
  const sp = await searchParams;
  const q =
    typeof sp.q === "string"
      ? sp.q
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "")
          .slice(0, 30)
      : "";
  const status = sp.status === "suspended" ? "suspended" : null;

  let query = createSupabaseAdminClient()
    .from("creator_profiles")
    .select("user_id, username, display_name, status, suspended_reason, published_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) query = query.ilike("username", `%${q}%`);
  if (status) query = query.eq("status", status);
  const { data: creators } = await query;

  return (
    <>
      <AdminHeading
        title="Creators"
        lead="Suspending hides a creator's page immediately. Reinstating brings it back."
      />
      <form className="mb-5 flex flex-wrap gap-2" role="search">
        <label htmlFor="q" className="sr-only">
          Search by username
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Search username"
          className="min-h-10 border-2 border-ink bg-sheet px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          aria-label="Status"
          className="min-h-10 border-2 border-ink bg-sheet px-2 text-sm"
        >
          <option value="">All</option>
          <option value="suspended">Suspended only</option>
        </select>
        <button
          type="submit"
          className="min-h-10 border-2 border-ink bg-ink px-4 text-sm font-medium text-sheet"
        >
          Filter
        </button>
      </form>
      {creators?.length ? (
        <div className="overflow-x-auto border-2 border-ink">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="border-b-2 border-ink bg-sheet">
              <tr>
                <th scope="col" className="px-3 py-2">
                  Creator
                </th>
                <th scope="col" className="px-3 py-2">
                  Page
                </th>
                <th scope="col" className="px-3 py-2">
                  Joined
                </th>
                <th scope="col" className="px-3 py-2">
                  Status
                </th>
                <th scope="col" className="px-3 py-2">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {creators.map((c) => (
                <tr key={c.user_id} className="align-top">
                  <td className="px-3 py-2">
                    <span className="font-medium">{c.display_name}</span>
                    <span className="block tabular text-ink-soft">@{c.username}</span>
                  </td>
                  <td className="px-3 py-2">
                    {c.published_at ? (
                      <Link href={`/${c.username}`} className="underline underline-offset-4">
                        View
                      </Link>
                    ) : (
                      <span className="text-ink-soft">Not published</span>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular text-ink-soft">{formatWhen(c.created_at)}</td>
                  <td className="px-3 py-2">
                    {c.status === "suspended" ? (
                      <>
                        <span className="font-semibold">Suspended</span>
                        <span className="block text-xs text-ink-soft">{c.suspended_reason}</span>
                      </>
                    ) : (
                      "Active"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <CreatorStatusControl
                      userId={c.user_id}
                      username={c.username}
                      status={c.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-ink-soft">
          {q || status ? "No creators match that filter." : "No creators have signed up yet."}
        </p>
      )}
    </>
  );
}
