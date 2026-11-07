import { brand, profileUrlFor } from "@/config/brand";
import { launchTerms } from "@/config/launch-terms";
import { formatBps, formatInr, paise } from "@/lib/money";
import { calculateCommission } from "@/modules/commission/calculate";

const container = "mx-auto max-w-6xl px-4 md:px-8";

const steps = [
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
];

export function HowItWorks() {
  // A manga page, not a card row: panels of different sizes and tones,
  // read in order, with the last one framed by focus lines.
  const layout = ["md:col-span-6", "md:col-span-3", "md:col-span-3", "md:col-span-6"];
  const tones = ["tone-light", "tone-mid", "", ""];
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="section-gap">
      <div className={container}>
        <h2
          id="how-title"
          className="max-w-[22ch] font-display text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.06] tracking-[-0.01em] text-balance"
        >
          From sign-up to your first supporter, in four panels.
        </h2>
        <ol className="mt-10 grid gap-3 md:grid-cols-6">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className={`relative overflow-hidden panel p-5 md:p-7 ${layout[i]}`}
            >
              {tones[i] && (
                <div
                  aria-hidden
                  className={`pointer-events-none absolute inset-y-0 right-0 w-2/3 opacity-20 ${tones[i]} [mask-image:linear-gradient(to_left,black,transparent)]`}
                />
              )}
              {i === 3 && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 speedlines [mask-image:radial-gradient(closest-side_at_85%_50%,black,transparent)]"
                />
              )}
              <div className="relative">
                <span className="inline-block bg-ink px-2 py-0.5 text-xs tabular text-sheet">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p
                  aria-hidden
                  className="mt-4 font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-none text-shu"
                >
                  {step.sfx}
                </p>
                <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
                <p className="mt-1.5 max-w-[56ch] leading-relaxed text-ink-soft">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const routes = [
  {
    name: "Direct UPI",
    summary: "The supporter pays your UPI ID from their own UPI app.",
    rows: [
      ["Where the money goes", "Straight to your bank account"],
      ["Our fee", "None. We never touch this money"],
      ["Shown on your page", "No. We cannot confirm it happened"],
      ["Supporter's name", "Visible to you in your UPI app. Never anonymous"],
      ["Status", "Available when accounts open"],
    ],
  },
  {
    name: `Through ${brand.name}`,
    summary:
      "UPI, debit and credit cards, and net banking, handled by a licensed payment provider.",
    rows: [
      ["Where the money goes", "Provider settles your share to your bank. We never hold it"],
      ["Our fee", "Commission on each successful contribution"],
      ["Shown on your page", "Yes, in your supporter activity"],
      ["Supporter's name", "Their choice to show publicly; your payment provider still sees it"],
      ["Status", "Opens after our payment provider approves the account"],
    ],
  },
] as const;

export function PaymentRoutes() {
  return (
    <section aria-labelledby="routes-title" className="section-gap">
      <div className={container}>
        <h2
          id="routes-title"
          className="max-w-[24ch] font-display text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.06] tracking-[-0.01em] text-balance"
        >
          Two ways money can reach you.
        </h2>
        <p className="mt-4 max-w-[60ch] leading-relaxed text-ink-soft">
          They work differently, so the support panel shows them as two separate choices and says
          plainly what each one means.
        </p>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {routes.map((route) => (
            <div key={route.name} className="panel p-5 md:p-7">
              <h3 className="font-display text-2xl">{route.name}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{route.summary}</p>
              <dl className="mt-6 divide-y divide-rule border-y-2 border-ink">
                {route.rows.map(([term, detail]) => (
                  <div
                    key={term}
                    className="grid gap-1 py-3 text-[0.9375rem] sm:grid-cols-[10rem_1fr] sm:gap-4"
                  >
                    <dt className="text-ink-soft">{term}</dt>
                    <dd>{detail}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  const months = launchTerms.welcomeVoucherMonths.join(" or ");
  const example = calculateCommission(paise(50_000), launchTerms.gatewayCommissionBps);
  const rows = [
    ["Your account and your page", "₹0", "No monthly fee, no plan to upgrade to"],
    ["Contributions by direct UPI", "0%", "We are not in the money path"],
    [
      `Contributions through ${brand.name}, during your welcome voucher`,
      formatBps(launchTerms.welcomeVoucherBps),
      `New creators can claim ${months} calendar months at zero commission`,
    ],
    [
      `Contributions through ${brand.name}, after that`,
      formatBps(launchTerms.gatewayCommissionBps),
      "Charged only when a contribution succeeds",
    ],
  ] as const;

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="section-gap">
      <div className={`${container} grid gap-10 md:grid-cols-[1.5fr_1fr] md:gap-14`}>
        <div>
          <h2
            id="pricing-title"
            className="font-display text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.06] tracking-[-0.01em] text-balance"
          >
            You pay when you are paid. Not before.
          </h2>
          {/* The pricing is a café menu: item, dotted leader, price. */}
          <div className="mt-10 panel p-5 press-shadow md:p-8">
            <p className="font-display text-xl">Menu</p>
            <table className="mt-4 w-full border-collapse text-left">
              <caption className="sr-only">{brand.name} pricing</caption>
              <thead className="sr-only">
                <tr>
                  <th scope="col">What</th>
                  <th scope="col">Rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([what, rate, note]) => (
                  <tr key={what} className="align-baseline">
                    <th scope="row" className="py-3 pr-3 font-normal">
                      <span className="flex items-baseline gap-2">
                        <span className="font-medium">{what}</span>
                        <span
                          aria-hidden
                          className="min-w-6 flex-1 translate-y-[-0.2em] border-b-2 border-dotted border-ink-faint"
                        />
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-soft">{note}</span>
                    </th>
                    <td className="py-3 text-right text-xl font-medium tabular">{rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside aria-labelledby="example-title" className="md:pt-28">
          <h3 id="example-title" className="text-sm font-medium">
            Worked example, after the voucher period
          </h3>
          <dl className="mt-3 border-t-2 border-ink text-[0.9375rem]">
            <div className="flex justify-between border-b border-rule py-3">
              <dt>Contribution</dt>
              <dd className="tabular">{formatInr(example.amountPaise)}</dd>
            </div>
            <div className="flex justify-between border-b border-rule py-3">
              <dt className="text-ink-soft">Commission at {formatBps(example.rateBps)}</dt>
              <dd className="tabular text-ink-soft">−{formatInr(example.commissionPaise)}</dd>
            </div>
            <div className="flex justify-between border-b-2 border-ink py-3 font-medium">
              <dt>Your share</dt>
              <dd className="tabular">{formatInr(example.creatorSharePaise)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Payment-provider processing charges and GST on our commission are not settled yet. We
            will publish them here before contributions open, and your dashboard will itemise them
            on every payment.
          </p>
        </aside>
      </div>
    </section>
  );
}

const faqs = [
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
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="section-gap">
      <div className={`${container} grid gap-10 md:grid-cols-[1fr_1.5fr] md:gap-16`}>
        <h2
          id="faq-title"
          className="font-display text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.06] tracking-[-0.01em] text-balance md:sticky md:top-10 md:self-start"
        >
          Questions, answered plainly.
        </h2>
        <div className="grid gap-3">
          {faqs.map((f) => (
            <details key={f.q} className="group panel">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 px-5 py-3 text-lg font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden
                  className="grid size-7 shrink-0 place-items-center border-2 border-ink text-base leading-none transition-[transform,background-color,color] duration-200 group-open:rotate-45 group-open:bg-ink group-open:text-sheet"
                >
                  +
                </span>
              </summary>
              {/* Narration box: the answer is boxed like a manga caption. */}
              <p className="mx-5 mb-5 max-w-[62ch] border-l-4 border-ink bg-paper px-4 py-3 leading-relaxed text-ink-soft">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-ink">
      <div
        className={`${container} flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-ink-soft`}
      >
        <p>© 2026 {brand.name}. Built in India.</p>
        <nav aria-label="Footer" className="flex gap-6">
          <a href="#pricing" className="underline decoration-1 underline-offset-4 hover:text-ink">
            Pricing
          </a>
          <a href="#faq" className="underline decoration-1 underline-offset-4 hover:text-ink">
            FAQ
          </a>
        </nav>
      </div>
    </footer>
  );
}
