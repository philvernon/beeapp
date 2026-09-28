// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as handlers from "../apiaries/route";

const mocks = vi.hoisted(() => ({
  dbInsert: vi.fn(),
  getApiaries: vi.fn(),
}));

vi.mock("@/lib/data", () => ({
  getApiaries: (...args: unknown[]) => mocks.getApiaries(...args),
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: (...args: unknown[]) => mocks.dbInsert(...args),
  },
}));

const TEST_APIARY = {
  id: "a1b2c3d4-e5f6-4789-abcd-ef1234567890",
  name: "Garden Apiary",
  notes: "Behind the house",
  createdAt: new Date("2025-01-15T10:00:00Z"),
};

describe("GET /api/apiaries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with array of apiaries", async () => {
    mocks.getApiaries.mockResolvedValue([TEST_APIARY]);

    const response = await handlers.GET();
    expect(response.status).toBe(200);
  });

  it("returns 500 on data layer error", async () => {
    mocks.getApiaries.mockRejectedValue(new Error("DB connection failed"));

    const response = await handlers.GET();
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: "Internal server error" });
  });
});

describe("POST /api/apiaries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 201 with created apiary when valid", async () => {
    const insertedRow = { ...TEST_APIARY, name: "New Apiary", notes: "Test" };
    const values = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([insertedRow]),
    });
    mocks.dbInsert.mockReturnValue({ values });

    const req = new Request("http://localhost/api/apiaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Apiary", notes: "Test" }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(201);
    expect(values).toHaveBeenCalledWith({ name: "New Apiary", notes: "Test" });
    const body = await response.json();
    expect(body.name).toBe("New Apiary");
  });

  it("returns 400 when name is missing", async () => {
    const req = new Request("http://localhost/api/apiaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: "No name" }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(body.details).toBeDefined();
    expect(mocks.dbInsert).not.toHaveBeenCalled();
  });

  it("returns 400 when name is empty string", async () => {
    const req = new Request("http://localhost/api/apiaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(mocks.dbInsert).not.toHaveBeenCalled();
  });

  it("returns 400 when name is whitespace only", async () => {
    const req = new Request("http://localhost/api/apiaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "   " }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(mocks.dbInsert).not.toHaveBeenCalled();
  });

  it("trims whitespace from name before saving", async () => {
    const insertedRow = { ...TEST_APIARY, name: "Trimmed Apiary" };
    const values = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([insertedRow]),
    });
    mocks.dbInsert.mockReturnValue({ values });

    const req = new Request("http://localhost/api/apiaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "  Trimmed Apiary  ", notes: "Test" }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(201);
    expect(values).toHaveBeenCalledWith({
      name: "Trimmed Apiary",
      notes: "Test",
    });
  });

  it("returns 400 when JSON body is invalid", async () => {
    const req = new Request("http://localhost/api/apiaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not valid json {{{",
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid JSON body");
    expect(mocks.dbInsert).not.toHaveBeenCalled();
  });

  it("returns 500 on DB error", async () => {
    mocks.dbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(new Error("DB error")),
      }),
    });

    const req = new Request("http://localhost/api/apiaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Apiary" }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal server error");
  });
});
