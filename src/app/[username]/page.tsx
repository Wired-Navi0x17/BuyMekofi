import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CafePage } from "@/components/creator/cafe-page";
import { getPublicPage } from "@/modules/profiles/public-page";

/**
 * Creator pages are statically generated on first visit and cached (ISR),
 * then refreshed by updateTag(creatorTag(username)) on publish. Cache
 * Components requires at least one param; "coffea" is a reserved name, so it
 * prerenders as a 404 and real pages are generated on demand.
 */
export function generateStaticParams() {
  return [{ username: "coffea" }];
}

export async function generateMetadata({ params }: PageProps<"/[username]">): Promise<Metadata> {
  const { username } = await params;
  const page = await getPublicPage(username);
  if (!page) return { title: "Page not found" };
  return {
    title: `${page.displayName} (@${page.username})`,
    description: page.bio ?? `Support ${page.displayName}.`,
  };
}

// params and the lookup are awaited before anything streams, so an unknown
// name returns a real 404 status rather than a 200 with not-found content.
export default async function CreatorPage({ params }: PageProps<"/[username]">) {
  const { username } = await params;
  const page = await getPublicPage(username);
  if (!page) notFound();
  return <CafePage page={page} />;
}
