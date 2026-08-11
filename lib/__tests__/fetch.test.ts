import { describe, it, expect, vi } from "vitest";
import { getErrorMessage, safeJsonFetch } from "../fetch";
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

describe("safeJsonFetch", () => {
	it("returns { data, error: null } on success", async () => {
		const mockData = { id: "1", name: "Test" };
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockData),
			}),
		);

		const result = await safeJsonFetch("/api/test");
		expect(result).toEqual({ data: mockData, error: null });
	});

	it("returns { data: null, error: message } on non-ok response", async () => {
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

		const result = await safeJsonFetch("/api/test");
		expect(result).toEqual({ data: null, error: "Server error" });
	});

	it("returns { data: null, error: err.message } when fetch rejects with an Error", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Timeout")));

		const result = await safeJsonFetch("/api/test");
		expect(result).toEqual({ data: null, error: "Timeout" });
	});

	it('returns { data: null, error: "Network error" } for non-Error rejections', async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue("string error"));

		const result = await safeJsonFetch("/api/test");
		expect(result).toEqual({ data: null, error: "Network error" });
	});

	it("passes url and options to fetch", async () => {
		const mockFn = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({}),
		});
		vi.stubGlobal("fetch", mockFn);

		await safeJsonFetch("/api/test", { method: "POST", headers: { "X-Custom": "1" } });
		expect(mockFn).toHaveBeenCalledWith(
			"/api/test",
			expect.objectContaining({ method: "POST", headers: { "X-Custom": "1" } }),
		);
	});
});
