type ThumbnailLike = {
  path?: string | null;
  url?: string | null;
};

export const MEDIA_FALLBACK = "/logo.png";

export function resolveMediaUrl(
  source?: string | null,
  fallback: string | null = MEDIA_FALLBACK,
): string | null {
  if (!source) return fallback;

  const normalized = source.trim();
  if (!normalized) return fallback;

  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("data:")
  ) {
    return normalized;
  }

  const storageBase = process.env.NEXT_PUBLIC_STORAGE_URL?.trim().replace(/\/$/, "");
  if (!storageBase) {
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  }

  return normalized.startsWith("/")
    ? `${storageBase}${normalized}`
    : `${storageBase}/${normalized}`;
}

export function resolveThumbnailUrl(
  thumbnail?: ThumbnailLike | null,
  fallback: string | null = MEDIA_FALLBACK,
): string | null {
  return resolveMediaUrl(thumbnail?.path ?? thumbnail?.url ?? null, fallback);
}
