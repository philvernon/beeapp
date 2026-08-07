import { db } from "./db";
import { apiaries, hives, inspections } from "./schema";
import { eq, asc } from "drizzle-orm";

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

	// Flatten join into single object per hive (matching the API route shape)
	const hiveList = hiveRows.map((row) => ({
		...row.hives,
		apiary_name: row.apiaries?.name ?? null,
	}));

	return { ...apiary, hives: hiveList };
}

// ── Hives ─────────────────────────────────────────────────

export async function getHives() {
	const rows = await db
		.select()
		.from(hives)
		.leftJoin(apiaries, eq(hives.apiaryId, apiaries.id));

	return rows.map((row) => ({
		...row.hives,
		apiary_name: row.apiaries?.name ?? null,
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
	return {
		...row[0].hives,
		apiary_name: row[0].apiaries?.name ?? null,
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
		hive_name: row.hives?.name ?? null,
		apiary_name: row.apiaries?.name ?? null,
	}));
}
