import { z } from "zod";

export const serverSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    SUPABASE_SECRET_KEY: z.string().min(20),
    ELIGIBILITY_PEPPER: z.base64().refine((v) => Buffer.from(v, "base64").length >= 32, {
      message: "must decode to at least 32 bytes",
    }),
    PAYMENTS_MODE: z.enum(["mock", "live"]).default("mock"),
    MOCK_WEBHOOK_SECRET: z.string().min(32).optional(),
    ALLOW_MOCK_IN_PRODUCTION: z.stringbool().default(false),
    LIVE_PAYMENTS_APPROVED: z.stringbool().default(false),
  })
  .superRefine((env, ctx) => {
    if (env.PAYMENTS_MODE === "mock") {
      if (!env.MOCK_WEBHOOK_SECRET) {
        ctx.addIssue({
          code: "custom",
          path: ["MOCK_WEBHOOK_SECRET"],
          message: "required in mock mode",
        });
      }
      if (env.NODE_ENV === "production" && !env.ALLOW_MOCK_IN_PRODUCTION) {
        ctx.addIssue({
          code: "custom",
          path: ["PAYMENTS_MODE"],
          message: "mock payments are refused in production builds",
        });
      }
    }
    if (env.PAYMENTS_MODE === "live" && !env.LIVE_PAYMENTS_APPROVED) {
      ctx.addIssue({
        code: "custom",
        path: ["LIVE_PAYMENTS_APPROVED"],
        message: "live payments need explicit approval (PAYMENT_MODEL.md)",
      });
    }
  });

export type ServerEnv = z.infer<typeof serverSchema>;

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = serverSchema.safeParse(source);
  if (!result.success) {
    // Name the variables, never print their values.
    const problems = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid server environment:\n  ${problems.join("\n  ")}`);
  }
  return result.data;
}
