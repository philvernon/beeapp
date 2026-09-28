import { describe, it, expect } from "vitest";
import { getErrorMessage } from "../fetch";
describe("getErrorMessage", () => {
  it("returns empty string when response.ok is true", async () => {
    const response = new Response(null, { status: 200 });
    expect(await getErrorMessage(response)).toBe("");
  });

  it("parses JSON error body when content-type is application/json", async () => {
    const body = JSON.stringify({ error: "Something went wrong" });
    const response = new Response(body, {
      status: 500,
      headers: { "content-type": "application/json" },
    });
    expect(await getErrorMessage(response)).toBe("Something went wrong");
  });

  it("falls back to plain text body when content-type is not JSON", async () => {
    const response = new Response("Bad request", {
      status: 400,
      headers: { "content-type": "text/plain" },
    });
    expect(await getErrorMessage(response)).toBe("Bad request");
  });

  it("uses fallback string when body is empty/unparseable", async () => {
    const response = new Response("", {
      status: 500,
      headers: { "content-type": "application/json" },
    });
    expect(await getErrorMessage(response, "Fallback error")).toBe(
      "Fallback error",
    );
  });
  it("uses default fallback when body is empty and no custom fallback provided", async () => {
    const response = new Response("", {
      status: 500,
      headers: { "content-type": "application/json" },
    });
    expect(await getErrorMessage(response)).toBe(
      "An unexpected error occurred",
    );
  });
});
