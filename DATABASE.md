# Database design

Postgres on Supabase. All changes go through `supabase/migrations/*.sql`; nobody edits the production schema by hand. This document describes the target schema. Each milestone's migration implements the part it needs, and this file is updated when a migration lands.

## Conventions

- **Money:** `bigint` paise, with `check (amount_paise > 0)` where it applies. Never `numeric`, `real` or `float` for money.
- **Rates:** `integer` basis points, `check (rate_bps between 0 and 10000)`. 500 = 5%.
- **Time:** `timestamptz`, stored in UTC. Calendar logic is done in `Asia/Kolkata` in application code (`src/lib/time.ts`).
- **Ids:** `uuid` from `gen_random_uuid()`. Provider ids are `text` with unique constraints.
- **Enums:** Postgres enums for closed state machines (`payment_intent_status`, …). Adding a value needs a migration, which is intentional.
- **Append-only tables** (`payment_events`, `ledger_entries`, `audit_logs`, `webhook_events`, `voucher_redemptions`): a trigger rejects `UPDATE` and `DELETE`. The one exception is `webhook_events.processed_at` and `processing_error`, which the processor sets once.
- **RLS is enabled on every table in `public`.** A table with RLS on and no policy is closed to the `anon` and `authenticated` roles, and that is the default for all financial tables.

## Entity map

```
auth.users 1─1 creator_profiles 1─* profile_links
                       │          1─* portfolio_projects
                       │          1─* voucher_redemptions *─1 voucher_campaigns 1─* voucher_codes
                       │          1─* payment_intents 1─0..1 payments 1─* refunds
                       │                    │                  │
                       │                    └─* payment_events  └─* ledger_transactions 1─* ledger_entries
                       │          1─* settlements
auth.users 1─* user_roles
intro_eligibility_markers (hashed identity → first redemption)
commission_policies (rate history)
webhook_events  ──processed into──► payment_events
audit_logs (any actor, any entity)
platform_settings (key/value, admin-edited)
reserved_usernames
rate_limit_buckets
```

## Tables

### Identity and roles

**`user_roles`**: `user_id uuid → auth.users`, `role app_role ('admin','support')`, `granted_by`, `granted_at`. Primary key `(user_id, role)`. This is the only source of admin rights, read through `public.has_role(role)` (`security definer`, `stable`). Roles are **never** read from `user_metadata`, which users can edit themselves.

### Creators

**`creator_profiles`**

| column                                | type                                   | notes                                                                                                              |
| ------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| user_id                               | uuid PK → auth.users on delete cascade | one profile per account                                                                                            |
| username                              | citext unique                          | `check (username ~ '^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])$')`; blocked if present in `reserved_usernames` (trigger) |
| display_name                          | text                                   | 1–60 chars                                                                                                         |
| bio                                   | text                                   | ≤ 500 chars, rendered as plain text                                                                                |
| avatar_path, cover_path               | text                                   | Storage object paths, never URLs from users                                                                        |
| upi_vpa                               | text null                              | direct UPI destination, `check (upi_vpa ~ '^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$')`                              |
| show_amounts_publicly                 | boolean default false                  | PRD D9                                                                                                             |
| published_at, onboarding_completed_at | timestamptz null                       | the page is public only when `published_at` is set                                                                 |
| status                                | creator_status ('active','suspended')  | admins can suspend                                                                                                 |
| created_at, updated_at                | timestamptz                            |                                                                                                                    |

**`profile_links`** (built, Milestone 3; the URL must be https, and the check is applied in the database): `id`, `creator_id`, `platform` (enum: instagram, youtube, x, linkedin, github, behance, dribbble, spotify, website, other), `url` (https only, ≤ 2048), `label`, `position smallint`. Unique `(creator_id, position)`, deferrable so reordering works.

**`portfolio_projects`**: `id`, `creator_id`, `title` (≤ 120), `description` (≤ 2000), `url`, `image_path`, `is_featured`, `position`, `published`. Partial index on `(creator_id) where is_featured`.

**`reserved_usernames`**: `username citext PK`. Seeded with every top-level route (`admin`, `dashboard`, `api`, `login`, …) and brand names.

### Commission

**`commission_policies`**

| column         | type                      | notes                                  |
| -------------- | ------------------------- | -------------------------------------- |
| id             | uuid PK                   |                                        |
| name           | text                      | "Standard gateway commission"          |
| rate_bps       | integer                   | `check (rate_bps between 0 and 10000)` |
| route          | payment_route ('gateway') | direct UPI never has a policy          |
| effective_from | timestamptz               |                                        |
| effective_to   | timestamptz null          |                                        |
| created_by     | uuid                      |                                        |

An exclusion constraint (`btree_gist`) prevents two policies from overlapping in time on the same route. The seed migration inserts the 500 bps policy effective from launch. Changing the rate means closing the current row and inserting a new one, never editing history.

### Vouchers

**`voucher_campaigns`**

| column                             | type                                         | notes                                                     |
| ---------------------------------- | -------------------------------------------- | --------------------------------------------------------- |
| id                                 | uuid PK                                      |                                                           |
| slug                               | text unique                                  | `welcome-1m`, `welcome-2m`, `diwali-2026`                 |
| name                               | text                                         | shown to creators                                         |
| kind                               | campaign_kind ('introductory','promotional') |                                                           |
| duration_months                    | smallint                                     | `check (duration_months between 1 and 12)`                |
| rate_bps                           | integer                                      | usually 0                                                 |
| requires_code                      | boolean                                      | introductory = false (assigned); promotional usually true |
| starts_at, ends_at                 | timestamptz                                  | window in which the campaign can be **claimed**           |
| max_redemptions                    | integer null                                 | null = unlimited                                          |
| redemption_count                   | integer default 0                            | maintained by the claim function under a row lock         |
| is_active                          | boolean                                      | the admin kill switch                                     |
| created_by, created_at, updated_at |                                              |                                                           |

**`voucher_codes`**: `id`, `campaign_id`, `code citext unique` (generated, 10 chars, Crockford base32), `max_uses`, `use_count`, `disabled_at`.

**`voucher_redemptions`** (append-only)

| column                     | type                      | notes                                                                                  |
| -------------------------- | ------------------------- | -------------------------------------------------------------------------------------- |
| id                         | uuid PK                   |                                                                                        |
| creator_id                 | uuid → creator_profiles   |                                                                                        |
| campaign_id                | uuid → voucher_campaigns  |                                                                                        |
| code_id                    | uuid null → voucher_codes |                                                                                        |
| rate_bps                   | integer                   | snapshot from the campaign                                                             |
| redeemed_at                | timestamptz               |                                                                                        |
| starts_at                  | timestamptz               | `max(redeemed_at, end of any current 0% period)`, so periods queue rather than overlap |
| expires_at                 | timestamptz               | exclusive; `check (expires_at > starts_at)`                                            |
| revoked_at, revoked_reason | null                      | the only mutable columns, set by an admin and audited                                  |

Unique `(creator_id, campaign_id)`. A partial unique index allows **one introductory redemption per creator**.

**`intro_eligibility_markers`**: `marker_hash bytea PK`, `kind` ('email','phone','payout'), `first_redemption_id`, `created_at`. `marker_hash = HMAC-SHA256(PEPPER, normalised value)`. Emails are normalised by lowercasing; for Gmail, dots and `+tags` are also removed. A claim inserts all of the creator's markers. A conflict on any one of them means the identity already used the offer. Raw values are never stored here.

### Payments

**`payment_intents`**

| column                 | type                                                                                            | notes                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| id                     | uuid PK                                                                                         |                                                                     |
| creator_id             | uuid                                                                                            |                                                                     |
| route                  | payment_route ('gateway')                                                                       | direct UPI never creates an intent                                  |
| amount_paise           | bigint                                                                                          | bounds checked against `platform_settings` in the creating function |
| currency               | char(3) default 'INR'                                                                           | `check (currency = 'INR')` for now                                  |
| supporter_name         | text null                                                                                       | as entered                                                          |
| supporter_email        | text null                                                                                       | private, for receipts only                                          |
| message                | text null                                                                                       | ≤ 300 chars                                                         |
| public_anonymous       | boolean                                                                                         | hide the name from public activity                                  |
| hidden_from_creator    | boolean                                                                                         | gateway route only                                                  |
| commission_rate_bps    | integer                                                                                         | resolved by the server at creation                                  |
| commission_policy_id   | uuid null                                                                                       | set when the rate came from a policy                                |
| voucher_redemption_id  | uuid null                                                                                       | set when the rate came from a voucher                               |
| status                 | payment_intent_status ('created','awaiting_payment','succeeded','failed','expired','cancelled') |                                                                     |
| provider               | text                                                                                            | `mock` locally                                                      |
| provider_order_id      | text null                                                                                       | unique `(provider, provider_order_id)`                              |
| idempotency_key        | text                                                                                            | unique `(creator_id, idempotency_key)`                              |
| livemode               | boolean                                                                                         | false for mock; a check forbids `provider='mock' and livemode`      |
| created_at, expires_at |                                                                                                 |                                                                     |

`check (num_nonnulls(commission_policy_id, voucher_redemption_id) = 1)`: every intent records exactly one source for its rate.

**`payments`**: `id`, `intent_id unique`, `provider`, `provider_payment_id` (unique with `provider`), `method` (upi, card, netbanking, wallet, unknown), `amount_paise`, `commission_rate_bps`, `commission_paise`, `creator_share_paise`, `status` ('captured','partially_refunded','refunded','disputed'), `captured_at`, `livemode`. `check (commission_paise + creator_share_paise = amount_paise)`.

**`payment_events`** (append-only): `id`, `intent_id`, `payment_id null`, `from_status`, `to_status`, `source` ('webhook','reconciliation','admin','system'), `webhook_event_id null`, `actor_id null`, `detail jsonb`, `created_at`. The history of every state change.

**`refunds`**: `id`, `payment_id`, `provider_refund_id` (unique with the provider), `amount_paise` (> 0), `commission_reversed_paise`, `status` ('pending','processed','failed'), `reason`, `requested_by`, `created_at`, `processed_at`. A trigger checks that the sum of processed refunds for a payment is ≤ `payments.amount_paise`.

**`disputes`**: `id`, `payment_id`, `provider_dispute_id` unique, `amount_paise`, `status`, `reason_code`, `opened_at`, `resolved_at`.

**`settlements`**: `id`, `creator_id`, `provider`, `provider_settlement_id` unique, `amount_paise`, `status`, `settled_at`. Mirrors what the provider reports. Coffea et Thea never initiates a settlement itself.

**`webhook_events`**: `id`, `provider`, `provider_event_id` (unique with `provider`), `event_type`, `signature_valid boolean`, `payload jsonb`, `received_at`, `processed_at null`, `processing_error null`. Events with invalid signatures are stored with `signature_valid=false` and never processed.

### Ledger (double entry, a record rather than a wallet)

**`ledger_transactions`**: `id`, `kind` ('contribution_captured','refund','dispute','dispute_reversal'), `payment_id`, `refund_id null`, `occurred_at`, `livemode`.

**`ledger_entries`** (append-only): `id`, `transaction_id`, `account` (enum: `provider_clearing`, `creator_payable`, `platform_commission`, `refunds_clearing`), `creator_id null`, `direction` ('debit','credit'), `amount_paise > 0`. A deferred constraint trigger checks that debits equal credits within each transaction.

Coffea et Thea does not hold funds. The ledger records how the provider split each payment, so commission reports and creator statements can be reproduced and reconciled against provider settlement reports.

### Platform

**`audit_logs`** (append-only): `id`, `actor_id null`, `actor_kind` ('user','admin','system','webhook'), `action text` (e.g. `voucher.claim`, `campaign.disable`), `entity_type`, `entity_id`, `before jsonb`, `after jsonb`, `ip_hash bytea`, `request_id`, `created_at`. Index on `(entity_type, entity_id, created_at)`.

**`platform_settings`**: `key text PK`, `value jsonb`, `updated_by`, `updated_at`, for example `contribution_min_paise` and `contribution_max_paise`. Every change is audited.

**`rate_limit_buckets`**: `key text`, `window_start timestamptz`, `count int`, primary key `(key, window_start)`. Read and written only by `public.rate_limit_hit(key, window_seconds, max)`.

## RLS summary

| Table                                                                                                               | anon                                                                                         | authenticated creator                                                                       | admin                   | service role        |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------- | ------------------- |
| creator_profiles                                                                                                    | select where published and active                                                            | select/update own (column grants exclude `status`, `published_at`)                          | all via `has_role`      | all                 |
| profile_links, portfolio_projects                                                                                   | select if parent published                                                                   | CRUD own                                                                                    | all                     | all                 |
| voucher_campaigns                                                                                                   | —                                                                                            | select active introductory                                                                  | all                     | all                 |
| voucher_redemptions                                                                                                 | —                                                                                            | select own                                                                                  | select                  | insert via function |
| payment_intents, payments                                                                                           | —                                                                                            | select own through `creator_payments_v` (hides supporter fields when `hidden_from_creator`) | select                  | all                 |
| public support activity                                                                                             | select through `public_support_v` (no email, no name when anonymous, amount only if allowed) | —                                                                                           | —                       | —                   |
| ledger_*, webhook_events, refunds, disputes, settlements, audit_logs, intro_eligibility_markers, rate_limit_buckets | —                                                                                            | —                                                                                           | select (except markers) | all                 |

Admin writes go through Server Actions that check `has_role('admin')` and then use the service client, so every write also produces an audit row.

## Storage

The `avatars`, `covers` and `portfolio` buckets are public-read with `file_size_limit` set (2 MB for avatars, 5 MB for the others) and `allowed_mime_types` limited to jpeg, png and webp. Object paths are `<user_id>/<uuid>.<ext>`. The insert, update and delete policy checks `(storage.foldername(name))[1] = auth.uid()::text`.

## As built (Milestone 3)

- **`page_documents`:** `creator_id` PK, `schema_version`, `draft jsonb`, `published jsonb`, `published_at`, and a 200 KB size cap per document. Clients have INSERT and UPDATE on (`draft`, `schema_version`) only.
- **`page_versions`:** append-only snapshots written at publish time by the service role.
- **Storage `avatars` (2 MB) and `covers` (5 MB):** JPEG, PNG and WebP only. Writes need `(storage.foldername(name))[1] = auth.uid()`.
- **`username_availability(text)`:** a `security definer` function that returns `available`, `taken`, `reserved` or `invalid`. It's executable by anon, for the claim box.

## As built (Milestone 4)

- **Storage `page-media`:** 5 MB; JPEG, PNG and WebP only; writes are restricted to the owner's folder. Holds gallery images. Cover images live in `covers`, and their path is stored in the document at `theme.coverPath`.
- **Document schema v2:** defined in `src/modules/pages/document.ts`. `page_documents.schema_version` is set to 2 on save.
