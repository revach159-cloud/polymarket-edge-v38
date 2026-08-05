const SAFE_REDIRECT_PATH = /^\/(?!\/)(?!\\)[\w\-./?=&%]*$/;

/**
 * Validates post-auth redirects to prevent open redirects.
 * Only relative same-origin paths are allowed.
 */
export function getSafeRedirectPath(
  candidate: string | null | undefined,
  fallback = "/account",
): string {
  if (!candidate) return fallback;
  const trimmed = candidate.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://") || trimmed.includes("\\")) return fallback;
  if (!SAFE_REDIRECT_PATH.test(trimmed)) return fallback;
  // Block protocol-relative and auth loops
  if (
    trimmed.startsWith("/login") ||
    trimmed.startsWith("/signup") ||
    trimmed.startsWith("/auth/")
  ) {
    return fallback;
  }
  return trimmed;
}
