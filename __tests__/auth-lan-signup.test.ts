// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const originalEnv = process.env.AUTH_SIGNUP_CIDR;

describe("LAN-only sign-up restriction", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.AUTH_SIGNUP_CIDR;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.AUTH_SIGNUP_CIDR = originalEnv;
    } else {
      delete process.env.AUTH_SIGNUP_CIDR;
    }
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

  it("allows sign-up when IP is within the CIDR range", async () => {
    process.env.AUTH_SIGNUP_CIDR = "192.168.1.0/24";
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

  it("rejects sign-up when IP is outside the CIDR range", async () => {
    process.env.AUTH_SIGNUP_CIDR = "192.168.1.0/24";
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

  it("rejects sign-up when AUTH_SIGNUP_CIDR is unset (fails closed)", async () => {
    delete process.env.AUTH_SIGNUP_CIDR;
    const res = await signUp(
      {
        email: "test@example.com",
        password: "password123",
        name: "Test",
        username: "testuser",
      },
      "192.168.1.50",
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toBe(
      "Sign-up is currently disabled. Contact an administrator.",
    );
  });

  it("rejects sign-up when AUTH_SIGNUP_CIDR is empty (fails closed)", async () => {
    process.env.AUTH_SIGNUP_CIDR = "";
    const res = await signUp(
      {
        email: "test@example.com",
        password: "password123",
        name: "Test",
        username: "testuser",
      },
      "192.168.1.50",
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toBe(
      "Sign-up is currently disabled. Contact an administrator.",
    );
  });

  it("rejects sign-up when AUTH_SIGNUP_CIDR is invalid", async () => {
    process.env.AUTH_SIGNUP_CIDR = "not-a-cidr";
    const res = await signUp(
      {
        email: "test@example.com",
        password: "password123",
        name: "Test",
        username: "testuser",
      },
      "192.168.1.50",
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toBe(
      "Sign-up is currently disabled. Contact an administrator.",
    );
  });

  it("falls back to x-forwarded-for when x-real-ip is absent", async () => {
    process.env.AUTH_SIGNUP_CIDR = "192.168.1.0/24";
    const headers = new Headers();
    headers.set("content-type", "application/json");
    headers.set("x-forwarded-for", "192.168.1.100");
    const req = new Request("http://localhost/api/auth/sign-up/email", {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        name: "Test",
        username: "testuser",
      }),
    });
    const { auth } = await import("@/lib/auth");
    const response = await auth.handler(req);
    expect(response.status).not.toBe(403);
  });

  it("prefers x-real-ip over x-forwarded-for", async () => {
    process.env.AUTH_SIGNUP_CIDR = "192.168.1.0/24";
    const headers = new Headers();
    headers.set("content-type", "application/json");
    headers.set("x-real-ip", "10.0.0.5");
    headers.set("x-forwarded-for", "192.168.1.100");
    const req = new Request("http://localhost/api/auth/sign-up/email", {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        name: "Test",
        username: "testuser",
      }),
    });
    const { auth } = await import("@/lib/auth");
    const response = await auth.handler(req);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.message).toBe("Sign-up is restricted to the local network.");
  });

  it("allows /24 network boundary — last address", async () => {
    process.env.AUTH_SIGNUP_CIDR = "192.168.1.0/24";
    const res = await signUp(
      {
        email: "test@example.com",
        password: "password123",
        name: "Test",
        username: "testuser",
      },
      "192.168.1.255",
    );
    expect(res.status).not.toBe(403);
  });

  it("rejects /24 network boundary — next subnet", async () => {
    process.env.AUTH_SIGNUP_CIDR = "192.168.1.0/24";
    const res = await signUp(
      {
        email: "test@example.com",
        password: "password123",
        name: "Test",
        username: "testuser",
      },
      "192.168.2.1",
    );
    expect(res.status).toBe(403);
  });

  it("allows /32 single-host range", async () => {
    process.env.AUTH_SIGNUP_CIDR = "192.168.1.5/32";
    const res = await signUp(
      {
        email: "test@example.com",
        password: "password123",
        name: "Test",
        username: "testuser",
      },
      "192.168.1.5",
    );
    expect(res.status).not.toBe(403);
  });

  it("rejects /32 single-host range — different host", async () => {
    process.env.AUTH_SIGNUP_CIDR = "192.168.1.5/32";
    const res = await signUp(
      {
        email: "test@example.com",
        password: "password123",
        name: "Test",
        username: "testuser",
      },
      "192.168.1.6",
    );
    expect(res.status).toBe(403);
  });
});
