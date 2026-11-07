import Link from "next/link";
import { brand } from "@/config/brand";
import { ButtonLink } from "@/components/ui/button";
import { Wordmark } from "./wordmark";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3 md:px-8">
        <Link href="/" className="-my-1 block text-ink" aria-label={`${brand.name} home`}>
          <Wordmark className="h-7 w-auto md:h-10" />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-7 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-ink-soft decoration-1 underline-offset-4 hover:text-ink hover:underline"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink href="/login" variant="quiet" className="text-sm">
            Log in
          </ButtonLink>
          <ButtonLink href="/register" size="sm">
            Create your page
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
