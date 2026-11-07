/**
 * Launch commercial terms, used ONLY for marketing copy before the database
 * exists. From Milestone 4 the source of truth is `commission_policies` and
 * `voucher_campaigns` (admin-editable); marketing pages will read those and
 * this file will be deleted. Billing code must never import this file.
 */
export const launchTerms = {
  gatewayCommissionBps: 500,
  welcomeVoucherMonths: [1, 2],
  welcomeVoucherBps: 0,
} as const;
