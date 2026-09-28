import { describe, it, expect, vi } from "vitest";
import { fetchJson } from "../fetch";
import { z } from "zod";

const TestSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

describe("fetchJson", () => {
  it("returns parsed data on successful JSON response (no schema)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () =>
          Promise.resolve({
            id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
            name: "Test",
          }),
      }),
    );

    const result = await fetchJson("/api/test");
    expect(result).toEqual({
      data: {
        id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        name: "Test",
      },
      error: null,
    });
  });

  it("returns parsed data on successful JSON response (with schema)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () =>
          Promise.resolve({
            id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
            name: "Test",
          }),
      }),
    );

    const result = await fetchJson("/api/test", TestSchema);
    expect(result).toEqual({
      data: {
        id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        name: "Test",
      },
      error: null,
    });
  });

  it("returns error on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve({ error: "Server error" }),
        text: () => Promise.resolve("Server error"),
      }),
    );

    const result = await fetchJson("/api/test", TestSchema);
    expect(result).toEqual({ data: null, error: "Server error" });
  });

  it("returns error on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Timeout")));

    const result = await fetchJson("/api/test", TestSchema);
    expect(result).toEqual({ data: null, error: "Timeout" });
  });

  it("returns validation error when response violates schema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve({ id: "not-a-uuid", name: "Test" }),
      }),
    );

    const result = await fetchJson("/api/test", TestSchema);
    expect(result.data).toBeNull();
    expect(result.error).toContain("Response validation failed");
  });

  it("returns null data for non-JSON success responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/plain" }),
        json: () => Promise.resolve({}),
      }),
    );

    const result = await fetchJson("/api/test", TestSchema);
    expect(result.error).toBeNull();
  });

  it("passes url and options to fetch", async () => {
    const mockFn = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () =>
        Promise.resolve({
          id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
          name: "Test",
        }),
    });
    vi.stubGlobal("fetch", mockFn);

    await fetchJson("/api/test", TestSchema, {
      method: "POST",
      headers: { "X-Custom": "1" },
    });
    expect(mockFn).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({ method: "POST", headers: { "X-Custom": "1" } }),
    );
  });

  it("handles array schemas", async () => {
    const ArraySchema = z.array(TestSchema);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () =>
          Promise.resolve([
            {
              id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
              name: "Test 1",
            },
          ]),
      }),
    );

    const result = await fetchJson("/api/test", ArraySchema);
    expect(result.data).toEqual([
      { id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8", name: "Test 1" },
    ]);
    expect(result.error).toBeNull();
  });
});
