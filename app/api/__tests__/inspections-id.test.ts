// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as handlers from "../inspections/[id]/route";

const TEST_ID = "c3d4e5f6-a7b8-4012-cdef-123456789012";

function mockParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const mocks = vi.hoisted(() => ({
  dbUpdate: vi.fn(),
  dbDelete: vi.fn(),
  getInspection: vi.fn(),
}));

vi.mock("@/lib/data", () => ({
  getInspection: (...args: unknown[]) => mocks.getInspection(...args),
}));

vi.mock("@/lib/db", () => ({
  db: {
    update: (...args: unknown[]) => mocks.dbUpdate(...args),
    delete: (...args: unknown[]) => mocks.dbDelete(...args),
  },
}));

const TEST_INSPECTION = {
  id: TEST_ID,
  hiveId: "b2c3d4e5-f6a7-4890-bcde-f12345678901",
  inspectionDate: "2025-03-01",
  queenSeen: true,
  eggsSeen: true,
  healthOk: true,
  varroaLevel: "l",
  notes: null,
  createdAt: new Date("2025-03-01T10:00:00Z"),
};

describe("GET /api/inspections/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with inspection data", async () => {
    mocks.getInspection.mockResolvedValue(TEST_INSPECTION);

    const response = await handlers.GET({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(200);
  });

  it("returns 404 when not found", async () => {
    mocks.getInspection.mockResolvedValue(null);

    const response = await handlers.GET({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Inspection not found");
  });

  it("returns 500 on error", async () => {
    mocks.getInspection.mockRejectedValue(new Error("DB error"));

    const response = await handlers.GET({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(500);
  });
});

describe("PUT /api/inspections/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getInspection.mockResolvedValue(TEST_INSPECTION);
  });

  it("rejects null JSON body", async () => {
    const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "null",
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
  });

  it("rejects primitive JSON body", async () => {
    const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: '"hello"',
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
  });

  it("rejects array JSON body", async () => {
    const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: '[1, 2]',
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
  });

  it("returns 200 with updated inspection", async () => {
    const updatedRow = { ...TEST_INSPECTION, notes: "Updated notes" };
    mocks.dbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedRow]),
        }),
      }),
    });

    const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: "Updated notes" }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.notes).toBe("Updated notes");
  });

  it("returns 400 when temperamentScore is out of range", async () => {
    const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ temperamentScore: 15 }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 when no fields to update", async () => {
    const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    const body = await response.json();
    expect(body.error).toBe("No fields to update");
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("rejects hiveId in update body explicitly", async () => {
    const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hiveId: "d4e5f6a7-b8c9-4123-defa-234567890123" }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("hiveId cannot be changed via this endpoint");
    expect(mocks.getInspection).not.toHaveBeenCalled();
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("rejects inspectionDate in update body explicitly", async () => {
    const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inspectionDate: "2025-04-01" }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe(
      "inspectionDate cannot be changed via this endpoint",
    );
    expect(mocks.getInspection).not.toHaveBeenCalled();
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("rejects hiveId even when combined with other valid fields", async () => {
    const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hiveId: "d4e5f6a7-b8c9-4123-defa-234567890123",
        notes: "Updated notes",
      }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("hiveId cannot be changed via this endpoint");
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  // ── State-dependent cross-field invariants ──────────────────────

  it("rejects patch queenSeen=false when existing row has queenColour set", async () => {
    const existingWithColour = {
      ...TEST_INSPECTION,
      queenSeen: true,
      queenColour: "Y",
    };
    mocks.getInspection.mockResolvedValue(existingWithColour);

    const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queenSeen: false }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("rejects patch healthOk=true when existing row has disease flags", async () => {
    const existingWithDisease = {
      ...TEST_INSPECTION,
      healthOk: false,
      chalkBroodSuspected: true,
    };
    mocks.getInspection.mockResolvedValue(existingWithDisease);

    const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ healthOk: true }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("accepts patch queenCellsRemoved=true when existing row has queenCellsFound > 0", async () => {
    const existingWithCells = {
      ...TEST_INSPECTION,
      queenCellsFound: 2,
      queenCellsRemoved: false,
    };
    mocks.getInspection.mockResolvedValue(existingWithCells);

    const updatedRow = { ...existingWithCells, queenCellsRemoved: true };
    mocks.dbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedRow]),
        }),
      }),
    });

    const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queenCellsRemoved: true }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.queenCellsRemoved).toBe(true);
  });

  it("rejects patch queenCellsRemoved=true when existing row has queenCellsFound=0", async () => {
    const existingWithZeroCells = {
      ...TEST_INSPECTION,
      queenCellsFound: 0,
      queenCellsRemoved: false,
    };
    mocks.getInspection.mockResolvedValue(existingWithZeroCells);

    const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queenCellsRemoved: true }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("validates merged state: patch queenColour + existing queenSeen=false is rejected", async () => {
    const existingNoQueen = {
      ...TEST_INSPECTION,
      queenSeen: false,
      queenColour: null,
    };
    mocks.getInspection.mockResolvedValue(existingNoQueen);

    const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queenColour: "Y" }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when not found (update returns empty)", async () => {
    mocks.getInspection.mockResolvedValue(null);

    const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: "Updated" }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(404);
  });

  it("returns 500 on error", async () => {
    mocks.dbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(new Error("DB error")),
        }),
      }),
    });

    const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: "Updated" }),
    });

    const response = await handlers.PUT(req, mockParams(TEST_ID));
    expect(response.status).toBe(500);
  });
});

describe("DELETE /api/inspections/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with success + deleted inspection", async () => {
    mocks.dbDelete.mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([TEST_INSPECTION]),
      }),
    });

    const response = await handlers.DELETE({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it("returns 404 when not found", async () => {
    mocks.dbDelete.mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    });

    const response = await handlers.DELETE({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(404);
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
