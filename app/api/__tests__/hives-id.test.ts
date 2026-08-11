// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as handlers from "../hives/[id]/route";

const TEST_ID = "b2c3d4e5-f6a7-4890-bcde-f12345678901";

function mockParams(id: string) {
	return { params: Promise.resolve({ id }) };
}

const mockGetHive = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbDelete = vi.fn();
const mockHiveUpdateSafeParse = vi.fn();

vi.mock("@/lib/data", () => ({
	getHive: (...args: unknown[]) => mockGetHive(...args),
}));

vi.mock("@/lib/db", () => ({
	db: {
		update: (...args: unknown[]) => mockDbUpdate(...args),
		delete: (...args: unknown[]) => mockDbDelete(...args),
	},
	HiveUpdate: {
		safeParse: (...args: unknown[]) => mockHiveUpdateSafeParse(...args),
	},
}));

const TEST_HIVE = {
	id: TEST_ID,
	apiaryId: "a1b2c3d4-e5f6-4789-abcd-ef1234567890",
	name: "Colony Alpha",
	queenColour: "Y",
	varroaLevel: "l",
	broodPattern: "s",
	notes: null,
	createdAt: new Date("2025-01-15T10:00:00Z"),
};

describe("GET /api/hives/:id", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 200 with hive data", async () => {
		mockGetHive.mockResolvedValue(TEST_HIVE);

		const response = await handlers.GET(
			{} as Request,
			mockParams(TEST_ID),
		);
		expect(response.status).toBe(200);
	});

	it("returns 404 when hive not found", async () => {
		mockGetHive.mockResolvedValue(null);

		const response = await handlers.GET(
			{} as Request,
			mockParams(TEST_ID),
		);
		expect(response.status).toBe(404);
		const body = await response.json();
		expect(body.error).toBe("Hive not found");
	});

	it("returns 500 on error", async () => {
		mockGetHive.mockRejectedValue(new Error("DB error"));

		const response = await handlers.GET(
			{} as Request,
			mockParams(TEST_ID),
		);
		expect(response.status).toBe(500);
	});
});

describe("PUT /api/hives/:id", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 200 with updated hive", async () => {
		mockHiveUpdateSafeParse.mockReturnValue({
			success: true,
			data: { name: "Updated Colony" },
		});
		const updatedRow = { ...TEST_HIVE, name: "Updated Colony" };
		mockDbUpdate.mockReturnValue({
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

	it("returns 400 when validation fails", async () => {
		mockHiveUpdateSafeParse.mockReturnValue({
			success: false,
			error: { issues: [{ path: ["name"], message: "Too small" }] },
		});

		const req = new Request("http://localhost/api/hives/" + TEST_ID, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "" }),
		});

		const response = await handlers.PUT(req, mockParams(TEST_ID));
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe("Validation failed");
	});

	it("returns 400 when no fields to update (empty body)", async () => {
		mockHiveUpdateSafeParse.mockReturnValue({
			success: true,
			data: {},
		});

		const req = new Request("http://localhost/api/hives/" + TEST_ID, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}),
		});

		const response = await handlers.PUT(req, mockParams(TEST_ID));
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe("No fields to update");
	});

	it("returns 400 when apiaryId is null", async () => {
		mockHiveUpdateSafeParse.mockReturnValue({
			success: true,
			data: { apiaryId: null },
		});

		const req = new Request("http://localhost/api/hives/" + TEST_ID, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ apiaryId: null }),
		});

		const response = await handlers.PUT(req, mockParams(TEST_ID));
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe("apiaryId cannot be null");
	});

	it("returns 404 when hive not found (update returns empty)", async () => {
		mockHiveUpdateSafeParse.mockReturnValue({
			success: true,
			data: { name: "Updated" },
		});
		mockDbUpdate.mockReturnValue({
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

	it("returns 500 on error", async () => {
		mockHiveUpdateSafeParse.mockReturnValue({
			success: true,
			data: { name: "Updated" },
		});
		mockDbUpdate.mockReturnValue({
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
	});
});

describe("DELETE /api/hives/:id", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 200 with success + deleted hive", async () => {
		mockDbDelete.mockReturnValue({
			where: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([TEST_HIVE]),
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

	it("returns 404 when hive not found", async () => {
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
