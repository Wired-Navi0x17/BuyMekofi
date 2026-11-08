import { AdminHeading, formatWhen } from "@/components/admin/ui";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/modules/auth/admin";

export default async function AdminAudit() {
  await requireAdmin();
  const { data } = await createSupabaseAdminClient()
    .from("audit_logs")
    .select("id, actor_id, actor_kind, action, entity_type, entity_id, after, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <>
      <AdminHeading
        title="Audit log"
        lead="Append-only. The newest 200 entries; nothing here can be edited or deleted."
      />
      {data?.length ? (
        <div className="overflow-x-auto border-2 border-ink">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="border-b-2 border-ink bg-sheet">
              <tr>
                <th scope="col" className="px-3 py-2">
                  When (IST)
                </th>
                <th scope="col" className="px-3 py-2">
                  Action
                </th>
                <th scope="col" className="px-3 py-2">
                  Actor
                </th>
                <th scope="col" className="px-3 py-2">
                  Entity
                </th>
                <th scope="col" className="px-3 py-2">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {data.map((a) => (
                <tr key={a.id} className="align-top">
                  <td className="px-3 py-2 tabular whitespace-nowrap text-ink-soft">
                    {formatWhen(a.created_at)}
                  </td>
                  <td className="px-3 py-2 font-semibold">{a.action}</td>
                  <td className="px-3 py-2">
                    {a.actor_kind}
                    <span className="block text-xs tabular text-ink-soft">
                      {a.actor_id?.slice(0, 8) ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 tabular text-ink-soft">
                    {a.entity_type}
                    <span className="block text-xs">{a.entity_id?.slice(0, 24)}</span>
                  </td>
                  <td className="max-w-[28ch] px-3 py-2">
                    <code
                      className="block truncate text-xs text-ink-soft"
                      title={JSON.stringify(a.after)}
                    >
                      {a.after ? JSON.stringify(a.after) : "—"}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-ink-soft">Nothing has been recorded yet.</p>
      )}
    </>
  );
}
