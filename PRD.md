# Coffea et Thea: Product Requirements

Coffea et Thea is a creator page and support platform for the Indian market. A creator gets one page at `coffeaetthea.in/<username>` that works as a personal site, a portfolio and a place where their audience can pay them. The page has to be useful on its own, even for a creator who never receives a rupee.

"Coffea et Thea" pairs the Latin botanical names of coffee (_Coffea_) and tea (_Thea_): two small drinks you buy someone to say thanks. It is a working name and still needs a trademark search (see Open decisions). It is defined once in `src/config/brand.ts`.

## 1. Users

| User              | What they need                                                                                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Creator**       | An artist, writer, developer, educator or streamer who wants one link that shows their work and lets people support them. They may have no payment provider account and no GST registration. |
| **Supporter**     | Someone visiting a creator's page, usually from a phone and usually paying by UPI. They often have no account and may not want their name shown publicly.                                    |
| **Administrator** | A Coffea et Thea staff member who runs campaigns, inspects payments, handles disputes and reads audit logs.                                                                                  |

## 2. Scope of the first release

### 2.1 Public website

- Landing page. The first visit opens on a paper sheet with the wordmark written in ink, and scrolling burns it away to reveal the page.
- What Coffea et Thea is and how it works, in plain language.
- Pricing, stating the real policy (section 3) and nothing invented.
- FAQ, including what anonymity does and does not mean.
- Links to sign in and sign up.
- A creator discovery page is optional and not part of the first release.

### 2.2 Authentication

Register, log in, log out, password recovery, email verification and session management, all through Supabase Auth. A creator account is created by registering. Supporters need no account.

### 2.3 Creator onboarding

The creator chooses a username, sets their display name and bio, uploads an avatar, adds social links, claims the introductory voucher (optional, and can be done later) and completes onboarding. The public page stays unpublished until onboarding is complete.

### 2.4 Public creator page

Avatar and cover, name, `@username`, bio, social links, portfolio projects with descriptions, featured work, a support section and public support activity.

### 2.5 Creator dashboard

Overview, profile editor, portfolio editor, supporter activity, contribution history, earnings summary, current commission status (the rate that applies now and why), voucher status (claimed or not, and when it expires) and settings.

### 2.6 Administration

Admin access is based on roles stored in the database. It covers creator management, voucher campaign management, payment and webhook inspection, commission reporting, refunds and disputes, audit logs and platform settings.

## 3. Business model

- Creating an account and having a page are free. There is no subscription.
- Coffea et Thea charges a **commission per successful contribution processed through a gateway**. The default rate is **5% (500 basis points)**. The rate is a row in `commission_policies`, not a constant in code.
- A creator who receives nothing pays nothing.
- **Direct UPI** contributions go straight from the supporter to the creator's UPI ID. Coffea et Thea never touches that money and charges no commission on it.
- **Introductory offer:** an eligible new creator can claim one welcome voucher giving 0% commission for 1 or 2 calendar months. Administrators control which durations are offered and whether a campaign is active.

## 4. Vouchers (product behaviour)

1. The creator registers and opens the dashboard.
2. The dashboard shows the introductory offer if the creator is eligible and a campaign is active.
3. The creator claims it. The server validates eligibility, records the redemption and computes the expiry using calendar months in `Asia/Kolkata`.
4. Every gateway contribution until the expiry instant is charged 0%. After that the default policy applies, 5% today.
5. Each payment stores the rate that applied, the policy that produced it and the voucher redemption, if any.

Abuse rules: one introductory voucher per identity. "Identity" is a set of keyed hashes of the normalised email, the verified phone and, later, the payout destination. If any of them has already been used for an introductory claim, a new account is not eligible.

## 5. Supporter privacy

- **Public anonymity:** the supporter chooses whether their name appears in public activity. This is always available.
- **Hiding identity from the creator:** available only for gateway payments, where Coffea et Thea sits between supporter and creator. Even then, the payment provider and the banks keep the supporter's details.
- **Direct UPI is never anonymous to the creator.** Their UPI app shows the payer's name and VPA. The interface says so next to the Direct UPI option, not in a footnote.

## 6. Non-goals for the first release

- No live payment processing until a provider has approved this marketplace model and the founder has explicitly signed off.
- No wallet and no holding of creator funds.
- No storage of card numbers, UPI PINs or bank credentials, ever.
- No memberships, shop or paid posts.
- No mobile app.

## 7. Success criteria for the first release

These are measured on real usage, not seeded data:

- A creator can go from sign-up to a published page in one sitting without help.
- In test mode, a supporter can complete a contribution on a mid-range Android phone over 4G.
- Every test-mode payment can be reconstructed in full from `payment_events` and ledger entries.

## 8. Open decisions (need the founder, legal or a provider)

| #   | Decision                                                                                                                                                                                      | Why it blocks something                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| D1  | **Trademark clearance for "Coffea et Thea"** (IP India, classes 9, 35, 36, 42). Coffee businesses use the word.                                                                               | Rebranding after launch is expensive.                                |
| D2  | **Razorpay Route approval** (provider chosen 2026-11-07: Razorpay). Route must be enabled for the creator-support category, with one linked account per creator.                              | Milestone 10 and any live money.                                     |
| D3  | **RBI Payment Aggregator rules:** confirm that settlement goes directly from the provider to creators so Coffea et Thea never holds funds.                                                    | The architecture assumes Coffea et Thea is not a payment aggregator. |
| D4  | **GST on the commission** (likely 18% on the platform fee) and whether Coffea et Thea needs GST registration from day one.                                                                    | It changes the commission breakdown shown to creators.               |
| D5  | **TDS under section 194-O** for e-commerce operators, and creator PAN collection.                                                                                                             | It may require PAN at payout onboarding.                             |
| D6  | **Creator KYC:** what the provider requires and what Coffea et Thea must collect itself.                                                                                                      | Onboarding steps before payouts.                                     |
| D7  | **Refund policy:** who can refund, the time window, and whether commission is returned to the creator on refund. Proposed: proportional reversal.                                             | Refund handling (Milestone 7).                                       |
| D8  | **Direct UPI activity:** Coffea et Thea cannot verify direct UPI transfers. Proposed: never list them as support activity.                                                                    | The public activity feed must stay truthful.                         |
| D9  | **Whether to show amounts publicly.** Proposed: creator setting, off by default.                                                                                                              | Profile design.                                                      |
| D10 | **Minimum and maximum contribution.** Proposed: ₹10 to ₹50,000, stored in platform settings.                                                                                                  | Validation and abuse.                                                |
| D11 | **DPDP Act 2023:** privacy notice, consent text, data retention, the grievance officer required by the IT Rules 2021, and whether hashed identity markers may be kept after account deletion. | Launch compliance.                                                   |
| D12 | **Production domain** (`coffeaetthea.in` or another).                                                                                                                                         | Reserved routes, email sender, cookies.                              |
