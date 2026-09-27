// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool, PoolClient } from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/lib/schema";
import { randomUUID } from "node:crypto";

// Each test run gets a unique database name to avoid collisions.
const DB_NAME = `beeapp_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const ADMIN_URL =
  process.env.DATABASE_URL ?? "postgresql://bee:bees2@localhost:5432/beehive";
// Strip the database name to connect to `postgres` for admin operations.
const ADMIN_DB_URL = ADMIN_URL.replace(/\/[^/]+$/, "/postgres");

let pool: Pool;
let client: PoolClient;
let testDb: ReturnType<typeof drizzle>;

// Generate a valid UUID v4 from a hex suffix.
function makeUuid(suffix: string): string {
  // Ensure exactly 12 hex chars for the last segment.
  const pad = suffix.padEnd(12, "0").slice(0, 12);
  return `00000000-0000-4000-8000-${pad}`;
}

// Unique ID generator — uses crypto.randomUUID for guaranteed uniqueness.
function uid(): string {
  return randomUUID();
}

// DB names are generated from Date.now() + hex — safe for identifier use.
function quoteIdentifier(name: string): string {
  return '"' + name.replace(/"/g, '""') + '"';
}

async function createTestDb(): Promise<void> {
  const adminClient = new Pool({ connectionString: ADMIN_DB_URL });
  try {
    await adminClient.query("CREATE DATABASE " + quoteIdentifier(DB_NAME));
  } finally {
    await adminClient.end();
  }
}

async function dropTestDb(): Promise<void> {
  // Terminate existing connections first.
  const adminClient = new Pool({ connectionString: ADMIN_DB_URL });
  try {
    await adminClient
      .query(
        "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = " +
          quoteIdentifier(DB_NAME) +
          " AND pid <> pg_backend_pid()",
      )
      .catch(() => {});
    await adminClient
      .query("DROP DATABASE IF EXISTS " + quoteIdentifier(DB_NAME))
      .catch(() => {});
  } finally {
    await adminClient.end();
  }
}

beforeAll(async () => {
  await createTestDb();
  const testDbUrl = ADMIN_DB_URL.replace(/\/[^/]+$/, "/" + DB_NAME);
  pool = new Pool({ connectionString: testDbUrl });
  client = await pool.connect();
  testDb = drizzle(pool, { schema, casing: "snake_case" });

  // Apply Drizzle migrations.
  await migrate(testDb, { migrationsFolder: "./migrations" });
}, 30_000);

afterAll(async () => {
  client?.release();
  await pool.end();
  await dropTestDb();
});

// ── Migration behaviour ────────────────────────────────────

describe("migration behaviour", () => {
  it("applies migrations successfully (tables exist)", async () => {
    const { rows } = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
    );
    const tableNames = rows.map((r: { table_name: string }) => r.table_name);
    expect(tableNames).toContain("apiaries");
    expect(tableNames).toContain("hives");
    expect(tableNames).toContain("inspections");
  });

  it("reapplying migrations is a no-op", async () => {
    // drizzle-kit marks the initial migration as a breakpoint, so re-running
    // should complete without error (journal records it as already applied).
    await expect(
      migrate(testDb, { migrationsFolder: "./migrations" }),
    ).resolves.not.toThrow();
  });
});

// ── Column defaults ────────────────────────────────────────

describe("column defaults", () => {
  it("apiaries.createdAt defaults to now()", async () => {
    const id = makeUuid("000000000001");
    await client.query(
      `INSERT INTO apiaries (id, name) VALUES ($1, 'Defaults test')`,
      [id],
    );
    const { rows } = await client.query(
      `SELECT created_at FROM apiaries WHERE id = $1`,
      [id],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].created_at).toBeDefined();
  });

  it("hives.queenClipped defaults to false", async () => {
    const apiaryId = makeUuid("000000000002");
    const hiveId = makeUuid("000000000003");
    await client.query(
      `INSERT INTO apiaries (id, name) VALUES ($1, 'Default apiary')`,
      [apiaryId],
    );
    await client.query(
      `INSERT INTO hives (id, apiary_id, name) VALUES ($1, $2, 'Default hive')`,
      [hiveId, apiaryId],
    );
    const { rows } = await client.query(
      `SELECT queen_clipped FROM hives WHERE id = $1`,
      [hiveId],
    );
    expect(rows[0].queen_clipped).toBe(false);

    // Cleanup.
    await client.query(`DELETE FROM hives WHERE id = $1`, [hiveId]);
    await client.query(`DELETE FROM apiaries WHERE id = $1`, [apiaryId]);
  });

  it("inspections boolean defaults are applied", async () => {
    const apiaryId = makeUuid("000000000004");
    const hiveId = makeUuid("000000000005");
    const inspId = makeUuid("000000000006");
    await client.query(
      `INSERT INTO apiaries (id, name) VALUES ($1, 'Bool apiary')`,
      [apiaryId],
    );
    await client.query(
      `INSERT INTO hives (id, apiary_id, name) VALUES ($1, $2, 'Bool hive')`,
      [hiveId, apiaryId],
    );
    await client.query(
      `INSERT INTO inspections (id, hive_id, inspection_date) VALUES ($1, $2, '2025-06-01')`,
      [inspId, hiveId],
    );
    const { rows } = await client.query(
      `SELECT queen_seen, queen_cells_removed, eggs_seen, brood_pattern_ok, health_ok, chalk_brood_suspected, efb_suspected, afb_suspected FROM inspections WHERE id = $1`,
      [inspId],
    );
    const r = rows[0];
    expect(r.queen_seen).toBe(false);
    expect(r.queen_cells_removed).toBe(false);
    expect(r.eggs_seen).toBe(false);
    expect(r.brood_pattern_ok).toBe(true);
    expect(r.health_ok).toBe(true);
    expect(r.chalk_brood_suspected).toBe(false);
    expect(r.efb_suspected).toBe(false);
    expect(r.afb_suspected).toBe(false);

    // Cleanup.
    await client.query(`DELETE FROM hives WHERE id = $1`, [hiveId]);
    await client.query(`DELETE FROM apiaries WHERE id = $1`, [apiaryId]);
  });
});

// ── NOT NULL constraints ───────────────────────────────────

describe("NOT NULL constraints", () => {
  it("apiaries.name rejects NULL", async () => {
    await expect(
      client.query(`INSERT INTO apiaries (id, name) VALUES ($1, NULL)`, [
        makeUuid("000000000010"),
      ]),
    ).rejects.toThrow();
  });

  it("hives.name rejects NULL", async () => {
    const apiaryId = makeUuid("000000000011");
    await client.query(
      `INSERT INTO apiaries (id, name) VALUES ($1, 'NN apiary')`,
      [apiaryId],
    );
    await expect(
      client.query(
        `INSERT INTO hives (id, apiary_id, name) VALUES ($1, $2, NULL)`,
        [makeUuid("000000000012"), apiaryId],
      ),
    ).rejects.toThrow();
    await client.query(`DELETE FROM apiaries WHERE id = $1`, [apiaryId]);
  });

  it("inspections.inspectionDate rejects NULL", async () => {
    const apiaryId = makeUuid("000000000013");
    const hiveId = makeUuid("000000000014");
    await client.query(
      `INSERT INTO apiaries (id, name) VALUES ($1, 'NN apiary')`,
      [apiaryId],
    );
    await client.query(
      `INSERT INTO hives (id, apiary_id, name) VALUES ($1, $2, 'NN hive')`,
      [hiveId, apiaryId],
    );
    await expect(
      client.query(
        `INSERT INTO inspections (id, hive_id, inspection_date) VALUES ($1, $2, NULL)`,
        [makeUuid("000000000015"), hiveId],
      ),
    ).rejects.toThrow();
    await client.query(`DELETE FROM hives WHERE id = $1`, [hiveId]);
    await client.query(`DELETE FROM apiaries WHERE id = $1`, [apiaryId]);
  });

  it("hives.apiaryId rejects NULL", async () => {
    await expect(
      client.query(
        `INSERT INTO hives (id, apiary_id, name) VALUES ($1, NULL, 'No apiary')`,
        [makeUuid("000000000016")],
      ),
    ).rejects.toThrow();
  });

  it("inspections.hiveId rejects NULL", async () => {
    await expect(
      client.query(
        `INSERT INTO inspections (id, hive_id, inspection_date) VALUES ($1, NULL, '2025-06-01')`,
        [makeUuid("000000000017")],
      ),
    ).rejects.toThrow();
  });
});

// ── CHECK constraints ──────────────────────────────────────

describe("CHECK constraints", () => {
  function setupCheckHive(): Promise<[string, string]> {
    const apiaryId = makeUuid("000000000020");
    const hiveId = makeUuid("000000000021");
    return client
      .query(`INSERT INTO apiaries (id, name) VALUES ($1, 'CHECK apiary')`, [
        apiaryId,
      ])
      .then(() =>
        client.query(
          `INSERT INTO hives (id, apiary_id, name) VALUES ($1, $2, 'CHECK hive')`,
          [hiveId, apiaryId],
        ),
      )
      .then(() => [hiveId, apiaryId] as [string, string]);
  }

  function teardownCheckHive(hiveId: string, apiaryId: string): void {
    client.query(`DELETE FROM hives WHERE id = $1`, [hiveId]).catch(() => {});
    client
      .query(`DELETE FROM apiaries WHERE id = $1`, [apiaryId])
      .catch(() => {});
  }

  it("queen_cells_found >= 0", async () => {
    const [hiveId, apiaryId] = await setupCheckHive();
    await expect(
      client.query(
        `INSERT INTO inspections (id, hive_id, inspection_date, queen_cells_found) VALUES ($1, $2, '2025-06-01', -1)`,
        [makeUuid("000000000022"), hiveId],
      ),
    ).rejects.toThrow();
    teardownCheckHive(hiveId, apiaryId);
  });

  it("brood_frame_count >= 0", async () => {
    const [hiveId, apiaryId] = await setupCheckHive();
    await expect(
      client.query(
        `INSERT INTO inspections (id, hive_id, inspection_date, brood_frame_count) VALUES ($1, $2, '2025-06-01', -1)`,
        [makeUuid("000000000023"), hiveId],
      ),
    ).rejects.toThrow();
    teardownCheckHive(hiveId, apiaryId);
  });

  it("store_frames >= 0", async () => {
    const [hiveId, apiaryId] = await setupCheckHive();
    await expect(
      client.query(
        `INSERT INTO inspections (id, hive_id, inspection_date, store_frames) VALUES ($1, $2, '2025-06-01', -1)`,
        [makeUuid("000000000024"), hiveId],
      ),
    ).rejects.toThrow();
    teardownCheckHive(hiveId, apiaryId);
  });

  it("room_frames >= 0", async () => {
    const [hiveId, apiaryId] = await setupCheckHive();
    await expect(
      client.query(
        `INSERT INTO inspections (id, hive_id, inspection_date, room_frames) VALUES ($1, $2, '2025-06-01', -1)`,
        [makeUuid("000000000025"), hiveId],
      ),
    ).rejects.toThrow();
    teardownCheckHive(hiveId, apiaryId);
  });

  it("varroa_count >= 0", async () => {
    const [hiveId, apiaryId] = await setupCheckHive();
    await expect(
      client.query(
        `INSERT INTO inspections (id, hive_id, inspection_date, varroa_count) VALUES ($1, $2, '2025-06-01', -1)`,
        [makeUuid("000000000026"), hiveId],
      ),
    ).rejects.toThrow();
    teardownCheckHive(hiveId, apiaryId);
  });

  it("temperament_score BETWEEN 1 AND 10", async () => {
    const [hiveId, apiaryId] = await setupCheckHive();
    await expect(
      client.query(
        `INSERT INTO inspections (id, hive_id, inspection_date, temperament_score) VALUES ($1, $2, '2025-06-01', 0)`,
        [makeUuid("000000000027"), hiveId],
      ),
    ).rejects.toThrow();
    await expect(
      client.query(
        `INSERT INTO inspections (id, hive_id, inspection_date, temperament_score) VALUES ($1, $2, '2025-06-01', 11)`,
        [makeUuid("000000000028"), hiveId],
      ),
    ).rejects.toThrow();
    teardownCheckHive(hiveId, apiaryId);
  });

  it("feed_litres_light_syrup >= 0", async () => {
    const [hiveId, apiaryId] = await setupCheckHive();
    await expect(
      client.query(
        `INSERT INTO inspections (id, hive_id, inspection_date, feed_litres_light_syrup) VALUES ($1, $2, '2025-06-01', '-1.00')`,
        [makeUuid("000000000029"), hiveId],
      ),
    ).rejects.toThrow();
    teardownCheckHive(hiveId, apiaryId);
  });

  it("feed_litres_heavy_syrup >= 0", async () => {
    const [hiveId, apiaryId] = await setupCheckHive();
    await expect(
      client.query(
        `INSERT INTO inspections (id, hive_id, inspection_date, feed_litres_heavy_syrup) VALUES ($1, $2, '2025-06-01', '-1.00')`,
        [makeUuid("000000000030"), hiveId],
      ),
    ).rejects.toThrow();
    teardownCheckHive(hiveId, apiaryId);
  });
});

// ── Enum / CHECK constraints ───────────────────────────────

describe("enum/check constraints", () => {
  function setupEnumHive(): Promise<[string, string]> {
    const apiaryId = uid();
    const hiveId = uid();
    return client
      .query(`INSERT INTO apiaries (id, name) VALUES ($1, 'Enum apiary')`, [
        apiaryId,
      ])
      .then(() =>
        client.query(
          `INSERT INTO hives (id, apiary_id, name) VALUES ($1, $2, 'Enum hive')`,
          [hiveId, apiaryId],
        ),
      )
      .then(() => [hiveId, apiaryId] as [string, string]);
  }

  function teardownEnumHive(hiveId: string, apiaryId: string): void {
    client.query(`DELETE FROM hives WHERE id = $1`, [hiveId]).catch(() => {});
    client
      .query(`DELETE FROM apiaries WHERE id = $1`, [apiaryId])
      .catch(() => {});
  }

  it("queen_colour accepts valid enum values", async () => {
    const [hiveId, apiaryId] = await setupEnumHive();
    for (const colour of ["W", "Y", "R", "G", "B"]) {
      await expect(
        client.query(
          `INSERT INTO inspections (id, hive_id, inspection_date, queen_colour) VALUES ($1, $2, '2025-06-01', $3)`,
          [uid(), hiveId, colour],
        ),
      ).resolves.toBeDefined();
    }
    teardownEnumHive(hiveId, apiaryId);
  });

  it("queen_colour rejects invalid enum value", async () => {
    const [hiveId, apiaryId] = await setupEnumHive();
    await expect(
      client.query(
        `INSERT INTO inspections (id, hive_id, inspection_date, queen_colour) VALUES ($1, $2, '2025-06-01', 'X')`,
        [uid(), hiveId],
      ),
    ).rejects.toThrow();
    teardownEnumHive(hiveId, apiaryId);
  });

  it("varroa_level accepts valid enum values", async () => {
    const [hiveId, apiaryId] = await setupEnumHive();
    for (const level of ["l", "m", "h"]) {
      await expect(
        client.query(
          `INSERT INTO inspections (id, hive_id, inspection_date, varroa_level) VALUES ($1, $2, '2025-06-01', $3)`,
          [uid(), hiveId, level],
        ),
      ).resolves.toBeDefined();
    }
    teardownEnumHive(hiveId, apiaryId);
  });

  it("varroa_level rejects invalid enum value", async () => {
    const [hiveId, apiaryId] = await setupEnumHive();
    await expect(
      client.query(
        `INSERT INTO inspections (id, hive_id, inspection_date, varroa_level) VALUES ($1, $2, '2025-06-01', 'x')`,
        [uid(), hiveId],
      ),
    ).rejects.toThrow();
    teardownEnumHive(hiveId, apiaryId);
  });

  it("weather_condition accepts valid enum values", async () => {
    const [hiveId, apiaryId] = await setupEnumHive();
    for (const cond of ["c", "s", "r", "f"]) {
      await expect(
        client.query(
          `INSERT INTO inspections (id, hive_id, inspection_date, weather_condition) VALUES ($1, $2, '2025-06-01', $3)`,
          [uid(), hiveId, cond],
        ),
      ).resolves.toBeDefined();
    }
    teardownEnumHive(hiveId, apiaryId);
  });

  it("weather_condition rejects invalid enum value", async () => {
    const [hiveId, apiaryId] = await setupEnumHive();
    await expect(
      client.query(
        `INSERT INTO inspections (id, hive_id, inspection_date, weather_condition) VALUES ($1, $2, '2025-06-01', 'x')`,
        [uid(), hiveId],
      ),
    ).rejects.toThrow();
    teardownEnumHive(hiveId, apiaryId);
  });
});

// ── Foreign key constraints ────────────────────────────────

describe("foreign key constraints", () => {
  it("apiary -> hive FK: restrict prevents deleting apiary with hives", async () => {
    const apiaryId = makeUuid("000000000100");
    const hiveId = makeUuid("000000000101");

    await client.query(
      `INSERT INTO apiaries (id, name) VALUES ($1, 'FK restrict test')`,
      [apiaryId],
    );
    await client.query(
      `INSERT INTO hives (id, apiary_id, name) VALUES ($1, $2, 'FK hive')`,
      [hiveId, apiaryId],
    );

    // Should fail because hive references this apiary.
    await expect(
      client.query(`DELETE FROM apiaries WHERE id = $1`, [apiaryId]),
    ).rejects.toThrow();

    // Cleanup: delete the hive first, then the apiary.
    await client.query(`DELETE FROM hives WHERE id = $1`, [hiveId]);
    await client.query(`DELETE FROM apiaries WHERE id = $1`, [apiaryId]);
  });

  it("hive -> inspection FK: cascade deletes inspections when hive is deleted", async () => {
    const apiaryId = makeUuid("000000000110");
    const hiveId = makeUuid("000000000111");
    const inspId = makeUuid("000000000112");

    await client.query(
      `INSERT INTO apiaries (id, name) VALUES ($1, 'FK cascade test')`,
      [apiaryId],
    );
    await client.query(
      `INSERT INTO hives (id, apiary_id, name) VALUES ($1, $2, 'Cascade hive')`,
      [hiveId, apiaryId],
    );
    await client.query(
      `INSERT INTO inspections (id, hive_id, inspection_date) VALUES ($1, $2, '2025-06-01')`,
      [inspId, hiveId],
    );

    // Delete the hive — inspections should cascade.
    await client.query(`DELETE FROM hives WHERE id = $1`, [hiveId]);

    const { rows } = await client.query(
      `SELECT COUNT(*) AS cnt FROM inspections WHERE id = $1`,
      [inspId],
    );
    expect(parseInt(rows[0].cnt)).toBe(0);

    // Cleanup.
    await client.query(`DELETE FROM apiaries WHERE id = $1`, [apiaryId]);
  });

  it("invalid apiaryId fails on hive insert", async () => {
    await expect(
      client.query(
        `INSERT INTO hives (id, apiary_id, name) VALUES ($1, '00000000-0000-4000-8000-ffffffffffff', 'Bad apiary')`,
        [makeUuid("000000000120")],
      ),
    ).rejects.toThrow();
  });

  it("invalid hiveId fails on inspection insert", async () => {
    await expect(
      client.query(
        `INSERT INTO inspections (id, hive_id, inspection_date) VALUES ($1, '00000000-0000-4000-8000-ffffffffffff', '2025-06-01')`,
        [makeUuid("000000000121")],
      ),
    ).rejects.toThrow();
  });
});

// ── Round-trip CRUD ────────────────────────────────────────

describe("round-trip CRUD", () => {
  it("apiary insert/select/delete", async () => {
    const apiaryId = makeUuid("000000000200");
    await client.query(
      `INSERT INTO apiaries (id, name, notes) VALUES ($1, 'Round trip apiary', 'Test notes')`,
      [apiaryId],
    );

    const { rows: selectRows } = await client.query(
      `SELECT id, name, notes FROM apiaries WHERE id = $1`,
      [apiaryId],
    );
    expect(selectRows.length).toBe(1);
    expect(selectRows[0].name).toBe("Round trip apiary");
    expect(selectRows[0].notes).toBe("Test notes");

    await client.query(`DELETE FROM apiaries WHERE id = $1`, [apiaryId]);
  });

  it("hive insert/select/update/delete", async () => {
    const apiaryId = makeUuid("000000000210");
    const hiveId = makeUuid("000000000211");

    await client.query(
      `INSERT INTO apiaries (id, name) VALUES ($1, 'RT apiary')`,
      [apiaryId],
    );
    await client.query(
      `INSERT INTO hives (id, apiary_id, name, queen_breed, queen_clipped, notes) VALUES ($1, $2, 'RT hive', 'Italian', true, 'Initial')`,
      [hiveId, apiaryId],
    );

    // Select.
    const { rows: selectRows } = await client.query(
      `SELECT id, name, queen_breed, queen_clipped, notes FROM hives WHERE id = $1`,
      [hiveId],
    );
    expect(selectRows.length).toBe(1);
    expect(selectRows[0].name).toBe("RT hive");
    expect(selectRows[0].queen_breed).toBe("Italian");
    expect(selectRows[0].queen_clipped).toBe(true);

    // Update.
    await client.query(
      `UPDATE hives SET name = 'Updated hive', notes = 'Updated' WHERE id = $1`,
      [hiveId],
    );
    const { rows: updateRows } = await client.query(
      `SELECT name, notes FROM hives WHERE id = $1`,
      [hiveId],
    );
    expect(updateRows[0].name).toBe("Updated hive");
    expect(updateRows[0].notes).toBe("Updated");

    // Cleanup.
    await client.query(`DELETE FROM hives WHERE id = $1`, [hiveId]);
    await client.query(`DELETE FROM apiaries WHERE id = $1`, [apiaryId]);
  });

  it("inspection insert/select/update/delete", async () => {
    const apiaryId = makeUuid("000000000220");
    const hiveId = makeUuid("000000000221");
    const inspId = makeUuid("000000000222");

    await client.query(
      `INSERT INTO apiaries (id, name) VALUES ($1, 'RT apiary')`,
      [apiaryId],
    );
    await client.query(
      `INSERT INTO hives (id, apiary_id, name) VALUES ($1, $2, 'RT hive')`,
      [hiveId, apiaryId],
    );

    // Insert with full data.
    await client.query(
      `INSERT INTO inspections (
        id, hive_id, inspection_date, queen_seen, queen_colour,
        queen_cells_found, queen_cells_removed, eggs_seen, brood_pattern_ok,
        brood_frame_count, store_frames, room_frames, health_ok,
        chalk_brood_suspected, efb_suspected, afb_suspected,
        varroa_level, varroa_count, temperament_score,
        feed_litres_light_syrup, feed_litres_heavy_syrup, supers_change,
        weather_temperature_c, weather_condition, notes
      ) VALUES (
        $1, $2, '2025-06-01', true, 'Y', 0, false, true, true,
        6, 3, 1, true,
        false, false, false,
        'l', 2, 3,
        '2.5', '1.0', '0.5',
        '18.5', 's', 'Good inspection'
      )`,
      [inspId, hiveId],
    );

    // Select.
    const { rows: selectRows } = await client.query(
      `SELECT * FROM inspections WHERE id = $1`,
      [inspId],
    );
    expect(selectRows.length).toBe(1);
    expect(selectRows[0].queen_seen).toBe(true);
    expect(selectRows[0].queen_colour).toBe("Y");
    expect(selectRows[0].temperament_score).toBe(3);
    expect(selectRows[0].varroa_level).toBe("l");

    // Update.
    await client.query(
      `UPDATE inspections SET notes = 'Updated notes', temperament_score = 5 WHERE id = $1`,
      [inspId],
    );
    const { rows: updateRows } = await client.query(
      `SELECT notes, temperament_score FROM inspections WHERE id = $1`,
      [inspId],
    );
    expect(updateRows[0].notes).toBe("Updated notes");
    expect(updateRows[0].temperament_score).toBe(5);

    // Cleanup.
    await client.query(`DELETE FROM hives WHERE id = $1`, [hiveId]);
    await client.query(`DELETE FROM apiaries WHERE id = $1`, [apiaryId]);
  });
});
