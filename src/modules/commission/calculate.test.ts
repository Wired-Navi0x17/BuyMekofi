import { describe, expect, it } from "vitest";
import { calculateCommission } from "./calculate";
import { paise } from "@/lib/money";

describe("calculateCommission", () => {
  it("charges 5% (500 bps) of a round amount exactly", () => {
    expect(calculateCommission(paise(50_000), 500)).toEqual({
      amountPaise: 50_000,
      rateBps: 500,
      commissionPaise: 2_500,
      creatorSharePaise: 47_500,
    });
  });

  it("floors fractional paise in the creator's favour", () => {
    // 9999 * 500 / 10000 = 499.95 -> 499
    const r = calculateCommission(paise(9_999), 500);
    expect(r.commissionPaise).toBe(499);
    expect(r.creatorSharePaise).toBe(9_500);
  });

  it("charges nothing at 0 bps (voucher period)", () => {
    const r = calculateCommission(paise(12_345), 0);
    expect(r.commissionPaise).toBe(0);
    expect(r.creatorSharePaise).toBe(12_345);
  });

  it("always splits into parts that sum to the amount", () => {
    for (const amount of [1, 7, 99, 101, 1_999, 5_000_000]) {
      for (const bps of [0, 1, 250, 500, 999, 10_000]) {
        const r = calculateCommission(paise(amount), bps);
        expect(r.commissionPaise + r.creatorSharePaise).toBe(amount);
        expect(r.commissionPaise).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("stays exact at the largest supported amount", () => {
    const max = Number.MAX_SAFE_INTEGER;
    const r = calculateCommission(paise(max), 500);
    expect(BigInt(r.commissionPaise)).toBe((BigInt(max) * 500n) / 10_000n);
  });

  it.each([-1, 10_001, 2.5, Number.NaN])("rejects invalid rate %s", (bps) => {
    expect(() => calculateCommission(paise(100), bps)).toThrow(RangeError);
  });

  it("rejects zero amounts", () => {
    expect(() => calculateCommission(0 as never, 500)).toThrow(RangeError);
  });
});
