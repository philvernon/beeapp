// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as handlers from "../apiaries/[id]/route";

const TEST_ID = "a1b2c3d4-e5f6-4789-abcd-ef1234567890";

function mockParams(id: string) {
	return { params: Promise.resolve({ id }) };
}

const mockGetApiaryWithHives = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbDelete = vi.fn();
const mockDbSelect = vi.fn();
const mockApiaryUpdateSafeParse = vi.fn();

vi.mock("@/lib/data", () => ({
	getApiaryWithHives: (...args: unknown[]) => mockGetApiaryWithHives(...args),
}));

vi.mock("@/lib/db", () => ({
	db: {
		update: (...args: unknown[]) => mockDbUpdate(...args),
		delete: (...args: unknown[]) => mockDbDelete(...args),
		select: (...args: unknown[]) => mockDbSelect(...args),
	},
	ApiaryUpdate: {
		safeParse: (...args: unknown[]) => mockApiaryUpdateSafeParse(...args),
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
		mockGetApiaryWithHives.mockResolvedValue({
			...TEST_APIARY,
			hives: [],
		});

		const response = await handlers.GET(
			{} as Request,
			mockParams(TEST_ID),
		);
		expect(response.status).toBe(200);
	});

	it("returns 404 when apiary not found", async () => {
		mockGetApiaryWithHives.mockResolvedValue(null);

		const response = await handlers.GET(
			{} as Request,
			mockParams(TEST_ID),
		);
		expect(response.status).toBe(404);
		const body = await response.json();
		expect(body.error).toBe("Apiary not found");
	});

	it("returns 500 on error", async () => {
		mockGetApiaryWithHives.mockRejectedValue(new Error("DB error"));

		const response = await handlers.GET(
			{} as Request,
			mockParams(TEST_ID),
		);
		expect(response.status).toBe(500);
	});
});

describe("PUT /api/apiaries/:id", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 200 with updated apiary", async () => {
		mockApiaryUpdateSafeParse.mockReturnValue({
			success: true,
			data: { name: "Updated Apiary" },
		});
		const updatedRow = { ...TEST_APIARY, name: "Updated Apiary" };
		mockDbUpdate.mockReturnValue({
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

	it("returns 400 when validation fails", async () => {
		mockApiaryUpdateSafeParse.mockReturnValue({
			success: false,
			error: { issues: [{ path: ["name"], message: "Too small" }] },
		});

		const req = new Request("http://localhost/api/apiaries/" + TEST_ID, {
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
		mockApiaryUpdateSafeParse.mockReturnValue({
			success: true,
			data: {},
		});

		const req = new Request("http://localhost/api/apiaries/" + TEST_ID, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}),
		});

		const response = await handlers.PUT(req, mockParams(TEST_ID));
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe("No fields to update");
	});

	it("trims name before saving", async () => {
		let capturedUpdates: Record<string, unknown> | null = null;
		mockApiaryUpdateSafeParse.mockReturnValue({
			success: true,
			data: { name: "  Spaced  " },
		});
		const updatedRow = { ...TEST_APIARY, name: "Spaced" };
		mockDbUpdate.mockReturnValue({
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
		expect(((capturedUpdates ?? {}) as Record<string, unknown>)["name"] as string).toBe("Spaced");
	});

	it("returns 404 when apiary not found (update returns empty)", async () => {
		mockApiaryUpdateSafeParse.mockReturnValue({
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

		const req = new Request("http://localhost/api/apiaries/" + TEST_ID, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Updated" }),
		});

		const response = await handlers.PUT(req, mockParams(TEST_ID));
		expect(response.status).toBe(404);
	});

	it("returns 500 on error", async () => {
		mockApiaryUpdateSafeParse.mockReturnValue({
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

		const req = new Request("http://localhost/api/apiaries/" + TEST_ID, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Updated" }),
		});

		const response = await handlers.PUT(req, mockParams(TEST_ID));
		expect(response.status).toBe(500);
	});
});

describe("DELETE /api/apiaries/:id", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 200 with success + deleted apiary when no hives exist", async () => {
		mockDbSelect.mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue([]),
			}),
		});

		mockDbDelete.mockReturnValue({
			where: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([TEST_APIARY]),
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

	it("returns 409 when hives exist in apiary", async () => {
		mockDbSelect.mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue([{ id: "hive-1" }]),
			}),
		});

		const response = await handlers.DELETE(
			{} as Request,
			mockParams(TEST_ID),
		);
		expect(response.status).toBe(409);
		const body = await response.json();
		expect(body.error).toBe("Cannot delete apiary with existing hives");
	});

	it("returns 404 when apiary not found", async () => {
		mockDbSelect.mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue([]),
			}),
		});

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
		mockDbSelect.mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue([]),
			}),
		});

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
