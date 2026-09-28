// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as handlers from "../apiaries/[id]/route";

const TEST_ID = "a1b2c3d4-e5f6-4789-abcd-ef1234567890";

function mockParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const mocks = vi.hoisted(() => ({
  dbUpdate: vi.fn(),
  dbDelete: vi.fn(),
  getApiaryWithHives: vi.fn(),
}));

vi.mock("@/lib/data", () => ({
  getApiaryWithHives: (...args: unknown[]) => mocks.getApiaryWithHives(...args),
}));

vi.mock("@/lib/db", () => ({
  db: {
    update: (...args: unknown[]) => mocks.dbUpdate(...args),
    delete: (...args: unknown[]) => mocks.dbDelete(...args),
  },
}));

const TEST_APIARY = {
  id: TEST_ID,
  name: "Garden Apiary",
  notes: "Behind the house",
  createdAt: new Date("2025-01-15T10:00:00Z"),
};

describe("GET /api/apiaries/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with apiary + hives + inspection counts", async () => {
    mocks.getApiaryWithHives.mockResolvedValue({
      ...TEST_APIARY,
      hives: [],
    });

    const response = await handlers.GET({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(200);
  });

  it("returns 404 when apiary not found", async () => {
    mocks.getApiaryWithHives.mockResolvedValue(null);

    const response = await handlers.GET({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Apiary not found");
  });

  it("returns 400 when route UUID is malformed", async () => {
    const response = await handlers.GET(
      {} as Request,
      mockParams("not-a-uuid"),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid apiary id");
    expect(mocks.getApiaryWithHives).not.toHaveBeenCalled();
  });

  it("returns 400 when route UUID is empty", async () => {
    const response = await handlers.GET({} as Request, mockParams(""));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid apiary id");
  });

  it("returns 500 on error", async () => {
    mocks.getApiaryWithHives.mockRejectedValue(new Error("DB error"));

    const response = await handlers.GET({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal server error");
  });
});

describe("PUT /api/apiaries/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with updated apiary", async () => {
    const updatedRow = { ...TEST_APIARY, name: "Updated Apiary" };
    mocks.dbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedRow]),
        }),
      }),
    });

    const req = new Request("http://localhost/api/apiaries/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Apiary" }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.name).toBe("Updated Apiary");
  });

  it("returns 400 when name is empty string", async () => {
    const req = new Request("http://localhost/api/apiaries/" + TEST_ID, {
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
    const req = new Request("http://localhost/api/apiaries/" + TEST_ID, {
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
    const req = new Request("http://localhost/api/apiaries/" + TEST_ID, {
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
    const updatedRow = { ...TEST_APIARY, name: "Spaced" };
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

    const req = new Request("http://localhost/api/apiaries/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "  Spaced  " }),
    });

    await handlers.PUT(req, mockParams(TEST_ID));
    expect(
      (capturedUpdates as unknown as Record<string, unknown>)["name"],
    ).toBe("Spaced");
  });

  it("returns 404 when apiary not found (update returns empty)", async () => {
    mocks.dbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const req = new Request("http://localhost/api/apiaries/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(404);
  });

  it("returns 400 when route UUID is malformed", async () => {
    const req = new Request("http://localhost/api/apiaries/not-a-uuid", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });

    const response = await handlers.PUT(req, mockParams("not-a-uuid"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid apiary id");
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("returns 500 on error", async () => {
    mocks.dbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(new Error("DB error")),
        }),
      }),
    });

    const req = new Request("http://localhost/api/apiaries/" + TEST_ID, {
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

describe("DELETE /api/apiaries/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with success + deleted apiary when no hives exist", async () => {
    mocks.dbDelete.mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([TEST_APIARY]),
      }),
    });

    const response = await handlers.DELETE({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it("returns 404 when apiary not found", async () => {
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
    expect(body.error).toBe("Invalid apiary id");
    expect(mocks.dbDelete).not.toHaveBeenCalled();
  });

  it("returns 409 on FK violation (hive references apiary)", async () => {
    const fkError = Object.assign(
      new Error(
        'update or delete on table "apiaries" violates foreign key constraint',
      ),
      { code: "23503" },
    );
    mocks.dbDelete.mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(fkError),
      }),
    });

    const response = await handlers.DELETE({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe("Cannot delete apiary with existing hives");
  });

  it("returns 500 on unexpected DB error", async () => {
    mocks.dbDelete.mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(new Error("DB error")),
      }),
    });

    const response = await handlers.DELETE({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(500);
  });
});
