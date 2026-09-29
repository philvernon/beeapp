/**
 * Validate a callback URL from the sign-in flow.
 *
 * Uses URL parsing instead of string checks so that browser normalisation
 * (e.g. backslash → slash, /\\evil.com → https://evil.com/) cannot bypass
 * the origin check.
 */
export function getSafeCallbackUrl(raw: string | null): string {
  const candidate = raw ?? "/";

  // Fast path: bare "/" is always safe
  if (candidate === "/") return "/";

  try {
    const url = new URL(candidate, window.location.origin);

    // Same-origin check — blocks https://, //, javascript:, data:, etc.
    if (url.origin !== window.location.origin) {
      return "/";
    }

    // Reconstruct only the path portion to strip any injected origin
    return url.pathname + url.search + url.hash;
  } catch {
    // Malformed URL — fall back to root
    return "/";
  }
}
