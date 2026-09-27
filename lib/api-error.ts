/**
 * Structured API error that routes carry as NextResponse.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Check if an error object is a PostgreSQL error with the given SQLSTATE code.
 * Walks up to two levels of .cause chains to handle DrizzleQueryError wrappers
 * (drizzle-orm@0.45+ wraps the original pg error on .cause).
 * Used by routes for operation-specific constraint handling — not a global map.
 */
export function isPgError(err: unknown, code: string): boolean {
  let current: unknown = err;

  for (let depth = 0; depth < 3; depth++) {
    if (typeof current !== "object" || current === null) return false;

    if ("code" in current && (current as { code?: unknown }).code === code) {
      return true;
    }

    current =
      "cause" in current ? (current as { cause?: unknown }).cause : undefined;
  }

  return false;
}

/**
 * Validate that a string is a well-formed UUID.
 * Throws ApiError(400) when malformed so callers can catch and respond.
 */
export function validateUuid(value: unknown, name: string): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw new ApiError(400, `Invalid ${name}`);
  }
  return value;
}

/**
 * Parse a request body as JSON, returning the parsed value.
 * Throws ApiError(400) when the body is not valid JSON.
 */
export async function parseJsonBody<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
}

/**
 * Build a NextResponse from a caught error.
 *
 * - ApiError → status + message from the error (deliberate application errors).
 * - Everything else → log server-side, return generic 500.
 *
 * Client-facing responses are always generic — internal details are logged
 * only and never sent to the client, regardless of environment.
 */
export function errorResponse(err: unknown): Response {
  if (err instanceof ApiError) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: err.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.error("Database error:", err);

  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
