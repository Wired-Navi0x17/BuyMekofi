import { paise, type Paise } from "@/lib/money";

export type CommissionSplit = {
  amountPaise: number;
  rateBps: number;
  commissionPaise: number;
  creatorSharePaise: number;
};

/**
 * Split a gateway contribution into platform commission and creator share.
 * Integer maths only; fractions of a paisa go to the creator (floor).
 * The rate must come from server-side resolution (PAYMENT_MODEL.md §3),
 * never from a client.
 */
export function calculateCommission(amountPaise: Paise, rateBps: number): CommissionSplit {
  paise(amountPaise); // re-validate: branded types can be forged with `as`
  if (!Number.isInteger(rateBps) || rateBps < 0 || rateBps > 10_000) {
    throw new RangeError(`Invalid commission rate (bps): ${rateBps}`);
  }
  const commission = (BigInt(amountPaise) * BigInt(rateBps)) / 10_000n;
  const commissionPaise = Number(commission);
  return {
    amountPaise,
    rateBps,
    commissionPaise,
    creatorSharePaise: amountPaise - commissionPaise,
  };
}
