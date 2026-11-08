@AGENTS.md

# Coffea et Thea: working rules for agents

Coffea et Thea is a creator page and support platform for India, built as a Next.js 16 modular monolith on Supabase. Read these before changing anything:

- `PRD.md` for the product and its open decisions
- `ARCHITECTURE.md` for the module layout
- `DATABASE.md` for the schema and RLS
- `PAYMENT_MODEL.md` for money rules
- `SECURITY.md` for controls
- `DESIGN.md` for visual rules (platform UI: 3 typefaces max)
- `PAGE_STUDIO.md` for creator page customisation and its safety line
- `ROADMAP.md` and `progress.md` for where we are

## Commands

- `pnpm dev`. Use port 3100 for e2e.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. All four must be green before a commit.
- `pnpm e2e`. If a `pnpm dev` is already running on port 3000, Next refuses a second dev server, so run with `E2E_PORT=3000`. On NixOS, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=$(which google-chrome)`, because Playwright's bundled browsers don't run there.
- e2e on a cold dev server can time out while Turbopack compiles every route under parallel load. Warm the routes first (curl `/`, `/login`, `/register`, `/onboarding`, `/dashboard`, `/some_name`) or use `--workers=6`. A dev server left over from a killed test run can hang; kill it before rerunning.
- `pnpm test:integration`: RLS tests against the linked dev Supabase project (needs `.env.local`).
- `npx supabase db push --remote`: apply migrations to the dev project (dry-run first with `--dry-run`).
- `pnpm admin:grant <email> [--revoke]`: grant or remove the admin role (audited).
- `pnpm cleanup:test-users [--yes]`: list, or delete, leftover `@example.test` accounts from the test suites.
- `pnpm format`.

## Hard rules

- **Money:** integer paise only, and rates in integer basis points. Use `src/lib/money.ts` and `src/modules/commission`. Never use floats, and never take a rate or amount from the client as authoritative.
- **Payments:** only the mock provider exists. Never mark a payment successful anywhere except the signed-webhook processor. Don't add live provider code paths without the founder's explicit approval (see `PAYMENT_MODEL.md`).
- **Secrets:** the service-role key and the peppers live only in modules that `import "server-only"`. `.env*` is never committed.
- **Authorisation:** check on the server with `getUser()`/`getClaims()` and a database role. `proxy.ts` redirects are only a convenience.
- **Business logic** lives in `src/modules/*`. Routes stay thin.
- **TDD** for vouchers, commission, payment state, webhooks and the ledger.
- **Design:** follow DESIGN.md and the antislop-web skill. Zero radius. No eyebrow tags or pills. No cards on cards. No emoji. No Inter. No fake data, reviews, stats or emails. Use the existing tokens; don't hardcode colours.
- **Next.js 16** differs from older versions: middleware is `proxy.ts`, and Cache Components are on. Read `node_modules/next/dist/docs/` before using an API.
- **Docs:** update `progress.md` and the affected doc in the same commit as the change.
