# Payment model

**Status: no live payments.** No provider has approved Coffea et Thea's marketplace model (PRD D2). Until one does, and the founder explicitly approves going live, only the mock provider exists. Mock records carry `livemode=false` and show a visible TEST MODE label everywhere they appear.

## 1. Two routes, kept separate

|                                       | Direct UPI                            | Gateway                                                                  |
| ------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------ |
| Money path                            | supporter's bank → creator's bank     | supporter → provider → split → creator (and Coffea et Thea's commission) |
| Coffea et Thea touches money          | never                                 | never; the provider settles to each party directly                       |
| Coffea et Thea can verify it happened | **no**                                | yes, through a signed webhook                                            |
| Commission                            | none (we can't deduct it)             | policy or voucher rate                                                   |
| Recorded as a payment                 | no                                    | yes                                                                      |
| Shown in public support activity      | no (PRD D8)                           | yes, subject to the supporter's anonymity choice                         |
| Anonymous to the creator              | **no**: their UPI app shows the payer | optional, and still known to the provider and banks                      |

The interface presents these as two clearly different choices on the support panel. Direct UPI is labelled "Pay creator directly by UPI: no fee, your name is visible to them, not tracked on Coffea et Thea". It never looks like a lesser version of the gateway option.

## 2. Provider abstraction

`src/modules/payments/provider.ts`

```ts
interface PaymentProvider {
  readonly id: "mock" | "razorpay" | "cashfree" | string;
  readonly livemode: boolean;
  createOrder(input: {
    intentId: string;
    amountPaise: Paise;
    creatorAccountRef: string;
    commissionPaise: Paise;
    idempotencyKey: string;
  }): Promise<ProviderOrder>;
  verifyWebhook(rawBody: string, headers: Headers): VerifiedEvent; // throws on bad signature
  fetchPayment(providerPaymentId: string): Promise<ProviderPayment>; // for reconciliation
  refund(input: {
    providerPaymentId: string;
    amountPaise: Paise;
    idempotencyKey: string;
  }): Promise<ProviderRefund>;
}
```

Adapters translate provider-specific events into a small internal vocabulary: `payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`, `dispute.opened`, `dispute.closed`. The commission engine and the ledger only see that vocabulary, so swapping providers never touches them.

### Mock provider (development only)

- It is chosen by `PAYMENTS_MODE=mock`. The factory throws if `NODE_ENV=production` and the mode is mock without `ALLOW_MOCK_IN_PRODUCTION=true`, and that flag exists only for preview deployments.
- `createOrder` returns a link to `/dev/mock-checkout/<intentId>`. That page states that it is a test and that no money moves. It offers "Simulate success" and "Simulate failure" buttons.
- Those buttons **don't** mark anything as paid. They build a webhook payload, sign it with HMAC-SHA256 using `MOCK_WEBHOOK_SECRET`, and POST it to `/api/webhooks/mock`. The intent becomes `succeeded` only by going through the same verification, deduplication and processing path a real provider would use. There is no other way.
- The mock checkout route returns 404 unless the mode is mock.

### Razorpay (chosen provider, Milestone 10)

The founder chose Razorpay on 2026-11-07. The intended product is **Razorpay Route**: each creator becomes a _linked account_ that Razorpay KYCs, and each order carries a transfer of the creator's share to that account. Razorpay settles directly to the creator and the platform keeps only the commission, so Coffea et Thea never holds funds (PRD D3).

Planned mapping, to be **re-verified against Razorpay's current docs before writing the adapter**:

| Internal                             | Razorpay                                                                                                                                |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `createOrder`                        | Orders API with a `transfers` entry for the creator's linked account (amount = `creator_share_paise`)                                   |
| checkout                             | Razorpay Checkout on the client. The browser's payment signature is a hint only; state changes come from the webhook.                   |
| `verifyWebhook`                      | HMAC-SHA256 of the raw body with the webhook secret, compared to `X-Razorpay-Signature`. The event id header is used for deduplication. |
| `payment.captured`, `payment.failed` | `payment.captured`, `payment.failed`                                                                                                    |
| `refund.processed`                   | `refund.processed`, with transfer reversal for the creator's share                                                                      |
| settlements                          | `transfer.*` and settlement webhooks or reports → `settlements`                                                                         |

The adapter lives at `src/modules/payments/providers/razorpay.ts`, behind `PAYMENTS_MODE=live` and `LIVE_PAYMENTS_APPROVED=true`, and is tested only against Razorpay test mode.

## 3. Commission engine

Module: `src/modules/commission`. Pure functions, written test-first.

**Rate resolution** (`resolveRate(creatorId, at)`), done on the server and never sent by the client:

1. Is there a non-revoked `voucher_redemption` for the creator with `starts_at ≤ at < expires_at`? If so, use its `rate_bps` and record `voucher_redemption_id`.
2. Otherwise, use the `commission_policies` row for route `gateway` where `effective_from ≤ at < coalesce(effective_to, ∞)`, and record `commission_policy_id`.
3. If neither exists, refuse to create the intent. A missing policy is a configuration error and must never silently become 0%.

**Which instant counts:** `at` is the time the payment intent is created. A supporter who opens checkout at 23:59 on the last 0% day and pays at 00:01 still gets the 0% rate for the creator. This rule favours the creator, is easy to explain, and the rate is stored on the intent so it can be audited.

**Calculation:**

```
commission_paise    = floor(amount_paise × rate_bps / 10000)
creator_share_paise = amount_paise − commission_paise
```

The maths uses integers only (JS `bigint` inside the function, converted back to a safe integer). Rounding is floor, so any fraction of a paisa goes to the creator. For example, ₹99.99 = 9999 paise at 500 bps gives 499 paise of commission, not 499.95.

**GST** on the commission (PRD D4) is not computed yet. When it is, it becomes a separate line and a separate ledger account, and is never folded into `rate_bps`.

## 4. Calendar months for vouchers

`addCalendarMonths(start, n)` works in `Asia/Kolkata`:

- It moves the local date forward by `n` months and keeps the local time of day.
- If the target month is shorter, it clamps to that month's last day: 31 Jan + 1 month = 28 Feb (29 in a leap year). 31 Mar + 1 month = 30 Apr.
- The result is an exclusive expiry instant. A voucher claimed at 14:05 IST on 10 Nov 2026 with 2 months expires at 14:05 IST on 10 Jan 2027.

India has no daylight saving, but the function still uses offset-aware conversion so it stays correct if it is ever reused for another zone.

## 5. State machine

```
created ──order ok──► awaiting_payment ──captured──► succeeded
   │                       │  └──failed──► failed
   └──order error──► failed  └──timeout (30 min)──► expired
                             └──supporter cancels──► cancelled
succeeded is terminal for the intent; the payment row then moves:
captured → partially_refunded → refunded,  captured → disputed → captured | refunded
```

`process_payment_event` (SQL, `security definer`, service role only):

1. `select … for update` on the intent.
2. If the event already resulted in a `payment_events` row (matched by `webhook_event_id`), return without doing anything. This makes processing idempotent.
3. Reject transitions that aren't in the table above and log `processing_error`.
4. On capture, check that the provider-reported amount equals `amount_paise`. A mismatch puts the payment in a review state and alerts an admin. It is never auto-accepted.
5. Insert the payment row with the commission split computed from the intent's locked rate.
6. Post ledger entries:

| Event            | Debit                                                                                   | Credit                                                  |
| ---------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| captured         | provider_clearing: amount                                                               | creator_payable: share; platform_commission: commission |
| refund processed | creator_payable: refund − reversed commission; platform_commission: reversed commission | refunds_clearing: refund                                |

7. Append the `payment_events` row and the audit row, then commit.

## 6. Idempotency, at three layers

1. **Checkout:** the client generates `idempotency_key` (a UUID per checkout attempt). The server has a unique `(creator_id, idempotency_key)` constraint and returns the existing intent if the key repeats.
2. **Webhook ingestion:** unique `(provider, provider_event_id)`. A duplicate delivery gets a 200 response with no further work.
3. **Processing:** the row lock plus the `webhook_event_id` check described in §5.

## 7. Webhook handling

`app/api/webhooks/[provider]/route.ts`:

- Read the **raw body** with `await request.text()` before parsing anything.
- Verify the signature with a constant-time compare (`crypto.timingSafeEqual`) and reject stale timestamps where the provider sends them.
- Persist the event in `webhook_events` before processing it, so a processing bug never loses an event.
- Respond quickly. Processing is synchronous for now because volumes are small. If it becomes slow, a queue table drained by a cron job can be added without changing the contract.
- No session and no CSRF token: the signature is the authentication. The route is excluded from proxy auth redirects.

## 8. Refunds and reversals

The schema and ledger postings are ready (DATABASE.md, `refunds`). The trigger for a refund (admin only, creator request, or provider-initiated) and the commission reversal rule wait on PRD D7. The proposed rule is to reverse commission in proportion to the refund.

## 9. Reconciliation

A daily job compares `payments` with `provider.fetchPayment` for anything still awaiting payment, and imports settlement reports into `settlements`. Mismatches open an admin task. This is built in Milestone 10, together with the real provider.

## 10. Never

- Card numbers, CVV, UPI PIN, net-banking credentials. These are entered only on the provider's page or SDK.
- Wallet balances, or holding creator funds (PRD D3).
- Marking a payment successful from a browser redirect or a client callback.
- Taking a commission value from the client.
