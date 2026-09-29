/**
 * Validate a callback URL from the sign-in flow.
 *
 * Uses URL parsing instead of string checks so that browser normalisation
 * (e.g. backslash → slash) cannot bypass the origin check.
 */
export function getSafeCallbackUrl(raw: string | null): string {
  const candidate = raw ?? "/";

  if (candidate === "/") return "/";

  try {
    const url = new URL(candidate, window.location.origin);

    if (url.origin !== window.location.origin) {
      return "/";
    }

    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}
