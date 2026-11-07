import Link from "next/link";
import { brand } from "@/config/brand";
import { Wordmark } from "@/components/marketing/wordmark";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-[100dvh] grid-rows-[auto_1fr] md:grid-cols-[1fr_1.1fr] md:grid-rows-1">
      <aside className="flex flex-col justify-between border-b border-rule bg-sheet px-4 py-6 md:border-r md:border-b-0 md:px-10 md:py-10">
        <Link href="/" aria-label={`${brand.name} home`} className="block w-44 text-ink md:w-60">
          <Wordmark />
        </Link>
        <p className="mt-6 hidden max-w-[34ch] font-display text-3xl leading-tight text-ink-soft italic md:block">
          {brand.tagline}
        </p>
      </aside>
      <main className="flex items-start px-4 py-10 md:items-center md:px-16">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
