import { describe, it, expect } from "vitest";
import {
  ApiErrorSchema,
  ApiValidationErrorSchema,
  ApiaryListSchema,
  ApiaryDetailSchema,
  HiveListSchema,
  HiveDetailSchema,
  InspectionListSchema,
  InspectionDetailSchema,
  LastInspectionSchema,
  serializeApiary,
  serializeHive,
  serializeInspection,
  serializeApiaryWithHives,
  serializeLastInspection,
} from "../api-contracts";

// ── Error schemas ────────────────────────────────────────────────────────────

describe("ApiErrorSchema", () => {
  it("accepts a standard error response", () => {
    const result = ApiErrorSchema.safeParse({ error: "Not found" });
    expect(result.success).toBe(true);
  });

  it("rejects missing error field", () => {
    const result = ApiErrorSchema.safeParse({ message: "Not found" });
    expect(result.success).toBe(false);
  });

  it("rejects non-string error", () => {
    const result = ApiErrorSchema.safeParse({ error: 404 });
    expect(result.success).toBe(false);
  });
});

describe("ApiValidationErrorSchema", () => {
  it("accepts a validation error with details", () => {
    const result = ApiValidationErrorSchema.safeParse({
      error: "Validation failed",
      details: [{ path: ["name"], message: "Required" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects wrong error literal", () => {
    const result = ApiValidationErrorSchema.safeParse({
      error: "Not found",
      details: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty details array", () => {
    const result = ApiValidationErrorSchema.safeParse({
      error: "Validation failed",
      details: [],
    });
    expect(result.success).toBe(true);
  });
});

// ── Apiary schemas ───────────────────────────────────────────────────────────

describe("ApiaryListSchema", () => {
  const validApiary = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Garden Apiary",
    notes: "Behind the house",
    createdAt: "2025-01-15T10:00:00.000Z",
  };

  it("accepts a valid apiary", () => {
    const result = ApiaryListSchema.safeParse(validApiary);
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID", () => {
    const result = ApiaryListSchema.safeParse({
      ...validApiary,
      id: "invalid-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = ApiaryListSchema.safeParse({
      ...validApiary,
      name: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("accepts null notes", () => {
    const result = ApiaryListSchema.safeParse({
      ...validApiary,
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects Date object for createdAt (must be string)", () => {
    const result = ApiaryListSchema.safeParse({
      ...validApiary,
      createdAt: new Date("2025-01-15T10:00:00Z"),
    });
    expect(result.success).toBe(false);
  });
});

describe("ApiaryDetailSchema", () => {
  const validDetail = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Garden Apiary",
    notes: null,
    createdAt: "2025-01-15T10:00:00.000Z",
    hiveCount: 3,
    hives: [],
  };

  it("accepts a valid apiary detail with empty hives", () => {
    const result = ApiaryDetailSchema.safeParse(validDetail);
    expect(result.success).toBe(true);
  });

  it("accepts apiary detail with nested hives", () => {
    const result = ApiaryDetailSchema.safeParse({
      ...validDetail,
      hives: [
        {
          id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
          apiaryId: "550e8400-e29b-41d4-a716-446655440000",
          name: "Hive 1",
          apiaryName: "Garden Apiary",
          queenBreed: null,
          queenClipped: false,
          notes: null,
          createdAt: "2025-02-01T10:00:00.000Z",
          inspectionCount: 5,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects hive with missing apiaryName field", () => {
    const result = ApiaryDetailSchema.safeParse({
      ...validDetail,
      hives: [
        {
          id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
          apiaryId: "550e8400-e29b-41d4-a716-446655440000",
          name: "Hive 1",
          // apiaryName missing
          queenBreed: null,
          queenClipped: false,
          notes: null,
          createdAt: "2025-02-01T10:00:00.000Z",
          inspectionCount: 0,
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

// ── Hive schemas ─────────────────────────────────────────────────────────────

describe("HiveListSchema / HiveDetailSchema", () => {
  const validHive = {
    id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    apiaryId: "550e8400-e29b-41d4-a716-446655440000",
    name: "Colony Alpha",
    apiaryName: "Garden Apiary",
    queenBreed: "Italian",
    queenClipped: true,
    notes: null,
    createdAt: "2025-01-15T10:00:00.000Z",
    inspectionCount: 7,
  };

  it("accepts a valid hive", () => {
    expect(HiveListSchema.safeParse(validHive).success).toBe(true);
    expect(HiveDetailSchema.safeParse(validHive).success).toBe(true);
  });

  it("rejects non-boolean queenClipped", () => {
    const result = HiveListSchema.safeParse({
      ...validHive,
      queenClipped: "yes",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null apiaryName", () => {
    const result = HiveListSchema.safeParse({
      ...validHive,
      apiaryName: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects Date for createdAt", () => {
    const result = HiveListSchema.safeParse({
      ...validHive,
      createdAt: new Date("2025-01-15T10:00:00Z"),
    });
    expect(result.success).toBe(false);
  });
});

// ── Inspection schemas ───────────────────────────────────────────────────────

describe("InspectionListSchema / InspectionDetailSchema", () => {
  const validInspection = {
    id: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
    hiveId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    inspectionDate: "2025-03-01",
    queenSeen: true,
    queenCellsRemoved: false,
    eggsSeen: true,
    broodPatternOk: true,
    healthOk: true,
    chalkBroodSuspected: false,
    efbSuspected: false,
    afbSuspected: false,
    createdAt: "2025-03-01T10:00:00.000Z",
  };

  it("accepts a valid inspection with required booleans", () => {
    expect(InspectionListSchema.safeParse(validInspection).success).toBe(true);
    expect(InspectionDetailSchema.safeParse(validInspection).success).toBe(
      true,
    );
  });

  it("rejects missing queenSeen (non-null boolean required)", () => {
    const result = InspectionListSchema.safeParse({
      ...validInspection,
      queenSeen: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("rejects null queenSeen", () => {
    const result = InspectionListSchema.safeParse({
      ...validInspection,
      queenSeen: null,
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields as undefined", () => {
    const result = InspectionListSchema.safeParse(validInspection);
    expect(result.success).toBe(true);
  });

  it("accepts optional fields as null", () => {
    const result = InspectionListSchema.safeParse({
      ...validInspection,
      queenColour: null,
      varroaLevel: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects Date for createdAt", () => {
    const result = InspectionListSchema.safeParse({
      ...validInspection,
      createdAt: new Date("2025-03-01T10:00:00Z"),
    });
    expect(result.success).toBe(false);
  });
});

// ── LastInspection schema ────────────────────────────────────────────────────

describe("LastInspectionSchema", () => {
  it("accepts a valid last-inspection snapshot", () => {
    const result = LastInspectionSchema.safeParse({
      id: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
      inspectionDate: "2025-03-01",
      queenSeen: true,
      healthOk: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-boolean queenSeen", () => {
    const result = LastInspectionSchema.safeParse({
      id: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
      inspectionDate: "2025-03-01",
      queenSeen: null,
      healthOk: true,
    });
    expect(result.success).toBe(false);
  });
});

// ── Serialization helpers ────────────────────────────────────────────────────

describe("serializeApiary", () => {
  it("converts Date createdAt to ISO string", () => {
    const date = new Date("2025-01-15T10:00:00.000Z");
    const result = serializeApiary({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Garden Apiary",
      notes: "Behind the house",
      createdAt: date,
    });
    expect(result.createdAt).toBe("2025-01-15T10:00:00.000Z");
    expect(ApiaryListSchema.safeParse(result).success).toBe(true);
  });

  it("passes through string createdAt", () => {
    const result = serializeApiary({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Garden Apiary",
      notes: null,
      createdAt: "2025-01-15T10:00:00.000Z",
    });
    expect(result.createdAt).toBe("2025-01-15T10:00:00.000Z");
  });
});

describe("serializeHive", () => {
  it("converts Date createdAt and defaults missing fields", () => {
    const date = new Date("2025-01-15T10:00:00.000Z");
    // Raw DB insert row (no apiaryName, no inspectionCount)
    const result = serializeHive({
      id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      apiaryId: "550e8400-e29b-41d4-a716-446655440000",
      name: "Colony Alpha",
      queenBreed: null,
      queenClipped: false,
      notes: null,
      createdAt: date,
    });
    expect(result.createdAt).toBe("2025-01-15T10:00:00.000Z");
    expect(result.apiaryName).toBe(null);
    expect(result.inspectionCount).toBe(0);
    expect(HiveListSchema.safeParse(result).success).toBe(true);
  });

  it("preserves joined fields from list/detail routes", () => {
    const date = new Date("2025-01-15T10:00:00.000Z");
    const result = serializeHive({
      id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      apiaryId: "550e8400-e29b-41d4-a716-446655440000",
      name: "Colony Alpha",
      apiaryName: "Garden Apiary",
      queenBreed: "Italian",
      queenClipped: true,
      notes: null,
      createdAt: date,
      inspectionCount: 5,
    });
    expect(result.apiaryName).toBe("Garden Apiary");
    expect(result.inspectionCount).toBe(5);
    expect(HiveListSchema.safeParse(result).success).toBe(true);
  });
});

describe("serializeInspection", () => {
  it("converts Date createdAt to ISO string and normalizes nulls to undefined", () => {
    const date = new Date("2025-03-01T10:00:00.000Z");
    const result = serializeInspection({
      id: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
      hiveId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      inspectionDate: "2025-03-01",
      queenSeen: true,
      queenColour: null,
      queenCellsFound: null,
      queenCellsRemoved: false,
      eggsSeen: true,
      broodPatternOk: true,
      broodFrameCount: null,
      storeFrames: null,
      roomFrames: null,
      healthOk: true,
      chalkBroodSuspected: false,
      efbSuspected: false,
      afbSuspected: false,
      varroaLevel: null,
      varroaCount: null,
      temperamentScore: null,
      feedLitresLightSyrup: null,
      feedLitresHeavySyrup: null,
      supersChange: null,
      weatherTemperatureC: null,
      weatherCondition: null,
      notes: null,
      createdAt: date,
      hiveName: "Colony Alpha",
      apiaryName: "Garden Apiary",
    });
    expect(result.createdAt).toBe("2025-03-01T10:00:00.000Z");
    // nulls become undefined so they don't appear in JSON
    expect(result.queenColour).toBe(undefined);
    expect(InspectionListSchema.safeParse(result).success).toBe(true);
  });
});

describe("serializeApiaryWithHives", () => {
  it("serializes apiary with nested hives, converting all dates", () => {
    const date = new Date("2025-01-15T10:00:00.000Z");
    const hiveDate = new Date("2025-02-01T10:00:00.000Z");
    const result = serializeApiaryWithHives({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Garden Apiary",
      notes: null,
      createdAt: date,
      hiveCount: 1,
      hives: [
        {
          id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
          apiaryId: "550e8400-e29b-41d4-a716-446655440000",
          name: "Hive 1",
          apiaryName: "Garden Apiary",
          queenBreed: null,
          queenClipped: false,
          notes: null,
          createdAt: hiveDate,
          inspectionCount: 3,
        },
      ],
    });
    expect(result.createdAt).toBe("2025-01-15T10:00:00.000Z");
    expect(result.hives[0].createdAt).toBe("2025-02-01T10:00:00.000Z");
    expect(ApiaryDetailSchema.safeParse(result).success).toBe(true);
  });
});

describe("serializeLastInspection", () => {
  it("converts Date inspectionDate to ISO string", () => {
    const date = new Date("2025-03-01T10:00:00.000Z");
    const result = serializeLastInspection({
      id: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
      inspectionDate: date,
      queenSeen: true,
      healthOk: true,
    });
    expect(result.inspectionDate).toBe("2025-03-01T10:00:00.000Z");
    expect(LastInspectionSchema.safeParse(result).success).toBe(true);
  });
});
