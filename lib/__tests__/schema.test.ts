import { describe, it, expect } from "vitest";
import {
  ApiaryInsert,
  ApiaryUpdate,
  HiveInsert,
  HiveUpdate,
  InspectionInsert,
  InspectionUpdate,
} from "../schema";
import {
  queenColourLabels,
  varroaLevelLabels,
  weatherConditionLabels,
} from "../inspection-options";

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

  it("rejects empty string name", () => {
    const result = HiveInsert.safeParse({ apiaryId: UUID, name: "" });
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

  it("rejects queenClipped: null (NOT NULL constraint)", () => {
    const result = HiveUpdate.safeParse({ queenClipped: null });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only name", () => {
    const result = HiveUpdate.safeParse({ name: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects empty string name", () => {
    const result = HiveUpdate.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("InspectionInsert — cross-field invariants", () => {
  const base = {
    hiveId: UUID,
    inspectionDate: "2025-03-01",
  };

  it("rejects queenColour when queenSeen is false", () => {
    const result = InspectionInsert.safeParse({
      ...base,
      queenSeen: false,
      queenColour: "Y",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const queenColourIssue = result.error.issues.find((i) =>
        i.path.includes("queenColour"),
      );
      expect(queenColourIssue).toBeDefined();
    }
  });

  it("accepts queenColour when queenSeen is true", () => {
    const result = InspectionInsert.safeParse({
      ...base,
      queenSeen: true,
      queenColour: "Y",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null queenColour when queenSeen is false", () => {
    const result = InspectionInsert.safeParse({
      ...base,
      queenSeen: false,
      queenColour: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects disease flags when healthOk is true", () => {
    const result = InspectionInsert.safeParse({
      ...base,
      healthOk: true,
      chalkBroodSuspected: true,
    });
    expect(result.success).toBe(false);

    const result2 = InspectionInsert.safeParse({
      ...base,
      healthOk: true,
      efbSuspected: true,
    });
    expect(result2.success).toBe(false);

    const result3 = InspectionInsert.safeParse({
      ...base,
      healthOk: true,
      afbSuspected: true,
    });
    expect(result3.success).toBe(false);
  });

  it("accepts disease flags when healthOk is false", () => {
    const result = InspectionInsert.safeParse({
      ...base,
      healthOk: false,
      chalkBroodSuspected: true,
      efbSuspected: true,
      afbSuspected: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects queenCellsRemoved when queenCellsFound is null", () => {
    const result = InspectionInsert.safeParse({
      ...base,
      queenCellsRemoved: true,
      queenCellsFound: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects queenCellsRemoved when queenCellsFound is 0", () => {
    const result = InspectionInsert.safeParse({
      ...base,
      queenCellsRemoved: true,
      queenCellsFound: 0,
    });
    expect(result.success).toBe(false);
  });

  it("accepts queenCellsRemoved when queenCellsFound > 0", () => {
    const result = InspectionInsert.safeParse({
      ...base,
      queenCellsRemoved: true,
      queenCellsFound: 2,
    });
    expect(result.success).toBe(true);
  });

  it("accepts queenCellsRemoved false with zero cells found", () => {
    const result = InspectionInsert.safeParse({
      ...base,
      queenCellsRemoved: false,
      queenCellsFound: 0,
    });
    expect(result.success).toBe(true);
  });

  // Omitted-default bypass cases — the route applies defaults after
  // validation, so the schema must validate against those effective
  // defaults rather than raw undefined values.
  it("rejects omitted queenSeen + queenColour set (queenSeen defaults to false)", () => {
    const result = InspectionInsert.safeParse({
      ...base,
      queenColour: "Y",
    });
    expect(result.success).toBe(false);
  });

  it("rejects omitted healthOk + disease flag set (healthOk defaults to true)", () => {
    const result = InspectionInsert.safeParse({
      ...base,
      chalkBroodSuspected: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects omitted healthOk + multiple disease flags", () => {
    const result = InspectionInsert.safeParse({
      ...base,
      chalkBroodSuspected: true,
      efbSuspected: true,
    });
    expect(result.success).toBe(false);
  });

  it("accepts omitted queenSeen + queenColour null (both default to safe values)", () => {
    const result = InspectionInsert.safeParse({
      ...base,
      queenColour: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts omitted healthOk + no disease flags (healthOk defaults to true, safe)", () => {
    const result = InspectionInsert.safeParse({
      ...base,
    });
    expect(result.success).toBe(true);
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

  it("accepts valid temperamentScore boundary values", () => {
    const r1 = InspectionInsert.safeParse({
      hiveId: UUID,
      inspectionDate: "2025-03-01",
      temperamentScore: 1,
    });
    const r2 = InspectionInsert.safeParse({
      hiveId: UUID,
      inspectionDate: "2025-03-01",
      temperamentScore: 10,
    });
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
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

  it("rejects negative feedLitresLightSyrup", () => {
    const result = InspectionInsert.safeParse({
      hiveId: UUID,
      inspectionDate: "2025-03-01",
      feedLitresLightSyrup: "-1.5",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative feedLitresHeavySyrup", () => {
    const result = InspectionInsert.safeParse({
      hiveId: UUID,
      inspectionDate: "2025-03-01",
      feedLitresHeavySyrup: "-2.0",
    });
    expect(result.success).toBe(false);
  });

  it("accepts zero for feed quantities", () => {
    const result = InspectionInsert.safeParse({
      hiveId: UUID,
      inspectionDate: "2025-03-01",
      feedLitresLightSyrup: "0",
      feedLitresHeavySyrup: "0",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null for nullable numeric fields", () => {
    const result = InspectionInsert.safeParse({
      hiveId: UUID,
      inspectionDate: "2025-03-01",
      queenCellsFound: null,
      broodFrameCount: null,
      storeFrames: null,
      roomFrames: null,
      varroaCount: null,
      temperamentScore: null,
      feedLitresLightSyrup: null,
      feedLitresHeavySyrup: null,
    });
    expect(result.success).toBe(true);
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

describe("InspectionUpdate — narrowed contract", () => {
  // The schema omits hiveId and inspectionDate. Patch-level validation
  // only checks field types / allowed shape; cross-field invariants are
  // enforced at the route level against the merged (existing + patch)
  // record.

  it("accepts valid partial updates", () => {
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

  it("rejects negative feedLitresLightSyrup", () => {
    const result = InspectionUpdate.safeParse({
      feedLitresLightSyrup: "-1.5",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative feedLitresHeavySyrup", () => {
    const result = InspectionUpdate.safeParse({
      feedLitresHeavySyrup: "-2.0",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null for all nullable numeric fields", () => {
    const result = InspectionUpdate.safeParse({
      temperamentScore: null,
      queenCellsFound: null,
      storeFrames: null,
      broodFrameCount: null,
      roomFrames: null,
      varroaCount: null,
    });
    expect(result.success).toBe(true);
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
