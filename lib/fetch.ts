/**
 * Extract a human-readable error message from a fetch response body.
 */
async function parseErrorBody(
  response: Response,
  fallback: string,
): Promise<string> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const body = (await response.json()) as Record<string, unknown>;
      if (typeof body.error === "string") return body.error;
    } catch {
      // fall through
    }
  }
  try {
    const text = await response.text();
    if (text) return text;
  } catch {
    // fall through
  }
  return fallback;
}

/**
 * Get a human-readable error message from a fetch response.
 */
export async function getErrorMessage(
  response: Response,
  fallback: string = "An unexpected error occurred",
): Promise<string> {
  if (response.ok) return "";
  return parseErrorBody(response, fallback);
}

/**
 * Safe JSON fetch helper for client-side API calls.
 * Checks response.ok before parsing, returns a structured error on failure.
 */
export async function safeJsonFetch(
  url: string,
  options?: RequestInit,
): Promise<{ data: unknown; error: string | null }> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const message = await parseErrorBody(
        response,
        `Request failed (${response.status})`,
      );
      return { data: null, error: message };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return { data: null, error: message };
  }
}
