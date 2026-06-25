import { getSafeCallbackUrl } from "./get-safe-callback-url";

export const ADMIN_SIGN_IN_PATH = "/auth/admin/signin";

export function getAdminCallbackUrl(
  callbackUrl?: string | null,
  fallback = "/admin-account",
): string {
  if (!callbackUrl?.startsWith("/admin-account")) {
    return fallback;
  }

  return getSafeCallbackUrl(callbackUrl, fallback);
}

export function getAdminSignInUrl(callbackUrl?: string): string {
  if (!callbackUrl) {
    return ADMIN_SIGN_IN_PATH;
  }

  return `${ADMIN_SIGN_IN_PATH}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
