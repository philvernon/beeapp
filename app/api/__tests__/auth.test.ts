// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

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
    const response = await POST(
      new Request("http://localhost/api/auth/sign-out", { method: "POST" }),
    );
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
    const response = await POST(
      new Request("http://localhost/api/auth/sign-out", { method: "POST" }),
    );
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Sign out failed");
  });
});
