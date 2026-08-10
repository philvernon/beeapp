import { db } from "./db";
import { apiaries, hives, inspections } from "./schema";
import { eq, asc, count, inArray } from "drizzle-orm";

// ── Inspection counts (aggregate) ─────────────────────────

export async function getInspectionCounts(hiveIds: string[]) {
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
	const hiveRows = await db
		.select()
		.from(hives)
		.leftJoin(apiaries, eq(hives.apiaryId, apiaries.id))
		.where(eq(hives.apiaryId, id))
		.orderBy(asc(hives.createdAt));

	// Flatten join into single object per hive
	const hiveList = hiveRows.map((row) => ({
		...row.hives,
		apiaryName: row.apiaries?.name ?? null,
	}));

	const hiveIds = hiveList.map((h: typeof hiveList[number]) => h.id);
	const counts = await getInspectionCounts(hiveIds);

	const hiveListWithCounts = hiveList.map((hive) => ({
		...hive,
		inspectionCount: counts.get(hive.id) ?? 0,
	}));

	return { ...apiary, hives: hiveListWithCounts };
}

// ── Hives ─────────────────────────────────────────────────

export async function getHives() {
	const rows = await db
		.select()
		.from(hives)
		.leftJoin(apiaries, eq(hives.apiaryId, apiaries.id));

	const hiveIds = rows.map((r) => r.hives?.id).filter(Boolean) as string[];
	const counts = await getInspectionCounts(hiveIds);

	return rows.map((row) => ({
		...row.hives,
		apiaryName: row.apiaries?.name ?? null,
		inspectionCount: row.hives?.id ? counts.get(row.hives.id) ?? 0 : 0,
	}));
}

export async function getHive(id: string) {
	const row = await db
		.select()
		.from(hives)
		.leftJoin(apiaries, eq(hives.apiaryId, apiaries.id))
		.where(eq(hives.id, id))
		.limit(1);

	if (row.length === 0) return null;
	const hiveId = row[0].hives?.id;
	return {
		...row[0].hives,
		apiaryName: row[0].apiaries?.name ?? null,
		inspectionCount: hiveId ? (await getInspectionCounts([hiveId])).get(hiveId) ?? 0 : 0,
	};
}

// ── Inspections ───────────────────────────────────────────

export async function getInspections(hiveId?: string) {
	const rows = hiveId
		? await db
			.select()
			.from(inspections)
			.leftJoin(hives, eq(inspections.hiveId, hives.id))
			.leftJoin(apiaries, eq(hives.apiaryId, apiaries.id))
			.where(eq(inspections.hiveId, hiveId))
		: await db
			.select()
			.from(inspections)
			.leftJoin(hives, eq(inspections.hiveId, hives.id))
			.leftJoin(apiaries, eq(hives.apiaryId, apiaries.id));

	return rows.map((row) => ({
		...row.inspections,
		hiveName: row.hives?.name ?? null,
		apiaryName: row.apiaries?.name ?? null,
	}));
}
