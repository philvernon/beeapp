// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("LAN-only sign-up restriction", () => {
  const originalNodeEnv = (process.env as Record<string, string>).NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    // LAN check only applies in production
    (process.env as Record<string, string>).NODE_ENV = "production";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (process.env as Record<string, string>).NODE_ENV = originalNodeEnv;
  });

  async function signUp(body: Record<string, unknown>, ip?: string) {
    const headers = new Headers();
    headers.set("content-type", "application/json");
    if (ip) headers.set("x-real-ip", ip);
    const req = new Request("http://localhost/api/auth/sign-up/email", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const { auth } = await import("@/lib/auth");
    return auth.handler(req);
  }

  it("rejects sign-up when IP is not on the LAN", async () => {
    const res = await signUp(
      {
        email: "external@example.com",
        password: "password123",
        name: "Test",
        username: "externaltest",
      },
      "10.0.0.5",
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toBe("Sign-up is restricted to the local network.");
  });

  it("rejects sign-up when IP header is missing", async () => {
    const res = await signUp({
      email: "noheader@example.com",
      password: "password123",
      name: "Test",
      username: "noheadertest",
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toBe("Sign-up is restricted to the local network.");
  });

  it("skips LAN check in development", async () => {
    (process.env as Record<string, string>).NODE_ENV = "development";
    vi.resetModules();

    const res = await signUp({
      email: "devskip@example.com",
      password: "password123",
      name: "Test",
      username: "devskiptest",
    });
    // Not 403 means the LAN hook passed through — the request proceeds
    // to the actual signup logic (which may fail for other reasons like
    // missing DB, but that's outside the scope of this test).
    expect(res.status).not.toBe(403);
  });
});
