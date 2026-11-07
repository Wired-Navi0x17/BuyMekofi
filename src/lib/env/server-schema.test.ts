import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./server-schema";

const base = {
  NODE_ENV: "development",
  SUPABASE_SECRET_KEY: "sb_secret_xxxxxxxxxxxxxxxxxxxx",
  ELIGIBILITY_PEPPER: Buffer.alloc(32, 7).toString("base64"),
  MOCK_WEBHOOK_SECRET: "m".repeat(32),
};

describe("parseServerEnv", () => {
  it("accepts a valid development env and defaults to mock payments", () => {
    expect(parseServerEnv(base).PAYMENTS_MODE).toBe("mock");
  });

  it("refuses mock payments in production", () => {
    expect(() => parseServerEnv({ ...base, NODE_ENV: "production" })).toThrow(
      /refused in production/,
    );
  });

  it("refuses live payments without explicit approval", () => {
    expect(() => parseServerEnv({ ...base, PAYMENTS_MODE: "live" })).toThrow(/explicit approval/);
  });

  it("requires a mock webhook secret in mock mode", () => {
    expect(() => parseServerEnv({ ...base, MOCK_WEBHOOK_SECRET: undefined })).toThrow(
      /MOCK_WEBHOOK_SECRET/,
    );
  });

  it("rejects a short pepper", () => {
    expect(() => parseServerEnv({ ...base, ELIGIBILITY_PEPPER: "c2hvcnQ=" })).toThrow(
      /ELIGIBILITY_PEPPER/,
    );
  });

  it("never echoes secret values in errors", () => {
    try {
      parseServerEnv({ ...base, SUPABASE_SECRET_KEY: "short-secret" });
    } catch (e) {
      expect(String(e)).not.toContain("short-secret");
    }
  });
});
