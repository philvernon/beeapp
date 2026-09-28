// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as handlers from "../hives/route";

const mocks = vi.hoisted(() => ({
  dbInsert: vi.fn(),
  getHives: vi.fn(),
}));

vi.mock("@/lib/data", () => ({
  getHives: (...args: unknown[]) => mocks.getHives(...args),
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: (...args: unknown[]) => mocks.dbInsert(...args),
  },
}));

vi.mock("@/lib/auth-middleware", () => ({
  requireApiSession: async () => ({
    user: { id: "test-user" },
    session: { id: "test-session", token: "test-token" },
  }),
}));

const TEST_HIVE = {
  id: "b2c3d4e5-f6a7-4890-bcde-f12345678901",
  apiaryId: "a1b2c3d4-e5f6-4789-abcd-ef1234567890",
  name: "Colony Alpha",
  queenColour: "Y",
  varroaLevel: "l",
  notes: null,
  createdAt: new Date("2025-01-15T10:00:00Z"),
};

describe("GET /api/hives", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with array of hives", async () => {
    mocks.getHives.mockResolvedValue([TEST_HIVE]);

    const req = new Request("http://localhost/api/hives");
    const response = await handlers.GET(req);
    expect(response.status).toBe(200);
  });

  it("returns 200 with empty array when no hives", async () => {
    mocks.getHives.mockResolvedValue([]);

    const req = new Request("http://localhost/api/hives");
    const response = await handlers.GET(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });

  it("returns 500 on data layer error", async () => {
    mocks.getHives.mockRejectedValue(new Error("DB connection failed"));

    const req = new Request("http://localhost/api/hives");
    const response = await handlers.GET(req);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal server error");
  });

  it("supports apiaryId filter", async () => {
    mocks.getHives.mockResolvedValue([TEST_HIVE]);

    const req = new Request(
      "http://localhost/api/hives?apiary_id=" + TEST_HIVE.apiaryId,
    );

    const response = await handlers.GET(req);
    expect(response.status).toBe(200);
    expect(mocks.getHives).toHaveBeenCalledWith({
      apiaryId: TEST_HIVE.apiaryId,
    });
  });

  it("returns 400 when apiary_id filter is malformed", async () => {
    const req = new Request("http://localhost/api/hives?apiary_id=not-a-uuid");

    const response = await handlers.GET(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid apiary_id");
    expect(mocks.getHives).not.toHaveBeenCalled();
  });
});

describe("POST /api/hives", () => {
  beforeEach(() => vi.clearAllMocks());
  const values = vi.fn().mockReturnValue({
    returning: vi.fn().mockResolvedValue([TEST_HIVE]),
  });

  it("returns 201 with created hive when valid", async () => {
    mocks.dbInsert.mockReturnValue({
      values,
    });

    const req = new Request("http://localhost/api/hives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiaryId: TEST_HIVE.apiaryId,
        name: TEST_HIVE.name,
        queenBreed: null,
        notes: null,
      }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(201);
    expect(values).toHaveBeenCalledWith({
      apiaryId: TEST_HIVE.apiaryId,
      name: TEST_HIVE.name,
      queenBreed: null,
      queenClipped: undefined,
      notes: null,
    });
    const body = await response.json();
    expect(body.name).toBe(TEST_HIVE.name);
  });

  it("returns 400 when name is missing", async () => {
    const req = new Request("http://localhost/api/hives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiaryId: TEST_HIVE.apiaryId }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(mocks.dbInsert).not.toHaveBeenCalled();
  });

  it("returns 400 when name is empty string", async () => {
    const req = new Request("http://localhost/api/hives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiaryId: TEST_HIVE.apiaryId, name: "" }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(mocks.dbInsert).not.toHaveBeenCalled();
  });

  it("returns 400 when name is whitespace only", async () => {
    const req = new Request("http://localhost/api/hives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiaryId: TEST_HIVE.apiaryId, name: "   " }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(mocks.dbInsert).not.toHaveBeenCalled();
  });

  it("trims whitespace from name before saving", async () => {
    mocks.dbInsert.mockReturnValue({
      values,
    });

    const req = new Request("http://localhost/api/hives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiaryId: TEST_HIVE.apiaryId,
        name: "  Trimmed Hive  ",
        queenBreed: null,
        notes: null,
      }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(201);
    expect(values).toHaveBeenCalledWith({
      apiaryId: TEST_HIVE.apiaryId,
      name: "Trimmed Hive",
      queenBreed: null,
      queenClipped: undefined,
      notes: null,
    });
  });

  it("returns 400 when JSON body is invalid", async () => {
    const req = new Request("http://localhost/api/hives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalid json",
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid JSON body");
    expect(mocks.dbInsert).not.toHaveBeenCalled();
  });

  it("returns 422 when apiary does not exist (FK violation)", async () => {
    const fkError = Object.assign(new Error("fk violation"), { code: "23503" });
    mocks.dbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(fkError),
      }),
    });

    const req = new Request("http://localhost/api/hives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiaryId: TEST_HIVE.apiaryId,
        name: TEST_HIVE.name,
      }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toBe("Apiary does not exist");
  });

  it("returns 500 on DB error", async () => {
    mocks.dbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(new Error("DB error")),
      }),
    });

    const req = new Request("http://localhost/api/hives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiaryId: TEST_HIVE.apiaryId,
        name: TEST_HIVE.name,
      }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal server error");
  });
});
