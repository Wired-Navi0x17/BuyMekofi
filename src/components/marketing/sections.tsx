import { brand, profileUrlFor } from "@/config/brand";
import { launchTerms } from "@/config/launch-terms";
import { formatBps, formatInr, paise } from "@/lib/money";
import { calculateCommission } from "@/modules/commission/calculate";

const container = "mx-auto max-w-6xl px-4 md:px-8";

const steps = [
  {
    title: "Claim your username",
    body: `Your page lives at ${profileUrlFor("yourname")}. Short, lowercase, and yours as long as the account is active.`,
  },
  {
    title: "Put your work on it",
    body: "Add a photo, a short bio, your social links and the projects you want people to see first. The page is useful before anyone pays you anything.",
  },
  {
    title: "Share one link",
    body: "Put it in your Instagram bio, your YouTube description, your newsletter footer. Visitors see your work and, at the bottom, a way to support it.",
  },
  {
    title: "Get supported",
    body: "Supporters pay without creating an account. They choose whether their name appears on your page.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="border-t border-rule section-gap"
    >
      <div className={`${container} grid gap-10 md:grid-cols-[1fr_1.5fr] md:gap-16`}>
        <h2
          id="how-title"
          className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1] tracking-tight text-balance md:sticky md:top-10 md:self-start"
        >
          From sign-up to your first supporter.
        </h2>
        <ol className="divide-y divide-rule border-y border-rule">
          {steps.map((step, i) => (
            <li key={step.title} className="grid grid-cols-[3rem_1fr] gap-4 py-6">
              <span className="pt-0.5 tabular text-sm text-cherry">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-lg font-medium">{step.title}</h3>
                <p className="mt-1.5 max-w-[60ch] leading-relaxed text-ink-soft">{step.body}</p>
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
    <section aria-labelledby="routes-title" className="border-t border-rule section-gap">
      <div className={container}>
        <h2
          id="routes-title"
          className="max-w-[24ch] font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1] tracking-tight text-balance"
        >
          Two ways money can reach you.
        </h2>
        <p className="mt-4 max-w-[60ch] leading-relaxed text-ink-soft">
          They work differently, so the support panel shows them as two separate choices and says
          plainly what each one means.
        </p>
        <div className="mt-12 grid gap-12 md:grid-cols-2 md:gap-0">
          {routes.map((route, i) => (
            <div
              key={route.name}
              className={i === 1 ? "md:border-l md:border-rule md:pl-10" : "md:pr-10"}
            >
              <h3 className="text-xl font-medium">{route.name}</h3>
              <p className="mt-1.5 leading-relaxed text-ink-soft">{route.summary}</p>
              <dl className="mt-6 divide-y divide-rule border-y border-rule">
                {route.rows.map(([term, detail]) => (
                  <div
                    key={term}
                    className="grid grid-cols-[10rem_1fr] gap-4 py-3 text-[0.9375rem]"
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
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="border-t border-rule section-gap"
    >
      <div className={`${container} grid gap-12 md:grid-cols-[1.5fr_1fr] md:gap-16`}>
        <div>
          <h2
            id="pricing-title"
            className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1] tracking-tight text-balance"
          >
            You pay when you are paid. Not before.
          </h2>
          <table className="mt-10 w-full border-collapse text-left">
            <caption className="sr-only">{brand.name} pricing</caption>
            <thead>
              <tr className="border-b border-ink text-sm">
                <th scope="col" className="pb-2 font-normal text-ink-soft">
                  What
                </th>
                <th scope="col" className="pb-2 text-right font-normal text-ink-soft">
                  Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {rows.map(([what, rate, note]) => (
                <tr key={what}>
                  <th scope="row" className="py-4 pr-6 align-top font-normal">
                    <span className="block font-medium">{what}</span>
                    <span className="mt-0.5 block text-sm text-ink-soft">{note}</span>
                  </th>
                  <td className="py-4 text-right align-top tabular text-lg">{rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside aria-labelledby="example-title" className="md:pt-24">
          <h3 id="example-title" className="text-sm font-medium">
            Worked example, after the voucher period
          </h3>
          <dl className="mt-3 border-t border-ink text-[0.9375rem]">
            <div className="flex justify-between border-b border-rule py-3">
              <dt>Contribution</dt>
              <dd className="tabular">{formatInr(example.amountPaise)}</dd>
            </div>
            <div className="flex justify-between border-b border-rule py-3">
              <dt className="text-ink-soft">Commission at {formatBps(example.rateBps)}</dt>
              <dd className="tabular text-ink-soft">−{formatInr(example.commissionPaise)}</dd>
            </div>
            <div className="flex justify-between border-b border-ink py-3 font-medium">
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
    <section id="faq" aria-labelledby="faq-title" className="border-t border-rule section-gap">
      <div className={`${container} grid gap-10 md:grid-cols-[1fr_1.5fr] md:gap-16`}>
        <h2
          id="faq-title"
          className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1] tracking-tight text-balance"
        >
          Questions, answered plainly.
        </h2>
        <div className="divide-y divide-rule border-y border-rule">
          {faqs.map((f) => (
            <details key={f.q} className="group py-1">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-3 text-lg font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden
                  className="tabular text-xl text-ink-soft transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-[62ch] pb-5 leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-ink">
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
