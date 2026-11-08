# Handoff: start a new session here

Read this first. Then read `CLAUDE.md` (rules and commands) and `progress.md` (detailed history). Last updated 2026-11-08.

## What this is

**Eme Coffea et Thea** is a creator page and support platform for India: Linktree-style identity plus Ko-fi-style support. It is built as a Next.js 16 modular monolith on Supabase.

- **Repo:** `git@github.com:Wired-Navi0x17/Eme-CoffeaEtThea.git` (renamed from BuyMekofi). Push after every commit, and add **no attribution lines** to commit messages.
- **Supabase dev project:** ref `cgfrpgivgbqxmrhabbfx`. The CLI is logged in and linked. Keys are in the git-ignored `.env.local`.
- **Payments:** mock only. Razorpay Route is chosen for later; nothing live without the founder's explicit approval.

## Where we are

| #     | Milestone                                                                                                            | State            |
| ----- | -------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 0–2   | Specs, scaffold and design system, auth with RLS                                                                     | ✅               |
| 3     | Two-step sign-up (username first), one-screen page setup, public `/<username>` page                                  | ✅               |
| 4     | Page Studio v1 (`/dashboard/studio`): themes, fonts, blocks, autosave, publish                                       | ✅               |
| 5     | Admin panel and site CMS (`/admin`), creator suspension, audit log                                                   | ✅               |
| **6** | **Vouchers: next to build**                                                                                          | —                |
| 7–14  | Dashboard, mock contributions, commission ledger, Studio v2, admin finance, security pass, Razorpay prep, production | see `ROADMAP.md` |

Latest round (2026-11-08):

- renamed to Eme Coffea et Thea, with the handwritten logo redrawn;
- 2-D café design (white paper, wobbly pencil outlines, strictly monochrome platform UI);
- usernames may contain `-`, and `-` and `_` count as the same for uniqueness;
- the intro replays on reload.

## Do these first in the new session

1. **Real-Chrome sign-up check: done 2026-11-08.** `l41n-pr0t0` registered, was confirmed (by a mail scanner; see progress.md), logged in, completed onboarding, and has a live page at `/l41n-pr0t0`. Studio and the dashboard load. The founder still changes the temporary password via Forgot password, which also tests the reset flow.
2. Admin granted to harshulkala14@gmail.com; `/admin` loads. Dev console logs a "uncached data outside Suspense" error for `/admin` (not seen in the build); worth a look.
3. **Leftover test accounts:** 19 `@example.test` users need `pnpm cleanup:test-users --yes`. The founder runs this; it was blocked from the agent session.
4. **Start Milestone 6: vouchers.** See below.

## Milestone 6 plan (vouchers)

- **Tables:** `voucher_campaigns`, `voucher_codes`, `voucher_redemptions` (append-only) and `intro_eligibility_markers` (keyed HMAC hashes). The design is in `DATABASE.md`. Put any private data in its own owner-only table, never as a column on a publicly readable row.
- **Expiry:** `addCalendarMonths` in `Asia/Kolkata`, written **test-first**. 31 Jan + 1 month = 28 or 29 Feb. Expiry is an exclusive instant.
- **Claim:** done through a SQL function in one transaction (row lock, capacity, eligibility markers, redemption, audit). It's called from a dashboard Server Action.
- **Admin:** create, enable and disable campaigns at `/admin/vouchers`, choosing 1- or 2-month durations, with no code changes. Every write is audited.
- **Dashboard:** offer card → claim → shows "0% until <date>". The confirmed claim is the place for the ink-underline signature.
- **Commission rate resolution** (voucher → policy) comes in Milestone 9; `PAYMENT_MODEL.md` §3 already specifies it.

## Founder preferences (keep these)

- **Design:**
  - Tokyo 2-D café: white paper, black pencil outlines, monochrome.
  - **No orange.** No coloured accents in the platform UI; creators' pages may use colour.
  - Zero radius in the platform UI.
  - No eyebrow tags or pills, and no side accent bars on boxes.
  - Three typefaces maximum: Geist, Dela Gothic One, and the Mr Dafoe wordmark baked to SVG.
- **No fake data:** no invented stats, reviews or emails. Be honest about what isn't live yet.
- Use the **antislop-web** skill for UI work.
- Ask before big product decisions. The founder likes to see things working, ideally in a real browser.

## Gotchas learned the hard way

- **RLS is row-level, not column-level.** Never keep private columns on a table with a public row policy. This caused the draft leak fix (`page_drafts`).
- **Append-only guard:** `forbid_update_delete()` allows foreign-key cascades through `pg_trigger_depth() > 1`. Without that, users with history can't be deleted.
- **Next 16:**
  - `proxy.ts`, not middleware.
  - Cache Components are on: session reads `await connection()`.
  - Routes that need a real 404 status use `instant = false` and await before streaming (`/[username]`, `/admin`).
  - Read `node_modules/next/dist/docs/` before using an API.
- **E2E:**
  - Warm the dev server first (curl the main routes) or use `--workers=6`.
  - If the founder's `pnpm dev` is running on port 3000, use `E2E_PORT=3000`; Next refuses a second dev server in the same directory.
  - A dev server left over from a killed run can hang, so kill it.
- **Environment:** the shell sets `NODE_TLS_REJECT_UNAUTHORIZED=0`; prefix commands with `env -u NODE_TLS_REJECT_UNAUTHORIZED`. Run Supabase commands with `--remote`, and dry-run first.
- **Security reviews:** an automated reviewer flags issues after commits. Take each one seriously; both findings so far were real.

## Open items for the founder

- Custom SMTP unlocks the scanner-proof confirm links: then uncomment the template block in `supabase/config.toml` and run `supabase config push`. Until then a mail scanner can confirm an address.
- The Supabase project is still named BuyMeKofi; rename it.
- Rotate the Supabase secret key (it was pasted in chat), and change the sudo password (also shared in chat).
- Set up custom SMTP for auth email (Brevo, Resend or ZeptoMail). EmailJS can't act as an SMTP server.
- Trademark: "Coffea" is an existing café chain in India (PRD D1). Run an IP India search before committing to the name.
- Production domain is still to be decided (`emecoffeaetthea.in` is a placeholder in `src/config/brand.ts`).
