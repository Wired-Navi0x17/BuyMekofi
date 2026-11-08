import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/marketing/wordmark";
import { requireAdmin } from "@/modules/auth/admin";
import { signOut } from "@/modules/auth/actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

/**
 * Blocking on purpose (instant = false): the admin check runs before anything
 * streams, so non-admins get a real 404 status, not a 200 with not-found UI.
 */
export const instant = false;

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/creators", label: "Creators" },
  { href: "/admin/content", label: "Site content" },
  { href: "/admin/audit", label: "Audit log" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-[100dvh] bg-paper">
      <header className="border-b-2 border-ink">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="Home">
              <Wordmark className="h-6 w-auto" />
            </Link>
            <span className="bg-ink px-2 py-0.5 text-xs font-semibold tracking-wide text-sheet uppercase">
              Admin
            </span>
          </div>
          <nav aria-label="Admin" className="flex flex-wrap gap-5 text-sm">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="underline-offset-4 hover:underline">
                {n.label}
              </Link>
            ))}
          </nav>
          <form action={signOut} className="flex items-center gap-3 text-sm text-ink-soft">
            <span className="hidden sm:inline">{admin.email}</span>
            <button type="submit" className="underline underline-offset-4 hover:text-ink">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
