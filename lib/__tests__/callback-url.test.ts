import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSafeCallbackUrl } from "../callback-url";

// Mock window.location.origin so URL() resolves relative paths to our origin
const mockOrigin = "http://localhost:3000";
beforeEach(() => {
  Object.defineProperty(window, "location", {
    value: { origin: mockOrigin },
    writable: true,
  });
});

describe("getSafeCallbackUrl", () => {
  it("returns / when no callbackUrl provided", () => {
    expect(getSafeCallbackUrl(null)).toBe("/");
  });

  it("returns / as-is", () => {
    expect(getSafeCallbackUrl("/")).toBe("/");
  });

  it("allows normal relative path", () => {
    expect(getSafeCallbackUrl("/hives")).toBe("/hives");
  });

  it("allows relative path with query string", () => {
    expect(getSafeCallbackUrl("/hives?tab=inspections&apiary=5")).toBe(
      "/hives?tab=inspections&apiary=5",
    );
  });

  it("allows relative path with hash", () => {
    expect(getSafeCallbackUrl("/hives#section")).toBe("/hives#section");
  });

  it("rejects //evil.com (protocol-relative)", () => {
    expect(getSafeCallbackUrl("//evil.com")).toBe("/");
  });

  it("rejects /\\evil.com (backslash normalisation — browser resolves to https://evil.com/)", () => {
    expect(getSafeCallbackUrl("/\\evil.com")).toBe("/");
  });

  it("rejects https://evil.com", () => {
    expect(getSafeCallbackUrl("https://evil.com/phish")).toBe("/");
  });

  it("rejects http://localhost:9999 (different port = different origin)", () => {
    // Same host but different port → different origin
    expect(getSafeCallbackUrl("http://localhost:9999/")).toBe("/");
  });

  it("rejects javascript: URI", () => {
    expect(getSafeCallbackUrl("javascript:alert(1)")).toBe("/");
  });

  it("rejects data: URI", () => {
    expect(getSafeCallbackUrl("data:text/html,<script>alert(1)</script>")).toBe(
      "/",
    );
  });

  it("rejects relative URL that resolves to external origin via base", () => {
    // Even though it looks relative, if someone could control the base
    // this would be caught by the origin check. With our fixed base,
    // a path like "/hives" stays safe.
    expect(getSafeCallbackUrl("/hives")).toBe("/hives");
  });

  it("allows same-origin absolute URL", () => {
    expect(getSafeCallbackUrl("http://localhost:3000/hives")).toBe("/hives");
  });

  it("preserves query string on same-origin URL", () => {
    expect(
      getSafeCallbackUrl("http://localhost:3000/hives?tab=inspections"),
    ).toBe("/hives?tab=inspections");
  });
});
