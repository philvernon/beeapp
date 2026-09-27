import "server-only";

import { db } from "./db";
import { apiaries, hives, inspections } from "./schema";
import { asc, count, desc, eq, inArray, type SQL } from "drizzle-orm";

// ── Helpers ───────────────────────────────────────────────

function buildHiveQuery(where?: SQL<unknown>) {
  if (where) {
    return db
      .select()
      .from(hives)
      .leftJoin(apiaries, eq(hives.apiaryId, apiaries.id))
      .where(where);
  }
  return db
    .select()
    .from(hives)
    .leftJoin(apiaries, eq(hives.apiaryId, apiaries.id));
}

function flattenHive(row: {
  hives: typeof hives.$inferSelect;
  apiaries: typeof apiaries.$inferSelect | null;
}) {
  return {
    ...row.hives,
    apiaryName: row.apiaries?.name ?? null,
  };
}

function buildInspectionQuery(where?: SQL<unknown>) {
  const ordering = [
    desc(inspections.inspectionDate),
    desc(inspections.createdAt),
    desc(inspections.id),
  ];

  if (where) {
    return db
      .select()
      .from(inspections)
      .leftJoin(hives, eq(inspections.hiveId, hives.id))
      .leftJoin(apiaries, eq(hives.apiaryId, apiaries.id))
      .where(where)
      .orderBy(...ordering);
  }
  return db
    .select()
    .from(inspections)
    .leftJoin(hives, eq(inspections.hiveId, hives.id))
    .leftJoin(apiaries, eq(hives.apiaryId, apiaries.id))
    .orderBy(...ordering);
}

function flattenInspection(row: {
  inspections: typeof inspections.$inferSelect;
  hives: typeof hives.$inferSelect | null;
  apiaries: typeof apiaries.$inferSelect | null;
}) {
  return {
    ...row.inspections,
    hiveName: row.hives?.name ?? null,
    apiaryName: row.apiaries?.name ?? null,
  };
}

// ── Inspection counts (aggregate) ─────────────────────────

async function getInspectionCounts(hiveIds: string[]) {
  if (hiveIds.length === 0) return new Map<string, number>();

  const batchRows = await db
    .select({ hiveId: inspections.hiveId, count: count().as("c") })
    .from(inspections)
    .where(inArray(inspections.hiveId, hiveIds))
    .groupBy(inspections.hiveId);

  const map = new Map<string, number>();
  for (const row of batchRows) {
    map.set(row.hiveId, Number(row.count));
  }
  return map;
}

// ── Apiaries with Hives (all) ─────────────────────────────

export interface HiveWithLastInspection {
  id: string;
  apiaryId: string;
  name: string;
  queenBreed: string | null;
  queenClipped: boolean;
  notes: string | null;
  createdAt: Date;
  inspectionCount: number;
  lastInspection: {
    id: string;
    inspectionDate: string;
    queenSeen: boolean | null;
    healthOk: boolean | null;
  } | null;
}

export interface ApiaryWithHives {
  id: string;
  name: string;
  notes: string | null;
  createdAt: Date;
  hiveCount: number;
  hives: HiveWithLastInspection[];
}

async function getLatestInspections(hiveIds: string[]) {
  if (hiveIds.length === 0)
    return new Map<string, typeof inspections.$inferSelect>();

  // Fetch the most recent inspection per hive using a subquery approach:
  // We select all inspections for these hives, ordered by date desc, then pick first per hive.
  const rows = await db
    .select()
    .from(inspections)
    .where(inArray(inspections.hiveId, hiveIds))
    .orderBy(
      inspections.hiveId,
      desc(inspections.inspectionDate),
      desc(inspections.createdAt),
      desc(inspections.id),
    );

  const map = new Map<string, typeof inspections.$inferSelect>();
  for (const row of rows) {
    if (!map.has(row.hiveId)) {
      map.set(row.hiveId, row);
    }
  }
  return map;
}

export async function getApiariesWithHives(): Promise<ApiaryWithHives[]> {
  const apiaryRows = await db
    .select()
    .from(apiaries)
    .orderBy(asc(apiaries.createdAt));

  if (apiaryRows.length === 0) return [];

  // Fetch all hives for these apiaries
  const apiaryIds = apiaryRows.map((a) => a.id);
  const hiveRows = await db
    .select()
    .from(hives)
    .where(inArray(hives.apiaryId, apiaryIds))
    .orderBy(asc(hives.apiaryId), asc(hives.createdAt));

  // Group hives by apiary
  const hivesByApiary = new Map<string, typeof hiveRows>();
  for (const hive of hiveRows) {
    const arr = hivesByApiary.get(hive.apiaryId) ?? [];
    arr.push(hive);
    hivesByApiary.set(hive.apiaryId, arr);
  }

  // Batch latest inspections for all hives
  const allHiveIds = hiveRows.map((h) => h.id);
  const latestInspections = await getLatestInspections(allHiveIds);

  // Batch inspection counts
  const counts = await getInspectionCounts(allHiveIds);

  return apiaryRows.map((apiary) => {
    const apiaryHives = hivesByApiary.get(apiary.id) ?? [];
    const hivesWithLast = apiaryHives.map((hive) => ({
      ...hive,
      inspectionCount: counts.get(hive.id) ?? 0,
      lastInspection: latestInspections.has(hive.id)
        ? {
            id: latestInspections.get(hive.id)!.id,
            inspectionDate: latestInspections.get(hive.id)!.inspectionDate,
            queenSeen: latestInspections.get(hive.id)!.queenSeen,
            healthOk: latestInspections.get(hive.id)!.healthOk,
          }
        : null,
    }));

    return {
      ...apiary,
      hiveCount: apiaryHives.length,
      hives: hivesWithLast,
    };
  });
}

// ── Apiaries ──────────────────────────────────────────────

export async function getApiaries() {
  return await db.select().from(apiaries).orderBy(asc(apiaries.createdAt));
}

export async function getApiary(id: string) {
  const result = await db
    .select()
    .from(apiaries)
    .where(eq(apiaries.id, id))
    .limit(1);
  if (result.length === 0) return null;
  return result[0];
}

export async function getApiaryWithHives(id: string) {
  const apiaryResult = await db
    .select()
    .from(apiaries)
    .where(eq(apiaries.id, id))
    .limit(1);
  if (apiaryResult.length === 0) return null;

  const apiary = apiaryResult[0];
  const hiveRows = await buildHiveQuery(eq(hives.apiaryId, id)).orderBy(
    asc(hives.createdAt),
  );

  const hiveList = hiveRows.map(flattenHive);

  const hiveIds = hiveList.map((h: (typeof hiveList)[number]) => h.id);
  const counts = await getInspectionCounts(hiveIds);

  const hiveListWithCounts = hiveList.map((hive) => ({
    ...hive,
    inspectionCount: counts.get(hive.id) ?? 0,
  }));

  return { ...apiary, hives: hiveListWithCounts };
}

// ── Hives ─────────────────────────────────────────────────

export async function getHives(options?: { apiaryId?: string }) {
  const rows = await buildHiveQuery(
    options?.apiaryId ? eq(hives.apiaryId, options.apiaryId) : undefined,
  );

  const hiveIds = rows.map((r) => r.hives?.id).filter(Boolean) as string[];
  const counts = await getInspectionCounts(hiveIds);

  return rows.map((row) => ({
    ...flattenHive(row),
    inspectionCount: row.hives?.id ? (counts.get(row.hives.id) ?? 0) : 0,
  }));
}

export async function getHive(id: string) {
  const rows = await buildHiveQuery(eq(hives.id, id)).limit(1);
  if (rows.length === 0) return null;

  const hiveId = rows[0].hives?.id;
  return {
    ...flattenHive(rows[0]),
    inspectionCount: hiveId
      ? ((await getInspectionCounts([hiveId])).get(hiveId) ?? 0)
      : 0,
  };
}

// ── Inspections ───────────────────────────────────────────

export async function getInspection(id: string) {
  const rows = await buildInspectionQuery(eq(inspections.id, id)).limit(1);
  if (rows.length === 0) return null;
  return flattenInspection(rows[0]);
}

export async function getInspections(options?: { hiveId?: string }) {
  const rows = await buildInspectionQuery(
    options?.hiveId ? eq(inspections.hiveId, options.hiveId) : undefined,
  );

  return rows.map(flattenInspection);
}
