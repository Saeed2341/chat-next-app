/** Resolve relative upload paths to absolute URLs (fixes mobile/LAN/PWA issues). */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  if (typeof window !== "undefined") {
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${window.location.origin}${path}`;
  }
  return url;
}

/** Normalize attachment URLs when loading from server/cache. */
export function normalizeAttachmentUrls<T extends { url?: string; previewUrl?: string }>(
  attachment: T,
): T {
  return {
    ...attachment,
    url: attachment.url?.startsWith("http")
      ? attachment.url
      : attachment.url
        ? attachment.url.startsWith("/")
          ? attachment.url
          : `/${attachment.url}`
        : attachment.url,
    previewUrl: attachment.previewUrl?.startsWith("http")
      ? attachment.previewUrl
      : attachment.previewUrl
        ? attachment.previewUrl.startsWith("/")
          ? attachment.previewUrl
          : `/${attachment.previewUrl}`
        : attachment.previewUrl,
  };
}
