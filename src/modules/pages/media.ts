import { publicEnv } from "@/lib/env/public";

export type MediaBucket = "avatars" | "covers" | "page-media";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/** The only shape the server ever writes: "<owner uuid>/<uuid>.<ext>". */
export function isOwnImagePath(ownerId: string, path: string | null | undefined): path is string {
  if (!path) return false;
  return new RegExp(`^${ownerId}/${UUID}\\.(jpg|png|webp)$`).test(path);
}

/** Public URL for an image, or null if the path is not the owner's. */
export function mediaUrl(bucket: MediaBucket, ownerId: string, path: string | null | undefined) {
  if (!isOwnImagePath(ownerId, path)) return null;
  return `${publicEnv().NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
