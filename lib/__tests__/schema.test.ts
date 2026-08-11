import { describe, it, expect } from "vitest";
import {
	ApiaryInsert,
	ApiaryUpdate,
	HiveInsert,
	HiveUpdate,
	InspectionInsert,
	InspectionUpdate,
	queenColourLabels,
	varroaLevelLabels,
	weatherConditionLabels,
} from "../schema";

const UUID = "a1b2c3d4-e5f6-4789-abcd-ef1234567890";

describe("ApiaryInsert", () => {
	it("validates required name and optional notes", () => {
		const result = ApiaryInsert.safeParse({ name: "Test Apiary" });
		expect(result.success).toBe(true);
	});

	it("rejects missing name", () => {
		const result = ApiaryInsert.safeParse({});
		expect(result.success).toBe(false);
	});

	it("rejects empty string name", () => {
		const result = ApiaryInsert.safeParse({ name: "" });
		expect(result.success).toBe(false);
	});

	it("rejects whitespace-only name", () => {
		const result = ApiaryInsert.safeParse({ name: "   " });
		expect(result.success).toBe(false);
	});

	it("accepts notes when provided", () => {
		const result = ApiaryInsert.safeParse({
			name: "Test",
			notes: "Behind the house",
		});
		expect(result.success).toBe(true);
	});
});

describe("ApiaryUpdate", () => {
	it("validates partial updates", () => {
		const result = ApiaryUpdate.safeParse({ name: "Updated" });
		expect(result.success).toBe(true);
	});

	it("accepts nullable notes", () => {
		const result = ApiaryUpdate.safeParse({ notes: null });
		expect(result.success).toBe(true);
	});

	it("rejects empty string name", () => {
		const result = ApiaryUpdate.safeParse({ name: "" });
		expect(result.success).toBe(false);
	});

	it("rejects whitespace-only name", () => {
		const result = ApiaryUpdate.safeParse({ name: "   " });
		expect(result.success).toBe(false);
	});
});

describe("HiveInsert", () => {
	it("validates required apiaryId and name", () => {
		const result = HiveInsert.safeParse({
			apiaryId: UUID,
			name: "Colony Alpha",
		});
		expect(result.success).toBe(true);
	});

	it("rejects missing apiaryId", () => {
		const result = HiveInsert.safeParse({ name: "Colony Alpha" });
		expect(result.success).toBe(false);
	});

	it("rejects missing name", () => {
		const result = HiveInsert.safeParse({ apiaryId: UUID });
		expect(result.success).toBe(false);
	});

	it("rejects whitespace-only name", () => {
		const result = HiveInsert.safeParse({ apiaryId: UUID, name: "   " });
		expect(result.success).toBe(false);
	});

	it("accepts optional queen fields", () => {
		const result = HiveInsert.safeParse({
			apiaryId: UUID,
			name: "Colony Alpha",
			queenBreed: "Italian",
			queenClipped: true,
		});
		expect(result.success).toBe(true);
	});
});

describe("HiveUpdate", () => {
	it("validates partial updates", () => {
		const result = HiveUpdate.safeParse({ name: "Updated" });
		expect(result.success).toBe(true);
	});

	it("accepts nullable queenBreed and notes", () => {
		const result = HiveUpdate.safeParse({ queenBreed: null, notes: null });
		expect(result.success).toBe(true);
	});

	it("rejects apiaryId: null (NOT NULL constraint)", () => {
		const result = HiveUpdate.safeParse({ apiaryId: null });
		expect(result.success).toBe(false);
	});

	it("rejects whitespace-only name", () => {
		const result = HiveUpdate.safeParse({ name: "   " });
		expect(result.success).toBe(false);
	});
});

describe("InspectionInsert", () => {
	it("validates required hiveId and inspectionDate", () => {
		const result = InspectionInsert.safeParse({
			hiveId: UUID,
			inspectionDate: "2025-03-01",
		});
		expect(result.success).toBe(true);
	});

	it("rejects missing hiveId", () => {
		const result = InspectionInsert.safeParse({ inspectionDate: "2025-03-01" });
		expect(result.success).toBe(false);
	});

	it("rejects invalid queenColour enum", () => {
		const result = InspectionInsert.safeParse({
			hiveId: UUID,
			inspectionDate: "2025-03-01",
			queenColour: "X",
		});
		expect(result.success).toBe(false);
	});

	it("rejects temperamentScore outside 1-10 range", () => {
		const result = InspectionInsert.safeParse({
			hiveId: UUID,
			inspectionDate: "2025-03-01",
			temperamentScore: 0,
		});
		expect(result.success).toBe(false);

		const result2 = InspectionInsert.safeParse({
			hiveId: UUID,
			inspectionDate: "2025-03-01",
			temperamentScore: 11,
		});
		expect(result2.success).toBe(false);
	});

	it("rejects negative queenCellsFound", () => {
		const result = InspectionInsert.safeParse({
			hiveId: UUID,
			inspectionDate: "2025-03-01",
			queenCellsFound: -1,
		});
		expect(result.success).toBe(false);
	});

	it("rejects negative storeFrames", () => {
		const result = InspectionInsert.safeParse({
			hiveId: UUID,
			inspectionDate: "2025-03-01",
			storeFrames: -1,
		});
		expect(result.success).toBe(false);
	});

	it("rejects negative broodFrameCount", () => {
		const result = InspectionInsert.safeParse({
			hiveId: UUID,
			inspectionDate: "2025-03-01",
			broodFrameCount: -1,
		});
		expect(result.success).toBe(false);
	});

	it("rejects negative roomFrames", () => {
		const result = InspectionInsert.safeParse({
			hiveId: UUID,
			inspectionDate: "2025-03-01",
			roomFrames: -1,
		});
		expect(result.success).toBe(false);
	});

	it("rejects negative varroaCount", () => {
		const result = InspectionInsert.safeParse({
			hiveId: UUID,
			inspectionDate: "2025-03-01",
			varroaCount: -1,
		});
		expect(result.success).toBe(false);
	});

	it("does not apply .default() values in Zod v4 safeParse (defaults enforced at DB layer)", () => {
		const result = InspectionInsert.safeParse({
			hiveId: UUID,
			inspectionDate: "2025-03-01",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			const d = result.data;
			expect(d.queenSeen).toBeUndefined();
			expect(d.eggsSeen).toBeUndefined();
			expect(d.healthOk).toBeUndefined();
			expect(d.broodPatternOk).toBeUndefined();
		}
	});
});

describe("InspectionUpdate", () => {
	it("validates partial updates", () => {
		const result = InspectionUpdate.safeParse({ notes: "Updated notes" });
		expect(result.success).toBe(true);
	});

	it("accepts nullable fields", () => {
		const result = InspectionUpdate.safeParse({
			queenColour: null,
			notes: null,
			varroaLevel: null,
		});
		expect(result.success).toBe(true);
	});
	it("rejects temperamentScore of 0", () => {
		const result = InspectionUpdate.safeParse({ temperamentScore: 0 });
		expect(result.success).toBe(false);
	});

	it("rejects temperamentScore of 11", () => {
		const result = InspectionUpdate.safeParse({ temperamentScore: 11 });
		expect(result.success).toBe(false);
	});

	it("accepts valid temperamentScore boundary values", () => {
		const r1 = InspectionUpdate.safeParse({ temperamentScore: 1 });
		const r2 = InspectionUpdate.safeParse({ temperamentScore: 10 });
		expect(r1.success).toBe(true);
		expect(r2.success).toBe(true);
	});

	it("rejects negative queenCellsFound", () => {
		const result = InspectionUpdate.safeParse({ queenCellsFound: -1 });
		expect(result.success).toBe(false);
	});

	it("rejects negative broodFrameCount", () => {
		const result = InspectionUpdate.safeParse({ broodFrameCount: -1 });
		expect(result.success).toBe(false);
	});

	it("rejects negative storeFrames", () => {
		const result = InspectionUpdate.safeParse({ storeFrames: -1 });
		expect(result.success).toBe(false);
	});

	it("rejects negative roomFrames", () => {
		const result = InspectionUpdate.safeParse({ roomFrames: -1 });
		expect(result.success).toBe(false);
	});

	it("rejects negative varroaCount", () => {
		const result = InspectionUpdate.safeParse({ varroaCount: -1 });
		expect(result.success).toBe(false);
	});
});

describe("queenColourLabels", () => {
	it("maps all 5 codes correctly", () => {
		expect(queenColourLabels.W).toBe("White");
		expect(queenColourLabels.Y).toBe("Yellow");
		expect(queenColourLabels.R).toBe("Red");
		expect(queenColourLabels.G).toBe("Green");
		expect(queenColourLabels.B).toBe("Blue");
	});
});

describe("varroaLevelLabels", () => {
	it("maps all 3 levels correctly", () => {
		expect(varroaLevelLabels.l).toBe("Low");
		expect(varroaLevelLabels.m).toBe("Medium");
		expect(varroaLevelLabels.h).toBe("High");
	});
});

describe("weatherConditionLabels", () => {
	it("maps all 4 conditions correctly", () => {
		expect(weatherConditionLabels.c).toBe("Cloudy");
		expect(weatherConditionLabels.s).toBe("Sunny");
		expect(weatherConditionLabels.r).toBe("Rain");
		expect(weatherConditionLabels.f).toBe("Fair");
	});
});
