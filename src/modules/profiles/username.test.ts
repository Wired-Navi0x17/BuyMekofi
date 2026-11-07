import { describe, expect, it } from "vitest";
import { normaliseUsername, validateUsernameFormat } from "./username";

describe("normaliseUsername", () => {
  it("trims, lowercases and drops a leading @ or URL prefix", () => {
    expect(normaliseUsername("  Riya_Draws ")).toBe("riya_draws");
    expect(normaliseUsername("@riya")).toBe("riya");
    expect(normaliseUsername("coffeaetthea.in/riya")).toBe("riya");
    expect(normaliseUsername("https://coffeaetthea.in/riya")).toBe("riya");
  });
});

describe("validateUsernameFormat", () => {
  it.each(["riya", "riya_draws", "r1y", "a".repeat(30), "studio_42"])("accepts %s", (u) => {
    expect(validateUsernameFormat(u)).toEqual({ ok: true, username: u });
  });

  it.each([
    ["ri", "too_short"],
    ["a".repeat(31), "too_long"],
    ["riya draws", "invalid_chars"],
    ["riya-draws", "invalid_chars"],
    ["riyā", "invalid_chars"],
    ["_riya", "bad_edges"],
    ["riya_", "bad_edges"],
    ["", "too_short"],
  ])("rejects %j as %s", (u, reason) => {
    expect(validateUsernameFormat(u)).toMatchObject({ ok: false, reason });
  });

  it("matches the database check constraint exactly", () => {
    // Keep in sync with creator_profiles.username check (DATABASE.md).
    const db = /^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])$/;
    for (const u of ["abc", "a_b", "a__b", "ab", "abc_", "x".repeat(30), "x".repeat(31), "Abc"]) {
      expect(validateUsernameFormat(u).ok).toBe(db.test(u));
    }
  });
});
