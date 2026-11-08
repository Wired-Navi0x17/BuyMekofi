# Architecture

## 1. Shape: one Next.js app, a modular monolith

```
Browser ──► Next.js 16 (App Router, Node runtime)
              ├── proxy.ts              session refresh, optimistic route gating, security headers
              ├── app/                  routes: thin, call modules, render
              ├── modules/<domain>/     business logic, the only place rules live
              ├── lib/                  env, Supabase clients, money, time
              └── components/           design system + screen compositions
                         │
                         ▼
              Supabase (hosted project cgfrpgivgbqxmrhabbfx)
              ├── Postgres  schema, constraints, RLS, SQL functions for atomic money paths
              ├── Auth      email + password, email verification, recovery
              └── Storage   avatars, covers, portfolio images
                         ▲
Payment provider ──webhook──► app/api/webhooks/[provider]/route.ts
```

**Why a monolith.** One team, one deploy, one database. The parts that need isolation (payments, the ledger) get it from module boundaries and database permissions, not from network hops. Microservices would add distributed-transaction problems to exactly the code paths (money) where we can least afford them.

**Why Supabase.** Postgres gives us real constraints, transactions, row locks and RLS, which the financial model depends on. Auth and Storage come from the same project, so there is one security model. The trade-off is that RLS becomes security-critical and must be tested (see SECURITY.md §3).

**Why Next.js server code and not a separate API.** Server Actions and route handlers share types and validation with the UI, and Server Actions get Origin checking for free. Webhooks are plain route handlers, because they must read the raw body for signature verification.

## 2. Stack (versions pinned in `package.json`)

| Concern       | Choice                                                                                                                                               | Reason                                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Framework     | Next.js 16.4, React 19.3, App Router, Cache Components                                                                                               | Server-first rendering. Public creator pages prerender a static shell.                                                                 |
| Language      | TypeScript strict                                                                                                                                    | —                                                                                                                                      |
| Styling       | Tailwind CSS 4 with tokens in `src/app/globals.css`                                                                                                  | Tokens defined once in CSS (`@theme`).                                                                                                 |
| UI primitives | Own components in `src/components/ui`. shadcn/ui only where a Radix primitive saves real a11y work (dialog, popover, menu), restyled to zero radius. | The default shadcn look conflicts with the design system.                                                                              |
| Validation    | Zod 4                                                                                                                                                | One schema per input, used on the server. A client may reuse it for instant feedback, but the server never trusts the client's result. |
| Database      | Supabase Postgres, SQL migrations in `supabase/migrations`                                                                                           | —                                                                                                                                      |
| Auth          | Supabase Auth via `@supabase/ssr` (cookie sessions)                                                                                                  | —                                                                                                                                      |
| Animation     | CSS first, then GSAP 3 + ScrollTrigger for the landing intro only. Raw WebGL for the burn shader, with no three.js.                                  | Lightest tier that achieves the effect (DESIGN.md §6).                                                                                 |
| Icons         | Phosphor, one weight                                                                                                                                 | —                                                                                                                                      |
| Tests         | Vitest (unit and integration), Playwright (end-to-end)                                                                                               | —                                                                                                                                      |

## 3. Directory layout

```
src/
  app/
    (marketing)/        landing, pricing, faq
    (auth)/             login, register, recover, verify, callback
    onboarding/
    dashboard/          creator-only
    admin/              admin-only
    [username]/         public creator page (reserved names blocked in DB)
    api/webhooks/[provider]/route.ts
  modules/
    profiles/           username rules, profile CRUD
    vouchers/           eligibility, redemption, calendar-month expiry
    commission/         rate resolution + calculation (pure)
    payments/           intents, provider interface, providers/mock, webhook processing
    ledger/             double-entry postings
    audit/              append-only audit writer
    auth/               session helpers, role checks
  lib/
    env.ts              zod-validated env, split server/public
    supabase/           server client, browser client, service client (server-only)
    money.ts            Paise type, formatting
    time.ts             Asia/Kolkata calendar helpers
  components/
    ui/                 design system primitives
    marketing/          landing compositions (burn intro, wordmark)
  config/brand.ts       product name, domain
supabase/migrations/    schema history
tests/e2e/              Playwright
```

**Module rule.** Routes never contain business rules. A route parses input, calls a module function and renders the result. Module functions take explicit dependencies (a db client, a clock) so they can be unit tested without a network. Pure logic (commission maths, month arithmetic, username rules) has no I/O at all.

## 4. Three Supabase clients

| Client        | Key                            | Where                                                             | Used for                                                             |
| ------------- | ------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| Browser       | publishable key                | client components                                                 | auth UI, reading public data only                                    |
| Server (user) | publishable key + user cookies | Server Components, Actions                                        | everything a signed-in user does. RLS applies.                       |
| Service       | secret (service role) key      | `import "server-only"` modules: payments, ledger, webhooks, admin | writes RLS deliberately does not allow: payment state, ledger, audit |

The service client lives in a file that imports `server-only`, so a build fails if a client component reaches it. The secret key is not `NEXT_PUBLIC_*`.

## 5. Key flows

### 5.1 Voucher claim

Server Action → `vouchers.claim(userId)` → SQL function `claim_intro_voucher(...)`, executed in one transaction:

1. Lock the creator's row.
2. Check the campaign is active and has capacity.
3. Insert eligibility hashes, using a unique constraint so a reused identity fails.
4. Compute `starts_at` and `expires_at`.
5. Insert the redemption and an audit row.

The month maths lives in TypeScript (tested) and is passed in, and SQL re-checks that the values make sense (`expires_at > starts_at`, at most 12 months).

### 5.2 Contribution (gateway route)

1. The supporter submits an amount, a name and the anonymity flags → Server Action.
2. `payments.createIntent` validates the input, resolves the commission rate **on the server** and stores an intent with `idempotency_key`. Calling it again with the same key returns the same intent.
3. The provider adapter creates an order and returns the checkout parameters.
4. The supporter pays at the provider. **The browser's return is never treated as proof of payment.**
5. The provider calls the webhook. The handler verifies the signature on the raw body, inserts into `webhook_events` (unique on the provider's event id) and calls `process_payment_event(...)`, which locks the intent, applies the state transition, writes the payment, posts the ledger entries and appends to `payment_events`, all in one transaction.
6. The creator page and dashboard read payment status from the database only.

### 5.3 Contribution (direct UPI)

The creator page shows the creator's UPI ID, a `upi://pay` intent link and a QR code. Eme Coffea et Thea records nothing as a payment, takes no commission and shows nothing in support activity (PRD D8).

## 6. Rendering and caching

- Marketing pages are static.
- The public creator page uses `use cache` with a `cacheTag('creator:<id>')`. Profile edits and new successful payments call `updateTag`/`revalidateTag` for that tag.
- Dashboard and admin pages are dynamic: they read cookies and are never cached across users.

## 7. Environments

| Env        | Payments                                                                                                                           | Database                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| local      | `PAYMENTS_MODE=mock`; every record has `livemode=false`                                                                            | hosted dev project          |
| preview    | mock                                                                                                                               | dev project                 |
| production | blocked until D2 and D3 are resolved; `PAYMENTS_MODE=live` refuses to boot without provider keys and `LIVE_PAYMENTS_APPROVED=true` | separate production project |

## 8. Decisions log

| Date       | Decision                                                                                                                                                                                                                                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-07 | Product name was first Coffea. BuymeKofi was dropped because of Ko-fi and Buy Me a Coffee trademark risk.                                                                                                                                                                                                       |
| 2026-11-07 | Renamed from Coffea to **Eme Coffea et Thea** at the founder's request. The wordmark was redrawn with the same pen technique.                                                                                                                                                                                   |
| 2026-11-07 | Payment provider: **Razorpay** (Route for split settlement), integrated in Milestone 10 once approved.                                                                                                                                                                                                          |
| 2026-11-07 | Hosted Supabase for development, because Docker is not available locally.                                                                                                                                                                                                                                       |
| 2026-11-07 | Commission is computed with integer floor maths in favour of the creator (PAYMENT_MODEL.md §3).                                                                                                                                                                                                                 |
| 2026-11-07 | The rate is locked when the payment intent is created, not when it is captured (PAYMENT_MODEL.md §3).                                                                                                                                                                                                           |
| 2026-11-07 | The pasted handwriting SVG writes "Mariane" with Northwell glyphs, a commercial font. It was rebuilt as a "Eme Coffea et Thea" wordmark from an OFL script font. The technique and the burn shader come from Ksenia Kondrashova's CodePen demos (CodePen public pens are MIT) and are credited in `CREDITS.md`. |
