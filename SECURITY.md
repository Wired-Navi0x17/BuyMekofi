# Security

This document lists the threats the platform has to handle and the control for each one. A control counts as done only when the test named in its row exists and passes.

## 1. Secrets and environment

- `src/lib/env.ts` validates every variable with Zod when the server starts. A missing or malformed variable stops the server from booting.
- Only variables prefixed `NEXT_PUBLIC_` reach the browser. Exactly two exist: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `SUPABASE_SECRET_KEY`, `MOCK_WEBHOOK_SECRET`, `ELIGIBILITY_PEPPER` and the provider keys are server-only. Any module that reads them imports `server-only`.
- `.env*` files are git-ignored. `.env.example` lists the variable names with no values.

## 2. Authentication and sessions

- Supabase Auth with cookie sessions through `@supabase/ssr`. `proxy.ts` refreshes the session on every request.
- **Authorisation never trusts `getSession()`.** Server code calls `supabase.auth.getClaims()` (`src/modules/auth/session.ts`), which validates the JWT, before any privileged read or write.
- Every protected page or action checks the session again on the server. The redirect in `proxy.ts` only makes the experience smoother and is not a security control.
- Email verification is required before publishing a page or claiming a voucher.
- Password recovery goes through Supabase's emailed link. The callback route only accepts redirects to same-origin paths, so it cannot be used as an open redirect.

## 3. Authorisation

| Rule                                                                  | Enforced by                                                                          | Test                                                      |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| A creator reads and writes only their own profile, links and projects | RLS `user_id = auth.uid()`                                                           | integration: creator B gets 0 rows / 403 on A's ids       |
| A creator never sees another creator's payments                       | RLS on `creator_payments_v`                                                          | integration                                               |
| A creator cannot change `status`, `published_at` or rates             | column grants + Server Action schema                                                 | integration                                               |
| Admin pages and actions                                               | `requireRole('admin')` in the layout **and** in every action, backed by `user_roles` | e2e: creator gets 404 at `/admin`                         |
| Financial tables are closed to clients                                | RLS enabled with no policies, written only by the service role                       | integration: anon and authenticated selects return 0 rows |

Unauthorised admin routes return **404**, not 403, so the admin area's existence isn't confirmed.

## 4. Input and output

- Zod validates every Server Action and route handler input. Schemas live in the module, not the route.
- SQL goes through the Supabase client (parameterised) and SQL functions. No string-built SQL anywhere.
- XSS: React escapes output by default. Bio and messages render as plain text. `dangerouslySetInnerHTML` is banned by lint rule except for the fixed inline shader source. Links allow `https:` only, are validated on the server and are rendered with `rel="noopener noreferrer ugc"`.
- CSP (Milestone 9) uses nonces through `proxy.ts`, with `frame-ancestors 'none'`, `object-src 'none'` and `base-uri 'self'`.

## 5. CSRF

- Server Actions: Next.js compares the `Origin` and `Host` headers. `serverActions.allowedOrigins` stays at the default of same origin.
- Route handlers that change state check `Origin`. Webhooks are the exception and are authenticated by signature instead.
- Auth cookies are `SameSite=Lax`, `Secure` and `HttpOnly` (the Supabase SSR defaults, verified).

## 6. Rate limiting and abuse

`rate_limit_hit(key, window, max)` uses a fixed window in Postgres. It is enough for launch, and Redis can replace it later behind the same function.

| Surface                     | Key                  | Limit       |
| --------------------------- | -------------------- | ----------- |
| login / register / recovery | IP hash + email hash | 5 / 15 min  |
| voucher claim               | user id              | 5 / hour    |
| create payment intent       | IP hash + creator id | 20 / 10 min |
| uploads                     | user id              | 30 / hour   |

Abuse of the introductory offer is limited by the eligibility markers described in DATABASE.md. Contribution messages are length-capped, stored as plain text and can be reported (Milestone 8).

## 7. File uploads

- Bucket-level size and MIME limits are set in Storage (DATABASE.md §Storage).
- The server checks magic bytes before issuing a signed upload URL. SVG is rejected because it can carry script.
- Object paths are generated by the server (`<uid>/<uuid>.<ext>`). The client's filename is never used.
- Images are served from the Supabase Storage domain, not the app origin.

### Image paths (fixed 2026-11-08, from a security review)

Clients cannot write `avatar_path` or `cover_path`; the column grants were revoked in migration `20261108090000`. The server records the path it generated in the user's own folder. A database check constraint requires the shape `<owner uuid>/<uuid>.(jpg|png|webp)`, and the renderer re-checks it (`isOwnImagePath`). This closes pointing an avatar at another user's file or another bucket via `../`.

## 8. Payments

See PAYMENT_MODEL.md §6 and §7: signature verification on the raw body, constant-time compare, event deduplication, row-locked state transitions, amount matching, and server-resolved commission. The webhook processor is only reachable through the service role.

## 9. Audit

`audit_logs` is append-only and enforced by a trigger. These actions are logged: voucher claim and revoke; campaign create, update and disable; policy change; role grant and revoke; creator suspension; refund request; platform setting change; and every payment state transition (in `payment_events`). IP addresses are stored as an HMAC hash, not in raw form.

## 10. Data protection (DPDP Act 2023)

We collect only what we need. Supporter email is optional and used only for receipts. Raw PAN and bank details are never stored, because the provider holds KYC data. Legal and policy decisions are tracked in PRD D11.

## 11. Review cadence

Each milestone ends with a security pass over its diff. Milestone 9 adds a full review: RLS tests for every table, an end-to-end authorisation matrix, dependency audit (`pnpm audit`) and header checks.
