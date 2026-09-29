// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as handlers from "../inspections/route";

const mocks = vi.hoisted(() => ({
  dbInsert: vi.fn(),
  getInspections: vi.fn(),
}));

vi.mock("@/lib/data", () => ({
  getInspections: (...args: unknown[]) => mocks.getInspections(...args),
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: (...args: unknown[]) => mocks.dbInsert(...args),
  },
}));

const TEST_INSPECTION = {
  id: "c3d4e5f6-a7b8-4012-cdef-123456789012",
  hiveId: "b2c3d4e5-f6a7-4890-bcde-f12345678901",
  inspectionDate: "2025-03-01",
  queenSeen: true,
  eggsSeen: true,
  healthOk: true,
  varroaLevel: "l",
  notes: null,
  createdAt: new Date("2025-03-01T10:00:00Z"),
};

describe("GET /api/inspections", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with array of inspections", async () => {
    mocks.getInspections.mockResolvedValue([TEST_INSPECTION]);

    const req = new Request("http://localhost/api/inspections");
    const response = await handlers.GET(req);
    expect(response.status).toBe(200);
  });

  it("returns 200 with empty array when no inspections", async () => {
    mocks.getInspections.mockResolvedValue([]);

    const req = new Request("http://localhost/api/inspections");
    const response = await handlers.GET(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });

  it("returns 500 on data layer error", async () => {
    mocks.getInspections.mockRejectedValue(new Error("DB connection failed"));

    const req = new Request("http://localhost/api/inspections");
    const response = await handlers.GET(req);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal server error");
  });

  it("supports hiveId filter", async () => {
    mocks.getInspections.mockResolvedValue([TEST_INSPECTION]);

    const req = new Request(
      "http://localhost/api/inspections?hive_id=" + TEST_INSPECTION.hiveId,
    );

    const response = await handlers.GET(req);
    expect(response.status).toBe(200);
    expect(mocks.getInspections).toHaveBeenCalledWith({
      hiveId: TEST_INSPECTION.hiveId,
    });
  });

  it("returns 400 when hive_id filter is malformed", async () => {
    const req = new Request(
      "http://localhost/api/inspections?hive_id=not-a-uuid",
    );

    const response = await handlers.GET(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid hive_id");
    expect(mocks.getInspections).not.toHaveBeenCalled();
  });
});

describe("POST /api/inspections", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 201 with created inspection when valid", async () => {
    const values = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([TEST_INSPECTION]),
    });
    mocks.dbInsert.mockReturnValue({ values });

    const req = new Request("http://localhost/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hiveId: TEST_INSPECTION.hiveId,
        inspectionDate: TEST_INSPECTION.inspectionDate,
      }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(201);
    expect(values).toHaveBeenCalledWith({
      hiveId: TEST_INSPECTION.hiveId,
      inspectionDate: TEST_INSPECTION.inspectionDate,
      afbSuspected: false,
      broodFrameCount: null,
      broodPatternOk: true,
      chalkBroodSuspected: false,
      efbSuspected: false,
      eggsSeen: false,
      feedLitresHeavySyrup: null,
      feedLitresLightSyrup: null,
      feedFondantAmount: null,
      healthOk: true,
      notes: null,
      queenCellsFound: null,
      queenCellsRemoved: false,
      queenColour: null,
      queenSeen: false,
      roomFrames: null,
      storeFrames: null,
      supersChange: null,
      temperamentScore: null,
      varroaLevel: null,
      weatherCondition: null,
      weatherTemperatureC: null,
    });
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it("returns 400 when hiveId is missing", async () => {
    const req = new Request("http://localhost/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inspectionDate: "2025-03-01" }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(mocks.dbInsert).not.toHaveBeenCalled();
  });

  it("returns 400 when inspectionDate is missing", async () => {
    const req = new Request("http://localhost/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hiveId: TEST_INSPECTION.hiveId }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(mocks.dbInsert).not.toHaveBeenCalled();
  });

  it("returns 400 when temperamentScore is out of range", async () => {
    const req = new Request("http://localhost/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hiveId: TEST_INSPECTION.hiveId,
        inspectionDate: TEST_INSPECTION.inspectionDate,
        temperamentScore: 15,
      }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(mocks.dbInsert).not.toHaveBeenCalled();
  });

  it("returns 400 when JSON body is invalid", async () => {
    const req = new Request("http://localhost/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{broken json",
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid JSON body");
    expect(mocks.dbInsert).not.toHaveBeenCalled();
  });

  it("returns 422 when hive does not exist (FK violation)", async () => {
    const fkError = Object.assign(new Error("fk violation"), { code: "23503" });
    mocks.dbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(fkError),
      }),
    });

    const req = new Request("http://localhost/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hiveId: TEST_INSPECTION.hiveId,
        inspectionDate: TEST_INSPECTION.inspectionDate,
      }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toBe("Hive does not exist");
  });

  it("returns 422 when inspection violates a data constraint (CHECK)", async () => {
    const checkError = Object.assign(new Error("check violation"), {
      code: "23514",
    });
    mocks.dbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(checkError),
      }),
    });

    const req = new Request("http://localhost/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hiveId: TEST_INSPECTION.hiveId,
        inspectionDate: TEST_INSPECTION.inspectionDate,
      }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toBe("Inspection violates a data constraint");
  });

  it("returns 500 on DB error", async () => {
    mocks.dbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(new Error("DB error")),
      }),
    });

    const req = new Request("http://localhost/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hiveId: TEST_INSPECTION.hiveId,
        inspectionDate: TEST_INSPECTION.inspectionDate,
      }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal server error");
  });

  // ── Omitted-default bypass cases ────────────────────────────────

  it("rejects omitted queenSeen + queenColour set (queenSeen defaults to false)", async () => {
    const req = new Request("http://localhost/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hiveId: TEST_INSPECTION.hiveId,
        inspectionDate: TEST_INSPECTION.inspectionDate,
        queenColour: "Y",
      }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(mocks.dbInsert).not.toHaveBeenCalled();
  });

  it("rejects omitted healthOk + disease flag set (healthOk defaults to true)", async () => {
    const req = new Request("http://localhost/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hiveId: TEST_INSPECTION.hiveId,
        inspectionDate: TEST_INSPECTION.inspectionDate,
        chalkBroodSuspected: true,
      }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(mocks.dbInsert).not.toHaveBeenCalled();
  });

  it("accepts omitted queenSeen + queenColour null (both default to safe values)", async () => {
    const values = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([TEST_INSPECTION]),
    });
    mocks.dbInsert.mockReturnValue({ values });

    const req = new Request("http://localhost/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hiveId: TEST_INSPECTION.hiveId,
        inspectionDate: TEST_INSPECTION.inspectionDate,
        queenColour: null,
      }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(201);
  });

  it("accepts omitted healthOk + no disease flags (healthOk defaults to true, safe)", async () => {
    const values = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([TEST_INSPECTION]),
    });
    mocks.dbInsert.mockReturnValue({ values });

    const req = new Request("http://localhost/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hiveId: TEST_INSPECTION.hiveId,
        inspectionDate: TEST_INSPECTION.inspectionDate,
      }),
    });

    const response = await handlers.POST(req);
    expect(response.status).toBe(201);
  });
});
