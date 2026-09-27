// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const TEST_APIARY_ID = "a1b2c3d4-e5f6-4789-abcd-ef1234567890";
const TEST_HIVE_ID = "b2c3d4e5-f6a7-4890-bcde-f12345678901";
const TEST_INSPECTION_ID = "c3d4e5f6-a7b8-4012-cdef-123456789012";

const mockApiary = {
  id: TEST_APIARY_ID,
  name: "Garden Apiary",
  notes: "Behind the house",
  createdAt: new Date("2025-01-15T10:00:00Z"),
};

const mockHive = {
  id: TEST_HIVE_ID,
  apiaryId: TEST_APIARY_ID,
  name: "Colony Alpha",
  queenColour: "Y",
  varroaLevel: "l",
  notes: null,
  createdAt: new Date("2025-01-15T10:00:00Z"),
};

const mockInspection = {
  id: TEST_INSPECTION_ID,
  hiveId: TEST_HIVE_ID,
  inspectionDate: "2025-03-01",
  queenSeen: true,
  eggsSeen: true,
  healthOk: true,
  varroaLevel: "l",
  notes: null,
  createdAt: new Date("2025-03-01T10:00:00Z"),
};

// Create a chainable thenable builder — every method returns the same object
function createBuilder(data: unknown[]) {
  const obj: Record<string, unknown> = {
    from: vi.fn(),
    select: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    orderBy: vi.fn(),
    leftJoin: vi.fn(),
    groupBy: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    values: vi.fn(),
    set: vi.fn(),
    returning: vi.fn(),
    execute: vi.fn(),
  };

  // All methods return the same builder (chainable)
  for (const key of Object.keys(obj)) {
    obj[key] = vi.fn().mockImplementation(() => obj);
  }

  // Make it thenable — resolves to data when awaited
  obj.then = ((onfulfilled: (value: unknown) => unknown) =>
    onfulfilled(data)) as never;

  return obj;
}

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

describe("getApiaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnValue(createBuilder([mockApiary]));
  });

  it("returns all apiaries ordered by createdAt", async () => {
    const builder = createBuilder([mockApiary]);
    mockDb.select.mockReturnValue(builder);
    const { getApiaries } = await import("../data");
    const result = await getApiaries();
    expect(result).toEqual([mockApiary]);
    expect(mockDb.select).toHaveBeenCalled();
    expect(builder.orderBy).toHaveBeenCalled();
  });
});

describe("getApiary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnValue(createBuilder([mockApiary]));
  });

  it("returns apiary by id", async () => {
    const { getApiary } = await import("../data");
    const result = await getApiary(TEST_APIARY_ID);
    expect(result).toEqual(mockApiary);
  });

  it("returns null when apiary not found", async () => {
    mockDb.select.mockReturnValue(createBuilder([]));
    const { getApiary } = await import("../data");
    const result = await getApiary("nonexistent-id");
    expect(result).toBeNull();
  });
});

describe("getApiaryWithHives", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns apiary with hives and inspection counts", async () => {
    let callNum = 0;
    const hiveBuilder = createBuilder([
      { hives: mockHive, apiaries: mockApiary },
    ]);
    mockDb.select.mockImplementation(() => {
      callNum++;
      if (callNum === 1) {
        return createBuilder([mockApiary]);
      }
      if (callNum === 2) {
        return hiveBuilder;
      }
      // inspection counts
      return createBuilder([{ hiveId: TEST_HIVE_ID, count: "1" }]);
    });

    const { getApiaryWithHives } = await import("../data");
    const result = await getApiaryWithHives(TEST_APIARY_ID);

    expect(result).toBeDefined();
    expect((result as { name?: string; hives?: unknown[] })?.name).toBe(
      "Garden Apiary",
    );
    expect(
      Array.isArray((result as { name?: string; hives?: unknown[] })?.hives),
    ).toBe(true);
    expect(hiveBuilder.orderBy).toHaveBeenCalled();
  });

  it("returns null when apiary not found", async () => {
    mockDb.select.mockReturnValue(createBuilder([]));

    const { getApiaryWithHives } = await import("../data");
    const result = await getApiaryWithHives("nonexistent-id");
    expect(result).toBeNull();
  });
});

describe("getHives", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnValue(
      createBuilder([{ hives: mockHive, apiaries: mockApiary }]),
    );
  });

  it("returns all hives with apiary names and inspection counts", async () => {
    const { getHives } = await import("../data");
    const result = await getHives();
    expect(Array.isArray(result)).toBe(true);
    expect(
      (result as Array<{ name?: string; apiaryName?: string }>)[0].name,
    ).toBe("Colony Alpha");
    expect(
      (result as Array<{ name?: string; apiaryName?: string }>)[0].apiaryName,
    ).toBe("Garden Apiary");
  });

  it("filters by apiaryId when provided", async () => {
    const builder = createBuilder([{ hives: mockHive, apiaries: mockApiary }]);
    mockDb.select.mockReturnValue(builder);
    const { getHives } = await import("../data");
    await getHives({ apiaryId: TEST_APIARY_ID });
    expect(builder.where).toHaveBeenCalled();
  });

  it("returns empty array when no hives match", async () => {
    mockDb.select.mockReturnValue(createBuilder([]));
    const { getHives } = await import("../data");
    const result = await getHives({ apiaryId: "nonexistent" });
    expect(result).toEqual([]);
  });
});

describe("getHive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnValue(
      createBuilder([{ hives: mockHive, apiaries: mockApiary }]),
    );
  });

  it("returns hive with apiary name and inspection count", async () => {
    const { getHive } = await import("../data");
    const result = await getHive(TEST_HIVE_ID);
    expect(result).toBeDefined();
    expect(
      (result as { name?: string; apiaryName?: string } | null)?.name,
    ).toBe("Colony Alpha");
    expect(
      (result as { name?: string; apiaryName?: string } | null)?.apiaryName,
    ).toBe("Garden Apiary");
  });

  it("returns null when hive not found", async () => {
    mockDb.select.mockReturnValue(createBuilder([]));
    const { getHive } = await import("../data");
    const result = await getHive("nonexistent-id");
    expect(result).toBeNull();
  });
});

describe("getInspection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnValue(
      createBuilder([
        { inspections: mockInspection, hives: mockHive, apiaries: mockApiary },
      ]),
    );
  });

  it("returns inspection with hive and apiary names", async () => {
    const { getInspection } = await import("../data");
    const result = await getInspection(TEST_INSPECTION_ID);
    expect(result).toBeDefined();
    expect(
      (result as { hiveName?: string; apiaryName?: string } | null)?.hiveName,
    ).toBe("Colony Alpha");
    expect(
      (result as { hiveName?: string; apiaryName?: string } | null)?.apiaryName,
    ).toBe("Garden Apiary");
  });

  it("returns null when inspection not found", async () => {
    mockDb.select.mockReturnValue(createBuilder([]));
    const { getInspection } = await import("../data");
    const result = await getInspection("nonexistent-id");
    expect(result).toBeNull();
  });
});

describe("getInspections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnValue(
      createBuilder([
        { inspections: mockInspection, hives: mockHive, apiaries: mockApiary },
      ]),
    );
  });

  it("returns all inspections ordered by date descending", async () => {
    const builder = createBuilder([
      { inspections: mockInspection, hives: mockHive, apiaries: mockApiary },
    ]);
    mockDb.select.mockReturnValue(builder);
    const { getInspections } = await import("../data");
    const result = await getInspections();
    expect(Array.isArray(result)).toBe(true);
    expect((result as Array<{ hiveName?: string }>)[0].hiveName).toBe(
      "Colony Alpha",
    );
    expect(builder.orderBy).toHaveBeenCalled();
  });

  it("filters by hiveId when provided", async () => {
    const builder = createBuilder([
      { inspections: mockInspection, hives: mockHive, apiaries: mockApiary },
    ]);
    mockDb.select.mockReturnValue(builder);
    const { getInspections } = await import("../data");
    await getInspections({ hiveId: TEST_HIVE_ID });
    expect(builder.where).toHaveBeenCalled();
  });

  it("returns empty array when no inspections match", async () => {
    mockDb.select.mockReturnValue(createBuilder([]));
    const { getInspections } = await import("../data");
    const result = await getInspections({ hiveId: "nonexistent" });
    expect(result).toEqual([]);
  });
});
