import type { ReactNode } from "react";

export function AdminHeading({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <header className="mb-6">
      <h1 className="font-display text-2xl">{title}</h1>
      {lead && <p className="mt-1 max-w-[70ch] text-ink-soft">{lead}</p>}
    </header>
  );
}

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}
