import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { admin, anon } from "./helpers";

const hit = (key: string, windowSeconds: number, max: number) =>
  admin().rpc("rate_limit_hit", { p_key: key, p_window_seconds: windowSeconds, p_max: max });

describe("rate_limit_hit", () => {
  it("allows up to the max, then refuses with a wait", async () => {
    const key = `it-${randomUUID()}`;
    for (let i = 0; i < 3; i++) {
      const { data } = await hit(key, 60, 3);
      expect(data?.[0]).toMatchObject({ allowed: true, retry_after_seconds: 0 });
    }
    const { data } = await hit(key, 60, 3);
    expect(data?.[0].allowed).toBe(false);
    expect(data?.[0].retry_after_seconds).toBeGreaterThan(0);
    expect(data?.[0].retry_after_seconds).toBeLessThanOrEqual(60);
  });

  it("counts keys independently", async () => {
    const { data } = await hit(`it-${randomUUID()}`, 60, 1);
    expect(data?.[0].allowed).toBe(true);
  });

  it("opens a fresh window once the old one has passed", async () => {
    const key = `it-${randomUUID()}`;
    await hit(key, 1, 1);
    expect((await hit(key, 1, 1)).data?.[0].allowed).toBe(false);
    await new Promise((r) => setTimeout(r, 1200));
    expect((await hit(key, 1, 1)).data?.[0].allowed).toBe(true);
  });

  it("is closed to clients", async () => {
    const { error } = await anon().rpc("rate_limit_hit", {
      p_key: "x",
      p_window_seconds: 60,
      p_max: 1,
    });
    expect(error).not.toBeNull();
    const { data } = await anon().from("rate_limit_buckets").select("*");
    expect(data ?? []).toHaveLength(0);
  });
});
