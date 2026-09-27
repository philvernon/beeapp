// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ApiError,
  isPgError,
  validateUuid,
  parseJsonBody,
  errorResponse,
} from "../api-error";

describe("ApiError", () => {
  it("stores status and message", () => {
    const err = new ApiError(400, "Bad request");
    expect(err.status).toBe(400);
    expect(err.message).toBe("Bad request");
    expect(err.name).toBe("ApiError");
  });

  it("is an instance of Error", () => {
    const err = new ApiError(422, "Constraint violation");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("validateUuid", () => {
  it("returns valid UUID strings unchanged", () => {
    expect(validateUuid("a1b2c3d4-e5f6-4789-abcd-ef1234567890", "id")).toBe(
      "a1b2c3d4-e5f6-4789-abcd-ef1234567890",
    );
  });

  it("accepts uppercase hex", () => {
    expect(validateUuid("A1B2C3D4-E5F6-4789-ABCD-EF1234567890", "id")).toBe(
      "A1B2C3D4-E5F6-4789-ABCD-EF1234567890",
    );
  });

  it("throws ApiError(400) for non-string values", () => {
    expect(() => validateUuid(123, "id")).toThrow(ApiError);
    expect(() => validateUuid(null, "id")).toThrow(ApiError);
    expect(() => validateUuid(undefined, "id")).toThrow(ApiError);
    expect(() => validateUuid([], "id")).toThrow(ApiError);
  });

  it("throws ApiError(400) for malformed strings", () => {
    expect(() => validateUuid("", "id")).toThrow(ApiError);
    expect(() => validateUuid("not-a-uuid", "id")).toThrow(ApiError);
    expect(() => validateUuid("abc", "id")).toThrow(ApiError);
    expect(() =>
      validateUuid("a1b2c3d4e5f64789abcdef1234567890", "id"),
    ).toThrow(ApiError);
  });

  it("includes the name in the error message", () => {
    try {
      validateUuid("bad", "apiary_id");
      expect.unreachable();
    } catch (err) {
      expect((err as ApiError).message).toBe("Invalid apiary_id");
    }
  });
});

describe("parseJsonBody", () => {
  it("parses valid JSON", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "test" }),
    });
    const result = await parseJsonBody<{ name: string }>(req);
    expect(result).toEqual({ name: "test" });
  });

  it("throws ApiError(400) for invalid JSON", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{broken",
    });
    await expect(parseJsonBody(req)).rejects.toThrow(ApiError);
    await expect(parseJsonBody(req)).rejects.toHaveProperty("status", 400);
  });

  it("throws ApiError(400) for non-JSON content", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      body: "plain text",
    });
    await expect(parseJsonBody(req)).rejects.toThrow(ApiError);
  });
});

describe("isPgError", () => {
  it("returns true when error has matching SQLSTATE code", () => {
    const err = Object.assign(new Error("fk"), { code: "23503" });
    expect(isPgError(err, "23503")).toBe(true);
  });

  it("returns false for non-matching code", () => {
    const err = Object.assign(new Error("fk"), { code: "23503" });
    expect(isPgError(err, "23514")).toBe(false);
  });

  it("returns false for errors without a code property", () => {
    expect(isPgError(new Error("plain"), "23503")).toBe(false);
  });

  it("returns false for non-object errors", () => {
    expect(isPgError("string", "23503")).toBe(false);
    expect(isPgError(null, "23503")).toBe(false);
    expect(isPgError(undefined, "23503")).toBe(false);
  });
});

describe("errorResponse", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns ApiError message and status for ApiError instances", () => {
    const err = new ApiError(400, "Invalid apiary id");
    const res = errorResponse(err);
    expect(res.status).toBe(400);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    return expect(res.json()).resolves.toEqual({ error: "Invalid apiary id" });
  });

  it("returns Internal server error for unexpected errors", () => {
    const err = new Error("connection refused");
    const res = errorResponse(err);
    expect(res.status).toBe(500);
    return expect(res.json()).resolves.toEqual({
      error: "Internal server error",
    });
  });

  it("does not leak internal details in client response for unexpected errors", () => {
    const err = Object.assign(
      new Error('FATAL: password authentication failed for user "admin"'),
      { code: "28000" },
    );
    const res = errorResponse(err);
    expect(res.status).toBe(500);
    return expect(res.json()).resolves.toEqual({
      error: "Internal server error",
    });
  });

  it("logs unexpected errors to console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("something broke");
    errorResponse(err);
    expect(spy).toHaveBeenCalledWith("Database error:", err);
    spy.mockRestore();
  });

  it("does not log for ApiError instances", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new ApiError(400, "Bad request");
    errorResponse(err);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
