import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: () => {}, cacheTag: () => {} }));
const { isOwnImagePath } = await import("./public-page");

const owner = "11111111-2222-4333-8444-555555555555";
const file = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

describe("isOwnImagePath", () => {
  it("accepts only <owner>/<uuid>.<jpg|png|webp>", () => {
    expect(isOwnImagePath(owner, `${owner}/${file}.png`)).toBe(true);
    expect(isOwnImagePath(owner, `${owner}/${file}.jpg`)).toBe(true);
  });
  it.each([
    null,
    `../covers/${owner}/${file}.png`,
    `${owner}/../other/${file}.png`,
    `99999999-2222-4333-8444-555555555555/${file}.png`,
    `${owner}/${file}.svg`,
    `${owner}/${file}.png?x=1`,
    `${owner}/evil.png`,
    `https://evil.example/${file}.png`,
  ])("rejects %s", (path) => {
    expect(isOwnImagePath(owner, path)).toBe(false);
  });
});
