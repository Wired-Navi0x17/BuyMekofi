import { describe, expect, it } from "vitest";
import { formatBps, formatInr, paise, rupeesToPaise } from "./money";

describe("paise", () => {
  it("accepts positive safe integers", () => {
    expect(paise(1)).toBe(1);
  });
  it.each([0, -5, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])("rejects %s", (v) => {
    expect(() => paise(v)).toThrow(RangeError);
  });
});

describe("rupeesToPaise", () => {
  it("parses whole and decimal rupee strings without float maths", () => {
    expect(rupeesToPaise("500")).toBe(50_000);
    expect(rupeesToPaise("99.99")).toBe(9_999);
    expect(rupeesToPaise("0.1")).toBe(10);
    expect(rupeesToPaise("1,250.50")).toBe(125_050);
  });
  it.each(["", "abc", "1.234", "-5", "0", "0.00", "1e3"])("rejects %j", (v) => {
    expect(() => rupeesToPaise(v)).toThrow(RangeError);
  });
});

describe("formatInr", () => {
  it("uses Indian digit grouping and two decimals", () => {
    expect(formatInr(12_345_678)).toBe("₹1,23,456.78");
    expect(formatInr(2_500)).toBe("₹25.00");
    expect(formatInr(0)).toBe("₹0.00");
  });
});

describe("formatBps", () => {
  it("renders basis points as a percentage without float noise", () => {
    expect(formatBps(500)).toBe("5%");
    expect(formatBps(0)).toBe("0%");
    expect(formatBps(250)).toBe("2.5%");
    expect(formatBps(1)).toBe("0.01%");
  });
});
