import { describe, expect, it } from "vitest";
import { canonicalUsername, normaliseUsername, validateUsernameFormat } from "./username";

describe("normaliseUsername", () => {
  it("trims, lowercases and drops a leading @ or URL prefix", () => {
    expect(normaliseUsername("  Riya_Draws ")).toBe("riya_draws");
    expect(normaliseUsername("@riya")).toBe("riya");
  });
});

describe("validateUsernameFormat", () => {
  it.each(["riya", "riya_draws", "l41n-pr0t0", "r1y", "a".repeat(30), "studio-42_x"])(
    "accepts %s",
    (u) => {
      expect(validateUsernameFormat(u)).toEqual({ ok: true, username: u });
    },
  );

  it.each([
    ["ri", "too_short"],
    ["a".repeat(31), "too_long"],
    ["riya draws", "invalid_chars"],
    ["riya.draws", "invalid_chars"],
    ["riyā", "invalid_chars"],
    ["_riya", "bad_edges"],
    ["riya-", "bad_edges"],
    ["-riya", "bad_edges"],
    ["riya--draws", "double_separator"],
    ["riya_-draws", "double_separator"],
    ["", "too_short"],
  ])("rejects %j as %s", (u, reason) => {
    expect(validateUsernameFormat(u)).toMatchObject({ ok: false, reason });
  });

  it("matches the database check constraint exactly", () => {
    // Keep in sync with creator_profiles.username checks (migration 20261108140000).
    const db = (u: string) =>
      /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])$/.test(u) && !/[-_]{2}/.test(u);
    for (const u of [
      "abc",
      "a_b",
      "a-b",
      "a--b",
      "a_-b",
      "ab",
      "abc-",
      "x".repeat(30),
      "x".repeat(31),
      "Abc",
    ]) {
      expect(validateUsernameFormat(u).ok, u).toBe(db(u));
    }
  });
});

describe("canonicalUsername", () => {
  it("treats hyphen and underscore as the same, so lookalikes collide", () => {
    expect(canonicalUsername("riya-draws")).toBe(canonicalUsername("riya_draws"));
    expect(canonicalUsername("l41n-pr0t0")).toBe("l41n_pr0t0");
  });
});
