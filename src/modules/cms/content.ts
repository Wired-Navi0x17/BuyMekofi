import { z } from "zod";
import { brand, profileUrlFor } from "@/config/brand";

/**
 * Site CMS content (Milestone 5). Each key has a schema and a default. The
 * defaults are the copy the site shipped with, so an unpublished key renders
 * exactly as before. Text is plain (React escapes it): no HTML, no markdown.
 */

const line = (max: number) =>
  z.string().trim().min(1, "Required.").max(max, `At most ${max} characters.`);
const para = (max: number) => z.string().trim().max(max, `At most ${max} characters.`);

/** Announcement links: a same-origin path or a full https URL. */
const safeHref = z
  .string()
  .trim()
  .max(500)
  .refine((h) => {
    if (h === "") return true;
    if (h.startsWith("/") && !h.startsWith("//") && !h.includes("\\")) return true;
    try {
      return new URL(h).protocol === "https:";
    } catch {
      return false;
    }
  }, "Use a path like /pricing or a full https:// link.");

export const contentSchemas = {
  "landing.hero": z.object({
    title: line(120),
    highlight: line(120),
    body: para(600),
    status: para(300),
  }),
  "landing.steps": z.object({
    title: line(120),
    items: z
      .array(z.object({ sfx: line(14), title: line(80), body: para(500) }))
      .length(4, "The steps page has exactly four panels."),
  }),
  "landing.faq": z.object({
    title: line(120),
    items: z
      .array(z.object({ q: line(160), a: para(1200) }))
      .min(1)
      .max(20),
  }),
  "landing.pricing_note": z.object({ body: para(600) }),
  "site.announcement": z
    .object({
      enabled: z.boolean(),
      text: para(200),
      linkLabel: para(40),
      linkHref: safeHref,
    })
    .refine((a) => !a.enabled || a.text.length > 0, {
      message: "Write the announcement, or turn it off.",
      path: ["text"],
    })
    .refine((a) => (a.linkLabel === "") === (a.linkHref === ""), {
      message: "A link needs both a label and an address.",
      path: ["linkHref"],
    }),
} as const;

export type ContentKey = keyof typeof contentSchemas;
export type Content<K extends ContentKey> = z.infer<(typeof contentSchemas)[K]>;
export const CONTENT_KEYS = Object.keys(contentSchemas) as ContentKey[];

export const contentLabels: Record<ContentKey, { title: string; where: string }> = {
  "landing.hero": {
    title: "Homepage hero",
    where: "Headline and intro at the top of the homepage",
  },
  "landing.steps": { title: "How it works", where: "The four comic panels" },
  "landing.faq": { title: "FAQ", where: "Questions at the bottom of the homepage" },
  "landing.pricing_note": { title: "Pricing note", where: "The note under the worked example" },
  "site.announcement": {
    title: "Announcement bar",
    where: "A one-line bar above the homepage header",
  },
};

export const contentDefaults: { [K in ContentKey]: Content<K> } = {
  "landing.hero": {
    title: "A page as personal as your own website.",
    highlight: "And a way to get paid for it.",
    body: `Shape it however you like: layouts, typefaces, colours, backgrounds, collages, tabs and hover details. Your portfolio lives there, and so does a support panel. The page costs nothing; we charge commission only on contributions processed through ${brand.name}.`,
    status: `${brand.name} is in development. You can create an account now; pages and payments open as they are finished, and this page will say so.`,
  },
  "landing.steps": {
    title: "From sign-up to your first supporter, in four panels.",
    items: [
      {
        sfx: "Claim",
        title: "Claim your username",
        body: `Your page lives at ${profileUrlFor("yourname")}. Short, lowercase, and yours as long as the account is active.`,
      },
      {
        sfx: "Design",
        title: "Design it like your own site",
        body: "Choose a layout, then change everything about it: typefaces, colours, backgrounds, image shapes, sections and the way things move on hover. Add your work and the projects you want seen first. The page is useful before anyone pays you anything.",
      },
      {
        sfx: "Share",
        title: "Share one link",
        body: "Put it in your Instagram bio, your YouTube description, your newsletter footer. Visitors see your work and, at the bottom, a way to support it.",
      },
      {
        sfx: "Support",
        title: "Get supported",
        body: "Supporters pay without creating an account. They choose whether their name appears on your page.",
      },
    ],
  },
  "landing.faq": {
    title: "Questions, answered plainly.",
    items: [
      {
        q: `Is ${brand.name} open?`,
        a: "Not yet. We are building it now. Accounts open first; contributions through the page open once a licensed payment provider approves our marketplace account.",
      },
      {
        q: "Do I pay anything if nobody supports me?",
        a: "No. There is no subscription. Commission is a share of a successful contribution, so with no contributions there is nothing to pay.",
      },
      {
        q: "What is the welcome voucher?",
        a: "A one-time offer for new creators: one or two calendar months at 0% commission, starting when you claim it in your dashboard. It counts calendar months, so a voucher claimed on 31 January runs to the last day of February. One per person.",
      },
      {
        q: "Can supporters stay anonymous?",
        a: "On your page, yes: a supporter can choose not to have their name shown. That is public anonymity only. Banks and the payment provider always know who paid, and with direct UPI you will see the payer's name in your own UPI app.",
      },
      {
        q: `Does ${brand.name} hold my money?`,
        a: "No. Direct UPI goes straight to you. Contributions through the page are settled to your bank by the payment provider; we receive only our commission. There is no wallet.",
      },
      {
        q: "Which payment methods will supporters have?",
        a: "Direct UPI from any UPI app. Through the page: UPI, debit and credit cards, and net banking, subject to what our payment provider supports for this kind of account.",
      },
    ],
  },
  "landing.pricing_note": {
    body: "Payment-provider processing charges and GST on our commission are not settled yet. We will publish them here before contributions open, and your dashboard will itemise them on every payment.",
  },
  "site.announcement": { enabled: false, text: "", linkLabel: "", linkHref: "" },
};

export function isContentKey(k: string): k is ContentKey {
  return (CONTENT_KEYS as string[]).includes(k);
}

export function parseContent<K extends ContentKey>(key: K, value: unknown) {
  return contentSchemas[key].safeParse(value) as z.ZodSafeParseResult<Content<K>>;
}
