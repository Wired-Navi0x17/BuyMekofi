import { describe, expect, it } from "vitest";
import { linkSchema, profileBasicsSchema, normaliseUrl } from "./onboarding-schema";

describe("profileBasicsSchema", () => {
  it("trims and accepts a normal profile", () => {
    const r = profileBasicsSchema.parse({ displayName: "  Riya Sen ", bio: " I draw maps. " });
    expect(r).toEqual({ displayName: "Riya Sen", bio: "I draw maps." });
  });
  it("requires a display name and caps lengths", () => {
    expect(profileBasicsSchema.safeParse({ displayName: "  ", bio: "" }).success).toBe(false);
    expect(profileBasicsSchema.safeParse({ displayName: "x".repeat(61), bio: "" }).success).toBe(
      false,
    );
    expect(
      profileBasicsSchema.safeParse({ displayName: "Riya", bio: "x".repeat(501) }).success,
    ).toBe(false);
  });
  it("turns an empty bio into null", () => {
    expect(profileBasicsSchema.parse({ displayName: "Riya", bio: "   " }).bio).toBeNull();
  });
});

describe("links", () => {
  it("upgrades bare domains to https and keeps https", () => {
    expect(normaliseUrl("instagram.com/riya")).toBe("https://instagram.com/riya");
    expect(normaliseUrl("https://riya.in")).toBe("https://riya.in/");
  });
  it.each([
    "javascript:alert(1)",
    "http://riya.in",
    "data:text/html,hi",
    "ftp://x.y",
    "https://",
    "not a url",
  ])("rejects %s", (url) => {
    expect(linkSchema.safeParse({ platform: "website", url }).success).toBe(false);
  });
  it("rejects unknown platforms", () => {
    expect(linkSchema.safeParse({ platform: "myspace", url: "https://x.com" }).success).toBe(false);
  });
});
