import { describe, expect, it } from "vitest";
import { credentialsSchema, newPasswordSchema, safeNextPath, emailSchema } from "./schemas";

describe("emailSchema", () => {
  it("trims and lowercases", () => {
    expect(emailSchema.parse("  Riya@Example.COM ")).toBe("riya@example.com");
  });
  it.each(["", "riya", "riya@", "@example.com", "a".repeat(250) + "@x.io"])("rejects %j", (v) => {
    expect(emailSchema.safeParse(v).success).toBe(false);
  });
});

describe("credentialsSchema", () => {
  it("requires a password of at least 10 characters", () => {
    expect(credentialsSchema.safeParse({ email: "a@b.in", password: "short" }).success).toBe(false);
    expect(
      credentialsSchema.safeParse({ email: "a@b.in", password: "long enough pw" }).success,
    ).toBe(true);
  });
  it("caps password length to stop hashing abuse", () => {
    expect(
      credentialsSchema.safeParse({ email: "a@b.in", password: "x".repeat(129) }).success,
    ).toBe(false);
  });
});

describe("newPasswordSchema", () => {
  it("requires both entries to match", () => {
    const r = newPasswordSchema.safeParse({ password: "correct horse", confirm: "correct house" });
    expect(r.success).toBe(false);
  });
});

describe("safeNextPath", () => {
  it.each([
    ["/dashboard", "/dashboard"],
    ["/onboarding?step=2", "/onboarding?step=2"],
  ])("keeps same-origin path %s", (input, out) => {
    expect(safeNextPath(input)).toBe(out);
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "dashboard",
    "",
    null,
    undefined,
    "/%2F%2Fevil.example",
    "/.//evil.example",
    "/..//evil.example",
    "/a/../..//evil.example",
  ])("falls back for unsafe %j", (input) => {
    expect(safeNextPath(input)).toBe("/dashboard");
  });
});
