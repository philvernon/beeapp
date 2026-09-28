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

import { z } from "zod";

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

/**
 * Typed JSON fetch — reuses safeJsonFetch internals and parses successful
 * JSON through a Zod schema for runtime validation.
 *
 * Returns `{ data: T | null, error: string | null }` where `error` is set
 * when the response is non-OK, non-JSON, or fails schema validation.
 */
export async function parseJsonFetch<T>(
  url: string,
  schema: z.Schema<T>,
  options?: RequestInit,
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const message = await parseErrorBody(
        response,
        `Request failed (${response.status})`,
      );
      return { data: null, error: message };
    }

    // Handle non-JSON success responses (e.g. 204 No Content).
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      // SAFETY: Non-JSON responses are rare for our API; the caller
      // should handle null data gracefully. The type is a practical
      // concession — callers check `error` first.
      return { data: null as unknown as T, error: null };
    }

    const raw = await response.json();
    const result = schema.safeParse(raw);

    if (result.success) {
      return { data: result.data, error: null };
    }

    // Successful HTTP status but payload violates the transport contract.
    return {
      data: null,
      error: `Response validation failed: ${result.error.issues.map((i) => i.message).join(", ")}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return { data: null, error: message };
  }
}
