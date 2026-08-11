// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as handlers from "../inspections/[id]/route";

const TEST_ID = "c3d4e5f6-a7b8-4012-cdef-123456789012";

function mockParams(id: string) {
	return { params: Promise.resolve({ id }) };
}

const mockGetInspection = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbDelete = vi.fn();
const mockInspectionUpdateSafeParse = vi.fn();

vi.mock("@/lib/data", () => ({
	getInspection: (...args: unknown[]) => mockGetInspection(...args),
}));

vi.mock("@/lib/db", () => ({
	db: {
		update: (...args: unknown[]) => mockDbUpdate(...args),
		delete: (...args: unknown[]) => mockDbDelete(...args),
	},
	InspectionUpdate: {
		safeParse: (...args: unknown[]) => mockInspectionUpdateSafeParse(...args),
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
	temperatureScore: 5,
	broodPattern: "s",
	notes: null,
	createdAt: new Date("2025-03-01T10:00:00Z"),
};

describe("GET /api/inspections/:id", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 200 with inspection data", async () => {
		mockGetInspection.mockResolvedValue(TEST_INSPECTION);

		const response = await handlers.GET(
			{} as Request,
			mockParams(TEST_ID),
		);
		expect(response.status).toBe(200);
	});

	it("returns 404 when not found", async () => {
		mockGetInspection.mockResolvedValue(null);

		const response = await handlers.GET(
			{} as Request,
			mockParams(TEST_ID),
		);
		expect(response.status).toBe(404);
		const body = await response.json();
		expect(body.error).toBe("Inspection not found");
	});

	it("returns 500 on error", async () => {
		mockGetInspection.mockRejectedValue(new Error("DB error"));

		const response = await handlers.GET(
			{} as Request,
			mockParams(TEST_ID),
		);
		expect(response.status).toBe(500);
	});
});

describe("PUT /api/inspections/:id", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 200 with updated inspection", async () => {
		mockInspectionUpdateSafeParse.mockReturnValue({
			success: true,
			data: { notes: "Updated notes" },
		});
		const updatedRow = { ...TEST_INSPECTION, notes: "Updated notes" };
		mockDbUpdate.mockReturnValue({
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

	it("returns 400 when validation fails", async () => {
		mockInspectionUpdateSafeParse.mockReturnValue({
			success: false,
			error: { issues: [{ path: ["temperatureScore"], message: "Too large" }] },
		});

		const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ temperatureScore: 99 }),
		});

		const response = await handlers.PUT(req, mockParams(TEST_ID));
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe("Validation failed");
	});

	it("returns 400 when no fields to update", async () => {
		mockInspectionUpdateSafeParse.mockReturnValue({
			success: true,
			data: {},
		});

		const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}),
		});

		const response = await handlers.PUT(req, mockParams(TEST_ID));
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe("No fields to update");
	});

	it("returns 400 when hiveId is null", async () => {
		mockInspectionUpdateSafeParse.mockReturnValue({
			success: true,
			data: { hiveId: null },
		});

		const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ hiveId: null }),
		});

		const response = await handlers.PUT(req, mockParams(TEST_ID));
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe("hiveId cannot be null");
	});

	it("returns 404 when not found (update returns empty)", async () => {
		mockInspectionUpdateSafeParse.mockReturnValue({
			success: true,
			data: { notes: "Updated" },
		});
		mockDbUpdate.mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([]),
				}),
			}),
		});

		const req = new Request("http://localhost/api/inspections/" + TEST_ID, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ notes: "Updated" }),
		});

		const response = await handlers.PUT(req, mockParams(TEST_ID));
		expect(response.status).toBe(404);
	});

	it("returns 500 on error", async () => {
		mockInspectionUpdateSafeParse.mockReturnValue({
			success: true,
			data: { notes: "Updated" },
		});
		mockDbUpdate.mockReturnValue({
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
		mockDbDelete.mockReturnValue({
			where: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([TEST_INSPECTION]),
			}),
		});

		const response = await handlers.DELETE(
			{} as Request,
			mockParams(TEST_ID),
		);
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.success).toBe(true);
	});

	it("returns 404 when not found", async () => {
		mockDbDelete.mockReturnValue({
			where: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([]),
			}),
		});

		const response = await handlers.DELETE(
			{} as Request,
			mockParams(TEST_ID),
		);
		expect(response.status).toBe(404);
	});

	it("returns 500 on error", async () => {
		mockDbDelete.mockReturnValue({
			where: vi.fn().mockReturnValue({
				returning: vi.fn().mockRejectedValue(new Error("DB error")),
			}),
		});

		const response = await handlers.DELETE(
			{} as Request,
			mockParams(TEST_ID),
		);
		expect(response.status).toBe(500);
	});
});
