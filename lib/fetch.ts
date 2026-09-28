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
 * Result of a typed JSON fetch.
 *
 * - `data` is the parsed (and optionally validated) response body on success,
 *   or `null` when the response is non-OK, non-JSON, or fails validation.
 * - `error` is set when `data` is null — it describes why (HTTP error, network
 *   failure, or schema validation failure).
 *
 * A non-JSON success response (e.g. 204 No Content) returns `{ data: null, error: null }`
 * so callers can distinguish "no body" from an actual error by checking both fields.
 */
export async function fetchJson<T>(
  url: string,
  schema?: z.Schema<T>,
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

    if (schema) {
      const result = schema.safeParse(raw);
      if (result.success) {
        return { data: result.data, error: null };
      }
      // Successful HTTP status but payload violates the transport contract.
      return {
        data: null,
        error: `Response validation failed: ${result.error.issues.map((i) => i.message).join(", ")}`,
      };
    }

    return { data: raw as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return { data: null, error: message };
  }
}

/**
 * Safe JSON fetch — returns raw JSON without schema validation.
 * Kept for backwards compatibility; use `fetchJson` directly where possible.
 */
export async function safeJsonFetch(
  url: string,
  options?: RequestInit,
): Promise<{ data: unknown; error: string | null }> {
  return fetchJson(url, undefined, options);
}

/**
 * Typed JSON fetch — parses successful JSON through a Zod schema for runtime validation.
 * Kept for backwards compatibility; use `fetchJson` directly where possible.
 */
export async function parseJsonFetch<T>(
  url: string,
  schema: z.Schema<T>,
  options?: RequestInit,
): Promise<{ data: T | null; error: string | null }> {
  return fetchJson(url, schema, options);
}
