// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const TEST_SESSION = {
  user: { id: "user-1", name: "Test User", email: "test@example.com" },
  session: { id: "sess-1", token: "tok-1" },
};

// Shared mock state — controlled per test via getSessionImpl
const getSessionImpl = vi.fn().mockResolvedValue(null);

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => getSessionImpl(...args),
    },
  },
}));

describe("requireApiSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionImpl.mockResolvedValue(null);
  });

  it("returns 401 when auth.api.getSession returns null", async () => {
    getSessionImpl.mockResolvedValue(null);
    const { requireApiSession } = await import("@/lib/auth-middleware");
    const result = await requireApiSession();
    if (typeof result === "object" && "status" in result) {
      expect(result.status).toBe(401);
      const body = await result.json();
      expect(body).toEqual({ error: "Unauthorized" });
    } else {
      throw new Error("expected 401 Response");
    }
  });

  it("returns session when auth.api.getSession returns a session", async () => {
    getSessionImpl.mockResolvedValue(TEST_SESSION);
    const { requireApiSession } = await import("@/lib/auth-middleware");
    const result = await requireApiSession();
    expect(result).toBe(TEST_SESSION);
  });
});

describe("POST /api/auth/sign-out", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionImpl.mockResolvedValue(null);
  });

  it("returns 200 with redirect on successful sign-out", async () => {
    const mockSignOut = vi.fn().mockResolvedValue(undefined);
    // Re-mock auth to use our sign-out mock
    vi.doUnmock("@/lib/auth");
    vi.doMock("@/lib/auth", () => ({
      auth: {
        api: {
          signOut: mockSignOut,
          getSession: vi.fn().mockResolvedValue(null),
        },
      },
    }));

    // Need to re-import after doMock
    const { POST } = await import("../auth/sign-out/route");
    const response = await POST(new Request("http://localhost/api/auth/sign-out", { method: "POST" }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.redirect).toBe("/sign-in");
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("returns 500 when sign-out fails", async () => {
    // Use a fresh module graph — clear the cache first
    vi.resetModules();

    // Re-establish the next/headers mock after resetModules
    vi.doMock("next/headers", () => ({
      headers: vi.fn().mockResolvedValue(new Headers()),
    }));

    const mockSignOut = vi.fn().mockRejectedValue(new Error("DB error"));
    vi.doMock("@/lib/auth", () => ({
      auth: {
        api: {
          signOut: mockSignOut,
          getSession: vi.fn().mockResolvedValue(null),
        },
      },
    }));

    const { POST } = await import("../auth/sign-out/route");
    const response = await POST(new Request("http://localhost/api/auth/sign-out", { method: "POST" }));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Sign out failed");
  });
});

describe("API route auth protection (real handlers)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionImpl.mockResolvedValue(null);
  });

  it("GET /api/apiaries returns 401 when session is null", async () => {
    getSessionImpl.mockResolvedValue(null);
    const { GET } = await import("../apiaries/route");
    const response = await GET();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("GET /api/hives returns 401 when session is null", async () => {
    getSessionImpl.mockResolvedValue(null);
    const { GET } = await import("../hives/route");
    const response = await GET(new Request("http://localhost/api/hives"));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("GET /api/inspections returns 401 when session is null", async () => {
    getSessionImpl.mockResolvedValue(null);
    const { GET } = await import("../inspections/route");
    const response = await GET(new Request("http://localhost/api/inspections"));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("GET /api/hives/:id/qr returns 401 when session is null", async () => {
    getSessionImpl.mockResolvedValue(null);
    const { GET } = await import("../hives/[id]/qr/route");
    const response = await GET({} as Request, { params: Promise.resolve({ id: "test-id" }) });
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });
});
