// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as handlers from "../inspections/route";

const mockGetInspections = vi.fn();
const mockDbInsert = vi.fn();
const mockInspectionInsertSafeParse = vi.fn();

vi.mock("@/lib/data", () => ({
	getInspections: (...args: unknown[]) => mockGetInspections(...args),
}));

vi.mock("@/lib/db", () => ({
	db: {
		insert: (...args: unknown[]) => mockDbInsert(...args),
	},
	InspectionInsert: {
		safeParse: (...args: unknown[]) => mockInspectionInsertSafeParse(...args),
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
	temperatureScore: 5,
	broodPattern: "s",
	notes: null,
	createdAt: new Date("2025-03-01T10:00:00Z"),
};

describe("GET /api/inspections", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 200 with array of inspections", async () => {
		mockGetInspections.mockResolvedValue([TEST_INSPECTION]);

		const req = new Request("http://localhost/api/inspections");
		const response = await handlers.GET(req);
		expect(response.status).toBe(200);
	});

	it("returns 200 with empty array when no inspections", async () => {
		mockGetInspections.mockResolvedValue([]);

		const req = new Request("http://localhost/api/inspections");
		const response = await handlers.GET(req);
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual([]);
	});

	it("returns 500 on data layer error", async () => {
		mockGetInspections.mockRejectedValue(new Error("DB connection failed"));

		const req = new Request("http://localhost/api/inspections");
		const response = await handlers.GET(req);
		expect(response.status).toBe(500);
		const body = await response.json();
		expect(body).toEqual({ error: "Failed to fetch inspections" });
	});

	it("supports hiveId filter", async () => {
		mockGetInspections.mockResolvedValue([TEST_INSPECTION]);

		const req = new Request(
			"http://localhost/api/inspections?hive_id=" + TEST_INSPECTION.hiveId,
		);

		const response = await handlers.GET(req);
		expect(response.status).toBe(200);
		expect(mockGetInspections).toHaveBeenCalledWith({
			hiveId: TEST_INSPECTION.hiveId,
		});
	});
});

describe("POST /api/inspections", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 201 with created inspection when valid", async () => {
		mockInspectionInsertSafeParse.mockReturnValue({
			success: true,
			data: {
				hiveId: TEST_INSPECTION.hiveId,
				inspectionDate: TEST_INSPECTION.inspectionDate,
			},
		});
		mockDbInsert.mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([TEST_INSPECTION]),
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
		expect(response.status).toBe(201);
		const body = await response.json();
		expect(body.success).toBe(true);
	});

	it("returns 400 when validation fails", async () => {
		mockInspectionInsertSafeParse.mockReturnValue({
			success: false,
			error: { issues: [{ path: ["hiveId"], message: "Required" }] },
		});

		const req = new Request("http://localhost/api/inspections", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}),
		});

		const response = await handlers.POST(req);
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe("Validation failed");
	});

	it("returns 500 on DB error", async () => {
		mockInspectionInsertSafeParse.mockReturnValue({
			success: true,
			data: {
				hiveId: TEST_INSPECTION.hiveId,
				inspectionDate: TEST_INSPECTION.inspectionDate,
			},
		});
		mockDbInsert.mockReturnValue({
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
	});
});
