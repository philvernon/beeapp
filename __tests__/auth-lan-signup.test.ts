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

  it("allows sign-up when IP is on the LAN (192.168.1.x)", async () => {
    const res = await signUp(
      {
        email: "test@example.com",
        password: "password123",
        name: "Test",
        username: "testuser",
      },
      "192.168.1.50",
    );
    expect(res.status).not.toBe(403);
  });

  it("rejects sign-up when IP is not on the LAN", async () => {
    const res = await signUp(
      {
        email: "test@example.com",
        password: "password123",
        name: "Test",
        username: "testuser",
      },
      "10.0.0.5",
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toBe("Sign-up is restricted to the local network.");
  });

  it("rejects sign-up when IP header is missing", async () => {
    const res = await signUp({
      email: "test@example.com",
      password: "password123",
      name: "Test",
      username: "testuser",
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toBe("Sign-up is restricted to the local network.");
  });

  it("skips LAN check in development", async () => {
    (process.env as Record<string, string>).NODE_ENV = "development";
    vi.resetModules();

    const res = await signUp({
      email: "test@example.com",
      password: "password123",
      name: "Test",
      username: "testuser",
    });
    expect(res.status).not.toBe(403);
  });
});
