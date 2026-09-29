import { describe, it, expect, beforeEach } from "vitest";
import { getSafeCallbackUrl } from "../callback-url";

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

  it("rejects /\\evil.com (backslash normalisation)", () => {
    expect(getSafeCallbackUrl("/\\evil.com")).toBe("/");
  });

  it("rejects https://evil.com", () => {
    expect(getSafeCallbackUrl("https://evil.com/phish")).toBe("/");
  });

  it("rejects http://localhost:9999 (different port)", () => {
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

  it("allows /hives (same-origin via default base)", () => {
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
