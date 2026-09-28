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


