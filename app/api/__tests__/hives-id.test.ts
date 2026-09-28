// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as handlers from "../hives/[id]/route";

const TEST_ID = "b2c3d4e5-f6a7-4890-bcde-f12345678901";

function mockParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const mocks = vi.hoisted(() => ({
  dbUpdate: vi.fn(),
  dbDelete: vi.fn(),
  getHive: vi.fn(),
}));

vi.mock("@/lib/data", () => ({
  getHive: (...args: unknown[]) => mocks.getHive(...args),
}));

vi.mock("@/lib/db", () => ({
  db: {
    update: (...args: unknown[]) => mocks.dbUpdate(...args),
    delete: (...args: unknown[]) => mocks.dbDelete(...args),
  },
}));

vi.mock("@/lib/auth-middleware", () => ({
  requireApiSession: async () => ({
    user: { id: "test-user" },
    session: { id: "test-session", token: "test-token" },
  }),
}));

const TEST_HIVE = {
  id: TEST_ID,
  apiaryId: "a1b2c3d4-e5f6-4789-abcd-ef1234567890",
  name: "Colony Alpha",
  queenColour: "Y",
  varroaLevel: "l",
  notes: null,
  createdAt: new Date("2025-01-15T10:00:00Z"),
};

describe("GET /api/hives/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with hive data", async () => {
    mocks.getHive.mockResolvedValue(TEST_HIVE);

    const response = await handlers.GET({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(200);
  });

  it("returns 404 when hive not found", async () => {
    mocks.getHive.mockResolvedValue(null);

    const response = await handlers.GET({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Hive not found");
  });

  it("returns 400 when route UUID is malformed", async () => {
    const response = await handlers.GET(
      {} as Request,
      mockParams("not-a-uuid"),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid hive id");
    expect(mocks.getHive).not.toHaveBeenCalled();
  });

  it("returns 500 on error", async () => {
    mocks.getHive.mockRejectedValue(new Error("DB error"));

    const response = await handlers.GET({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal server error");
  });
});

describe("PUT /api/hives/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with updated hive", async () => {
    const updatedRow = { ...TEST_HIVE, name: "Updated Colony" };
    mocks.dbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedRow]),
        }),
      }),
    });

    const req = new Request("http://localhost/api/hives/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Colony" }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.name).toBe("Updated Colony");
  });

  it("returns 400 when name is empty string", async () => {
    const req = new Request("http://localhost/api/hives/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 when name is whitespace only", async () => {
    const req = new Request("http://localhost/api/hives/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "   " }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 when no fields to update (empty body)", async () => {
    const req = new Request("http://localhost/api/hives/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("No fields to update");
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("trims name before saving", async () => {
    let capturedUpdates: Record<string, unknown> | null = null;
    const updatedRow = { ...TEST_HIVE, name: "Trimmed Colony" };
    mocks.dbUpdate.mockReturnValue({
      set: vi.fn().mockImplementation((updates: Record<string, unknown>) => {
        capturedUpdates = updates;
        return {
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedRow]),
          }),
        };
      }),
    });

    const req = new Request("http://localhost/api/hives/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "  Trimmed Colony  " }),
    });

    await handlers.PUT(req, mockParams(TEST_ID));
    expect(
      (capturedUpdates as unknown as Record<string, unknown>)["name"],
    ).toBe("Trimmed Colony");
  });

  it("returns 400 when apiaryId is null", async () => {
    const req = new Request("http://localhost/api/hives/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiaryId: null }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when hive not found (update returns empty)", async () => {
    mocks.dbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const req = new Request("http://localhost/api/hives/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(404);
  });

  it("returns 400 when route UUID is malformed", async () => {
    const req = new Request("http://localhost/api/hives/not-a-uuid", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });

    const response = await handlers.PUT(req, mockParams("not-a-uuid"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid hive id");
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("returns 422 when apiary does not exist (FK violation)", async () => {
    const fkError = Object.assign(new Error("fk violation"), { code: "23503" });
    mocks.dbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(fkError),
        }),
      }),
    });

    // Send a body that passes Zod validation so the FK error fires at the DB layer.
    const req = new Request("http://localhost/api/hives/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Updated",
        apiaryId: "d4e5f6a7-b8c9-4123-8ef0-123456789abc",
      }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toBe("Apiary does not exist");
  });

  it("returns 500 on error", async () => {
    mocks.dbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(new Error("DB error")),
        }),
      }),
    });

    const req = new Request("http://localhost/api/hives/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal server error");
  });
});

describe("DELETE /api/hives/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with success + deleted hive", async () => {
    mocks.dbDelete.mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([TEST_HIVE]),
      }),
    });

    const response = await handlers.DELETE({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it("returns 404 when hive not found", async () => {
    mocks.dbDelete.mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    });

    const response = await handlers.DELETE({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(404);
  });

  it("returns 400 when route UUID is malformed", async () => {
    const response = await handlers.DELETE(
      {} as Request,
      mockParams("not-a-uuid"),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid hive id");
    expect(mocks.dbDelete).not.toHaveBeenCalled();
  });

  it("returns 500 on error", async () => {
    mocks.dbDelete.mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(new Error("DB error")),
      }),
    });

    const response = await handlers.DELETE({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(500);
  });
});
