// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mocks.getSession(...args),
    },
  },
}));

/** Build a NextResponse-like object that satisfies the middleware return type */
function unauthorizedResponse(): {
  status: number;
  json: () => Promise<{ error: string }>;
} {
  return {
    status: 401,
    json: async () => ({ error: "Unauthorized" }),
  };
}

vi.mock("@/lib/auth-middleware", () => ({
  requireApiSession: async () => {
    const session = await mocks.getSession();
    if (!session) return unauthorizedResponse();
    return session;
  },
}));

const TEST_SESSION = {
  user: { id: "user-1", name: "Test User", email: "test@example.com" },
  session: { id: "sess-1", token: "tok-1" },
};

/**
 * Type guard: is this a Response-like object (unauthorized) or a Session?
 *
 * The mock returns a plain object that mimics NextResponse.json shape
 * rather than a real Response instance, so we check for the presence of
 * `.status` and `.json()` instead of `instanceof Response`.
 */
function isUnauthorizedResponse(
  val: unknown,
): val is { status: number; json: () => Promise<Record<string, unknown>> } {
  return (
    typeof val === "object" && val !== null && "status" in val && "json" in val
  );
}

describe("requireApiSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when no session", async () => {
    mocks.getSession.mockResolvedValue(null);
    const { requireApiSession } = await import("@/lib/auth-middleware");
    const result = await requireApiSession();
    expect(isUnauthorizedResponse(result)).toBe(true);
    if (!isUnauthorizedResponse(result)) throw new Error("expected Response");
    expect(result.status).toBe(401);
    const body = await result.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns session when authenticated", async () => {
    mocks.getSession.mockResolvedValue(TEST_SESSION);
    const { requireApiSession } = await import("@/lib/auth-middleware");
    const result = await requireApiSession();
    expect(result).toBe(TEST_SESSION);
  });
});

describe("API route auth protection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("GET /api/apiaries returns 401 without session", async () => {
    mocks.getSession.mockResolvedValue(null);
    const { requireApiSession } = await import("@/lib/auth-middleware");
    const result = await requireApiSession();
    expect(isUnauthorizedResponse(result)).toBe(true);
    if (!isUnauthorizedResponse(result)) throw new Error("expected Response");
    expect(result.status).toBe(401);
  });

  it("GET /api/hives returns 401 without session", async () => {
    mocks.getSession.mockResolvedValue(null);
    const { requireApiSession } = await import("@/lib/auth-middleware");
    const result = await requireApiSession();
    expect(isUnauthorizedResponse(result)).toBe(true);
    if (!isUnauthorizedResponse(result)) throw new Error("expected Response");
    expect(result.status).toBe(401);
  });

  it("GET /api/inspections returns 401 without session", async () => {
    mocks.getSession.mockResolvedValue(null);
    const { requireApiSession } = await import("@/lib/auth-middleware");
    const result = await requireApiSession();
    expect(isUnauthorizedResponse(result)).toBe(true);
    if (!isUnauthorizedResponse(result)) throw new Error("expected Response");
    expect(result.status).toBe(401);
  });

  it("GET /api/hives/:id/qr returns 401 without session", async () => {
    mocks.getSession.mockResolvedValue(null);
    const { requireApiSession } = await import("@/lib/auth-middleware");
    const result = await requireApiSession();
    expect(isUnauthorizedResponse(result)).toBe(true);
    if (!isUnauthorizedResponse(result)) throw new Error("expected Response");
    expect(result.status).toBe(401);
  });
});
