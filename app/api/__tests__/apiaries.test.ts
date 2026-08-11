// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as handlers from "../apiaries/route";

const mockGetApiaries = vi.fn();
const mockDbInsert = vi.fn();
const mockApiaryInsertSafeParse = vi.fn();

vi.mock("@/lib/data", () => ({
	getApiaries: (...args: unknown[]) => mockGetApiaries(...args),
}));

vi.mock("@/lib/db", () => ({
	db: {
		insert: (...args: unknown[]) => mockDbInsert(...args),
	},
	ApiaryInsert: {
		safeParse: (...args: unknown[]) => mockApiaryInsertSafeParse(...args),
	},
}));

const TEST_APIARY = {
	id: "a1b2c3d4-e5f6-4789-abcd-ef1234567890",
	name: "Garden Apiary",
	notes: "Behind the house",
	createdAt: new Date("2025-01-15T10:00:00Z"),
};

describe("GET /api/apiaries", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 200 with array of apiaries", async () => {
		mockGetApiaries.mockResolvedValue([TEST_APIARY]);

		const response = await handlers.GET();
		expect(response.status).toBe(200);
	});

	it("returns 500 on data layer error", async () => {
		mockGetApiaries.mockRejectedValue(new Error("DB connection failed"));

		const response = await handlers.GET();
		expect(response.status).toBe(500);
		const body = await response.json();
		expect(body).toEqual({ error: "Failed to fetch apiaries" });
	});
});

describe("POST /api/apiaries", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 201 with created apiary when valid", async () => {
		mockApiaryInsertSafeParse.mockReturnValue({
			success: true,
			data: { name: "New Apiary", notes: "Test" },
		});
		const insertedRow = { ...TEST_APIARY, name: "New Apiary", notes: "Test" };
		mockDbInsert.mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([insertedRow]),
			}),
		});

		const req = new Request("http://localhost/api/apiaries", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "New Apiary", notes: "Test" }),
		});

		const response = await handlers.POST(req);
		expect(response.status).toBe(201);
		const body = await response.json();
		expect(body.name).toBe("New Apiary");
	});

	it("returns 400 with validation errors when name missing", async () => {
		mockApiaryInsertSafeParse.mockReturnValue({
			success: false,
			error: { issues: [{ path: ["name"], message: "Required" }] },
		});

		const req = new Request("http://localhost/api/apiaries", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ notes: "No name" }),
		});

		const response = await handlers.POST(req);
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe("Validation failed");
		expect(body.details).toBeDefined();
	});

	it("returns 400 with validation errors when name is empty string", async () => {
		mockApiaryInsertSafeParse.mockReturnValue({
			success: false,
			error: { issues: [{ path: ["name"], message: "Too small" }] },
		});

		const req = new Request("http://localhost/api/apiaries", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "" }),
		});

		const response = await handlers.POST(req);
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe("Validation failed");
	});

	it("returns 500 on DB error", async () => {
		mockApiaryInsertSafeParse.mockReturnValue({
			success: true,
			data: { name: "New Apiary" },
		});
		mockDbInsert.mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockRejectedValue(new Error("DB error")),
			}),
		});

		const req = new Request("http://localhost/api/apiaries", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "New Apiary" }),
		});

		const response = await handlers.POST(req);
		expect(response.status).toBe(500);
		const body = await response.json();
		expect(body).toEqual({ error: "Failed to create apiary" });
	});
});
