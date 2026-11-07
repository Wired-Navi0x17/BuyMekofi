/**
 * INR money helpers. Amounts are integer paise everywhere (DATABASE.md
 * conventions); floats never touch money. Rates are integer basis points.
 */

declare const PaiseBrand: unique symbol;
/** A strictly positive, safe-integer amount of paise. */
export type Paise = number & { readonly [PaiseBrand]: true };

export function paise(value: number): Paise {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`Invalid paise amount: ${value}`);
  }
  return value as Paise;
}

// Plain digits, or Indian/Western comma grouping, with up to 2 decimals.
const RUPEE_INPUT = /^(?:\d+|\d{1,3}(?:,\d{2,3})+)(?:\.(\d{1,2}))?$/;

/** Parse user-typed rupees ("1,250.50") into paise using string arithmetic. */
export function rupeesToPaise(input: string): Paise {
  const trimmed = input.trim();
  const match = RUPEE_INPUT.exec(trimmed);
  if (!match) throw new RangeError(`Not a rupee amount: ${JSON.stringify(input)}`);
  const [whole, fraction = ""] = trimmed.replaceAll(",", "").split(".");
  const total = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0") || "0");
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError("Amount too large");
  return paise(Number(total));
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "₹1,23,456.78". Accepts 0 for display of empty totals. */
export function formatInr(amountPaise: number): string {
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 0) {
    throw new RangeError(`Invalid paise amount: ${amountPaise}`);
  }
  const rupees = Math.trunc(amountPaise / 100);
  const rest = amountPaise % 100;
  // Format whole rupees as an integer and append exact paise, avoiding x/100 floats.
  const wholePart = inr.format(rupees).replace(/\.00$/, "");
  return `${wholePart}.${String(rest).padStart(2, "0")}`;
}

/** 500 -> "5%", 250 -> "2.5%". */
export function formatBps(bps: number): string {
  if (!Number.isInteger(bps) || bps < 0 || bps > 10_000) {
    throw new RangeError(`Invalid basis points: ${bps}`);
  }
  const whole = Math.trunc(bps / 100);
  const frac = bps % 100;
  if (frac === 0) return `${whole}%`;
  return `${whole}.${String(frac).padStart(2, "0").replace(/0$/, "")}%`;
}
