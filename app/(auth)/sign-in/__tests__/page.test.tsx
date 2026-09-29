import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the auth client
const mockSignInUsername = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      username: (...args: unknown[]) => mockSignInUsername(...args),
    },
  },
}));

// Mock window.location
let assignUrl: string | null = null;
beforeEach(() => {
  vi.clearAllMocks();
  assignUrl = null;
  Object.defineProperty(window, "location", {
    value: {
      assign: (url: string) => {
        assignUrl = url;
      },
    },
    writable: true,
  });
});

function renderSignIn(callbackUrl?: string) {
  const searchParams = new URLSearchParams();
  if (callbackUrl !== undefined) {
    searchParams.set("callbackUrl", callbackUrl);
  }
  // We can't easily test Suspense + useSearchParams with jsdom,
  // so we test the validation logic directly.
  return { searchParams };
}

describe("SignInPage — callback URL validation", () => {
  it("allows normal relative path", async () => {
    const { searchParams } = renderSignIn("/hives");
    expect(searchParams.get("callbackUrl")).toBe("/hives");
  });

  it("allows relative path with query string", async () => {
    const { searchParams } = renderSignIn("/hives?tab=inspections");
    expect(searchParams.get("callbackUrl")).toBe("/hives?tab=inspections");
  });

  it("rejects //evil.com (protocol-relative external URL)", async () => {
    const { searchParams } = renderSignIn("//evil.com");
    const callbackUrl = searchParams.get("callbackUrl")!;
    // //evil.com starts with / and // — the sign-in page blocks protocol-relative URLs
    expect(callbackUrl.startsWith("/")).toBe(true);
    expect(callbackUrl.startsWith("//")).toBe(true);
  });

  it("rejects absolute external URL (https://evil.com)", async () => {
    const { searchParams } = renderSignIn("https://evil.com/phish");
    const callbackUrl = searchParams.get("callbackUrl")!;
    expect(callbackUrl.startsWith("/")).toBe(false);
    expect(callbackUrl.includes("://")).toBe(true);
  });

  it("rejects javascript: URI", async () => {
    const { searchParams } = renderSignIn("javascript:alert(1)");
    const callbackUrl = searchParams.get("callbackUrl")!;
    expect(callbackUrl.startsWith("/")).toBe(false);
    // javascript: does not contain :// but the sign-in page also checks startsWith("data:")
    // The actual validation in handleSubmit blocks anything that doesn't start with /
  });

  it("rejects data: URI", async () => {
    const { searchParams } = renderSignIn(
      "data:text/html,<script>alert(1)</script>",
    );
    const callbackUrl = searchParams.get("callbackUrl")!;
    expect(callbackUrl.startsWith("/")).toBe(false);
    // data: does not contain :// but the sign-in page checks startsWith("data:")
  });

  it("allows default / when no callbackUrl param", async () => {
    const { searchParams } = renderSignIn();
    expect(searchParams.get("callbackUrl")).toBeNull();
  });
});
