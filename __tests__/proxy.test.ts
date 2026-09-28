// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

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

describe("proxy.ts — authentication boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionImpl.mockResolvedValue(null);
  });

  async function proxy(
    pathname: string,
    headers?: Record<string, string>,
  ): Promise<Response> {
    const url = new URL(pathname, "http://localhost");
    const req = new NextRequest(url, { headers });
    // Re-import to pick up the current mock state
    vi.doUnmock("@/proxy");
    const { proxy } = await import("../proxy");
    return proxy(req);
  }

  // ── Unauthenticated pages ────────────────────────────────────────

  it("redirects unauthenticated normal page to /sign-in", async () => {
    const response = await proxy("/hives");
    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/sign-in");
    expect(location).toContain("callbackUrl=%2Fhives");
  });

  it("redirects unauthenticated /hive-scan to /sign-in", async () => {
    const response = await proxy("/hive-scan");
    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/sign-in");
  });

  // ── Authenticated pages ──────────────────────────────────────────

  it("continues authenticated normal page", async () => {
    getSessionImpl.mockResolvedValue({ id: "sess-1" });
    const response = await proxy("/hives");
    expect(response.status).toBe(200);
  });

  it("continues authenticated /hive-scan", async () => {
    getSessionImpl.mockResolvedValue({ id: "sess-1" });
    const response = await proxy("/hive-scan");
    expect(response.status).toBe(200);
  });

  // ── Unauthenticated BeeApp APIs → 401 JSON ───────────────────────

  it("returns 401 JSON for unauthenticated /api/hives", async () => {
    const response = await proxy("/api/hives");
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 JSON for unauthenticated /api/apiaries", async () => {
    const response = await proxy("/api/apiaries");
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  // ── Authenticated BeeApp APIs → continue ─────────────────────────

  it("continues authenticated /api/hives", async () => {
    getSessionImpl.mockResolvedValue({ id: "sess-1" });
    const response = await proxy("/api/hives");
    expect(response.status).toBe(200);
  });

  // ── Public routes stay public ────────────────────────────────────

  it("allows unauthenticated access to /sign-in", async () => {
    const response = await proxy("/sign-in");
    expect(response.status).toBe(200);
  });

  it("allows unauthenticated access to /sign-up", async () => {
    const response = await proxy("/sign-up");
    expect(response.status).toBe(200);
  });

  it("allows unauthenticated access to /api/auth/sign-out", async () => {
    const response = await proxy("/api/auth/sign-out");
    expect(response.status).toBe(200);
  });

  it("allows unauthenticated access to /api/auth/session", async () => {
    const response = await proxy("/api/auth/session");
    expect(response.status).toBe(200);
  });
});
