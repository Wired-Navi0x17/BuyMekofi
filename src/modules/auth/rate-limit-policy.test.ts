import { describe, expect, it } from "vitest";
import { AUTH_LIMITS, rateKey, waitMessage } from "./rate-limit-policy";

const pepper = Buffer.alloc(32, 7).toString("base64");

describe("rateKey", () => {
  it("is stable for the same inputs", () => {
    expect(rateKey("login", ["1.2.3.4", "a@b.co"], pepper)).toBe(
      rateKey("login", ["1.2.3.4", "a@b.co"], pepper),
    );
  });
  it("differs by scope and by part", () => {
    const base = rateKey("login", ["1.2.3.4", "a@b.co"], pepper);
    expect(rateKey("resend", ["1.2.3.4", "a@b.co"], pepper)).not.toBe(base);
    expect(rateKey("login", ["1.2.3.5", "a@b.co"], pepper)).not.toBe(base);
  });
  it("does not let parts run together", () => {
    expect(rateKey("login", ["ab", "c"], pepper)).not.toBe(rateKey("login", ["a", "bc"], pepper));
  });
  it("normalises email case and never contains the raw values", () => {
    const k = rateKey("login", ["1.2.3.4", "A@B.co"], pepper);
    expect(k).toBe(rateKey("login", ["1.2.3.4", "a@b.co"], pepper));
    expect(k).not.toMatch(/1\.2\.3\.4|b\.co/i);
  });
});

describe("limits", () => {
  it("login, sign-up and recovery allow 5 per 15 minutes", () => {
    for (const k of ["login", "signup", "recovery"] as const) {
      expect(AUTH_LIMITS[k]).toMatchObject({ max: 5, windowSeconds: 900 });
    }
  });
  it("resend is stricter than the sign-up form", () => {
    expect(AUTH_LIMITS.resend.max).toBeLessThanOrEqual(3);
  });
});

describe("waitMessage", () => {
  it("rounds up to whole minutes", () => {
    expect(waitMessage(1)).toContain("1 minute");
    expect(waitMessage(61)).toContain("2 minutes");
    expect(waitMessage(900)).toContain("15 minutes");
  });
});
