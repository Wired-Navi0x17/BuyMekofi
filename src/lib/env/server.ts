import "server-only";
import { parseServerEnv, type ServerEnv } from "./server-schema";

export type { ServerEnv };

let cached: ServerEnv | undefined;

/** Server-only secrets. Importing this from a client component fails the build. */
export function serverEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
