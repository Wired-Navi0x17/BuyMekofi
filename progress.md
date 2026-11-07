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
- Signature element: the Coffea wordmark is written in ink (CSS only, glyphs from Mr Dafoe under the OFL), and a WebGL sheet burns away on scroll (GSAP ScrollTrigger). A Skip button burns the sheet automatically. The intro is skipped for reduced motion, for returning visitors (localStorage), without JS (`noscript`) and without WebGL.
- Landing page: hero, how it works, the two payment routes, a pricing ledger with a worked example computed by the real commission function, and FAQ. It states plainly that Coffea is in development and payments are not open.
- `/login` and `/register` say honestly that accounts aren't open yet, and collect nothing.

Verification: `pnpm lint`, `typecheck`, `test` (32 unit tests) and `build` all pass. `pnpm e2e` passes 14 tests (desktop and Pixel 7), covering: the wordmark is written, Skip works, scrolling removes the sheet, returning visitors skip the intro, reduced motion, the pricing figures, and no horizontal scroll.

Known limitations:

- Pricing copy reads `src/config/launch-terms.ts` until Milestone 4 moves it to the database.
- The intro's frame rate on low-end Android has not been measured on a real device.

## Next: Milestone 2 (public site and auth)

Blocked on: `.env.local` with `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` for the dev project, and running `npx supabase login` and `npx supabase link --project-ref cgfrpgivgbqxmrhabbfx` (interactive, so the founder runs them).
Plan: install `@supabase/supabase-js` and `@supabase/ssr`; write the first migration (`user_roles`, `creator_profiles`, `reserved_usernames`, `audit_logs` and RLS); add `proxy.ts` session refresh; build the register, login, recovery and verify flows.
