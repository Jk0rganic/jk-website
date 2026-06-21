export function getSafeCallbackUrl(
  callbackUrl?: string | null,
  fallback = "/",
): string {
  if (!callbackUrl) return fallback;
  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return fallback;
  }
  return callbackUrl;
}
