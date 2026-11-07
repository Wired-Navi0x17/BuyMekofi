# Progress

Last updated: 2026-11-07

## Environment

Node 24.19, pnpm 12.6, git 2.54, Supabase CLI 3.0 (through `npx`). **No Docker**, so there is no local Supabase stack. Development uses the hosted project `cgfrpgivgbqxmrhabbfx`. Playwright runs against the system Chrome (NixOS).

## Milestone 0: specification ✅

PRD, ARCHITECTURE, DATABASE, PAYMENT_MODEL, SECURITY, ROADMAP, DESIGN, CLAUDE and CREDITS are written. Open decisions D1–D12 are listed in PRD.md §8.

## Milestone 1: scaffold and design system ✅

Done and verified:

- Next 16.4 App Router (Cache Components on), strict TypeScript, Tailwind 4, ESLint, Prettier with the Tailwind plugin.
- Design tokens in `globals.css`: paper and ink palette, one cherry accent, zero radius, Geist / Geist Mono / Instrument Serif.
- `Button` and `ButtonLink` primitives.
- Environment validation (`src/lib/env/*`). Server secrets are behind `server-only`. Mock payments are refused in production, and live payments are refused without an approval flag.
- Money and commission maths, written test-first: `src/lib/money.ts`, `src/modules/commission/calculate.ts`.
- Signature element: the Coffea et Thea wordmark is written in ink (CSS only, glyphs from Mr Dafoe under the OFL), and a WebGL sheet burns away on scroll (GSAP ScrollTrigger). A Skip button burns the sheet automatically. The intro is skipped for reduced motion, for returning visitors (localStorage), without JS (`noscript`) and without WebGL.
- Landing page: hero, how it works, the two payment routes, a pricing ledger with a worked example computed by the real commission function, and FAQ. It states plainly that Coffea et Thea is in development and payments are not open.
- `/login` and `/register` say honestly that accounts aren't open yet, and collect nothing.

Verification: `pnpm lint`, `typecheck`, `test` (32 unit tests) and `build` all pass. `pnpm e2e` passes 14 tests (desktop and Pixel 7), covering: the wordmark is written, Skip works, scrolling removes the sheet, returning visitors skip the intro, reduced motion, the pricing figures, and no horizontal scroll.

Known limitations:

- Pricing copy reads `src/config/launch-terms.ts` until Milestone 4 moves it to the database.
- The intro's frame rate on low-end Android has not been measured on a real device.

## Rename and provider choice (2026-11-07)

The product is now **Coffea et Thea**, and the wordmark was redrawn with the same pen technique. **Razorpay (Route)** is the chosen provider; see PAYMENT_MODEL.md. Nothing is live.

## Milestone 2: public site and auth ✅

Done and verified:

- Migration `20261107120000_identity_profiles_audit.sql` is applied to the dev project. It adds `user_roles` with `has_role()`, `reserved_usernames`, `creator_profiles` (column-level grants mean clients can't publish themselves or change their status), and an append-only `audit_logs`. RLS is enabled on every table.
- Supabase SSR clients: the user client, a service-role client behind `server-only`, and `src/proxy.ts`, which refreshes the session with `getClaims()` and does optimistic redirects.
- Auth: register, log in, log out, forgot password, reset password, and an email-link callback. The `next` path is restricted to the same origin, and the site URL comes from `NEXT_PUBLIC_SITE_URL`, never from the Host header. Responses don't reveal whether an account exists.
- `/dashboard` is protected, with the user section in Suspense (Cache Components).

Verification:

- `pnpm test`: 52 unit tests.
- `pnpm test:integration`: 11 RLS tests against the dev database, using throwaway users created with the admin API and then deleted.
- `pnpm e2e`: 26 tests (desktop and mobile), covering the protected redirect, wrong password, server-side validation, the forgot-password response, the bad callback link, and log in → dashboard → log out.
- `pnpm build`: passes.

**Founder actions in the Supabase dashboard (Milestone 2 can't be fully tested without them):**

1. Authentication → URL Configuration: set Site URL to `http://localhost:3000`, and add redirect URLs `http://localhost:3000/**` and `http://localhost:3100/**`.
2. Authentication → Providers → Email: keep "Confirm email" on, and set the minimum password length to 10.
3. Authentication → Emails → SMTP: the built-in sender only delivers to your project team's addresses and allows about 2 emails per hour. Real sign-ups need custom SMTP, for example Resend or Amazon SES with a verified domain.
4. Rotate the secret key that was pasted in chat, then update `.env.local`.

Not done yet:

- Our own rate limiting on auth forms. Supabase Auth's built-in limits apply for now, and ours comes in Milestone 9.
- Audit rows for auth events. Supabase keeps its own auth audit log, and app-level audit starts with vouchers in Milestone 4.
- Confirmation-email links are PKCE links, so they must be opened in the same browser that registered.

## Founder feedback round (2026-11-07) ✅

- **Warnings:**
  - The hydration warnings came from the Dark Reader extension rewriting the DOM. Fixed with `<meta name="darkreader-lock">` (the site is light-only) and `suppressHydrationWarning` on `<html>` for other extensions.
  - The `NODE_TLS_REJECT_UNAUTHORIZED` warning comes from the founder's shell environment, not the app.
  - The "server caches disabled" line is a dev-only notice that appears when the browser bypasses cache (DevTools "Disable cache" or a hard reload).
- **Smoother intro:**
  - scrub smoothing raised to 1.1 s;
  - WebGL resolution capped at 1.25× (the main source of jank on retina screens);
  - the sheet now finishes when the burn completes, not when the trigger fires.
- **Scrolling back:** once the burn completes, the 100vh scroll runway collapses and the scroll position is compensated in the same frame, so the page scrolls normally in both directions.
- **Three typefaces:** Geist Mono removed. Numbers use Geist with tabular figures. The platform uses Geist, Instrument Serif and the wordmark artwork.
- **Smooth navigation:** CSS `scroll-behavior: smooth` (reduced-motion aware), plus `data-scroll-behavior="smooth"` so route changes stay instant.
- **Hero copy:** now leads with "a page you can shape into your own website".
- **New docs:** PAGE_STUDIO.md, the customisation design (blocks + theme + sandboxed CSS, no raw HTML or JS). The roadmap is reordered so Page Studio v1 (Milestone 4) and Admin + Site CMS (Milestone 5) come before payments.

Verification: lint, typecheck and unit tests pass, and 29 e2e tests pass (new: scroll back after the burn, and nav links that glide).

## Manga café theme + Claim box (2026-11-07) ✅

- **Theme:** newsprint paper, brush ink, one hanko-vermilion accent (`shu`). Dela Gothic One replaces Instrument Serif, so the platform still uses three typefaces. Inked panels, screentone, focus lines and stamp-press buttons.
- **Landing:**
  - "How it works" is a manga page of four panels;
  - pricing is a café menu with dotted leaders;
  - the payment routes are panels;
  - FAQ answers sit in narration boxes;
  - the hero example shows the Café default page (cover, avatar, Support, tabs, About, Gallery and the support panel).
- **Claim box:** `coffeaetthea.in/[name] Claim`. Availability comes from the `username_availability()` SQL function (migration `20261107140000`, applied). A free name goes to `/register?username=` and is carried into sign-up metadata as a prefill only.
- **Intro:** plays on **every** landing visit, at the founder's request. It's skipped for reduced motion, for anchor arrivals (`/#faq`) and for `?nointro`.
- **Header links:** now plain in-page anchors, so smooth scrolling also works when the visitor arrived with a query string.
- **Plan:** PAGE_STUDIO.md §6 defines the default "Café" creator template from the founder's reference.

Verification: lint and typecheck pass, there are 70 unit tests, and 33 e2e tests pass (new: Claim errors, the Claim → register prefill, and the intro on every visit).

## Next: Milestone 3 (onboarding and public profile)

Username claim with live availability, profile basics, avatar upload (Storage bucket and policies), the `page_documents` model with a shared renderer, and the public `/[username]` page. Then Page Studio v1 (Milestone 4) and Admin + Site CMS (Milestone 5).
