"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setCreatorStatus } from "@/modules/cms/admin-actions";

export function CreatorStatusControl({
  userId,
  username,
  status,
}: {
  userId: string;
  username: string;
  status: "active" | "suspended";
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const run = (next: "active" | "suspended") =>
    start(async () => {
      setError(null);
      const r = await setCreatorStatus(userId, next, reason);
      if (!r.ok) setError(r.error);
      else {
        setOpen(false);
        router.refresh();
      }
    });

  if (status === "suspended") {
    return (
      <div className="grid gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => run("active")}
          className="min-h-9 border-2 border-ink px-3 text-sm font-medium hover:bg-ink hover:text-sheet"
        >
          {pending ? "Reinstating…" : `Reinstate @${username}`}
        </button>
        {error && <p className="text-xs font-medium">{error}</p>}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-9 border-2 border-ink px-3 text-sm font-medium hover:bg-ink hover:text-sheet"
      >
        Suspend…
      </button>
    );
  }

  return (
    <div className="grid gap-2">
      <label className="grid gap-1 text-xs">
        <span className="font-semibold">Reason (kept in the audit log)</span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={300}
          className="min-h-9 border-2 border-ink bg-sheet px-2 text-sm"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run("suspended")}
          className="min-h-9 border-2 border-ink bg-ink px-3 text-sm font-medium text-sheet"
        >
          {pending ? "Suspending…" : `Suspend @${username}`}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm underline">
          Cancel
        </button>
      </div>
      {error && <p className="text-xs font-medium">{error}</p>}
    </div>
  );
}
