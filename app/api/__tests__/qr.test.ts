// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as handlers from "../hives/[id]/qr/route";

const TEST_ID = "b2c3d4e5-f6a7-4890-bcde-f12345678901";

function mockParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const mocks = vi.hoisted(() => ({
  getHive: vi.fn(),
  toBuffer: vi.fn(),
}));

vi.mock("@/lib/data", () => ({
  getHive: (...args: unknown[]) => mocks.getHive(...args),
}));

vi.mock("qrcode", () => ({
  default: {
    toBuffer: (...args: unknown[]) => mocks.toBuffer(...args),
  },
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

describe("GET /api/hives/:id/qr", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  it("returns 200 with PNG image on success", async () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // minimal PNG header
    mocks.toBuffer.mockResolvedValue(buffer);
    mocks.getHive.mockResolvedValue(TEST_HIVE);

    const response = await handlers.GET({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=3600");
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

  it("returns 404 when hive not found", async () => {
    mocks.getHive.mockResolvedValue(null);

    const response = await handlers.GET({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Hive not found");
  });

  it("returns 500 on unexpected error", async () => {
    mocks.getHive.mockRejectedValue(new Error("DB connection failed"));

    const response = await handlers.GET({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal server error");
  });

  it("returns 500 on QR generation failure", async () => {
    mocks.getHive.mockResolvedValue(TEST_HIVE);
    mocks.toBuffer.mockRejectedValue(new Error("QR library error"));

    const response = await handlers.GET({} as Request, mockParams(TEST_ID));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal server error");
  });
});
