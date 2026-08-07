import { NextResponse } from "next/server";
import { db, InspectionInsert } from "@/lib/db";
import { inspections, hives, apiaries } from "@/lib/schema";
import { eq } from "drizzle-orm";

// GET /api/inspections — list inspections (filter by hive_id)
export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const hiveId = url.searchParams.get("hive_id");

		const result = hiveId
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
		// Flatten the joins into a single object per inspection
		const flattened = result.map((row) => ({
			...row.inspections,
			hive_name: row.hives?.name ?? null,
			apiary_name: row.apiaries?.name ?? null,
		}));

		return NextResponse.json(flattened);
	} catch (err) {
		console.error("GET /api/inspections error:", err);
		return NextResponse.json(
			{ error: "Failed to fetch inspections" },
			{ status: 500 },
		);
	}
}

// POST /api/inspections — create inspection
export async function POST(req: Request) {
	try {
		const body = await req.json();
		const validated = InspectionInsert.safeParse(body);
		if (!validated.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: validated.error.issues },
				{ status: 400 },
			);
		}

		const data = validated.data;
		await db
			.insert(inspections)
			.values({
				hiveId: data.hiveId,
				inspectionDate: data.inspectionDate,
				queenSeen: data.queenSeen ?? false,
				queenColour: data.queenColour ?? null,
				queenCellsFound: data.queenCellsFound ?? null,
				queenCellsRemoved: data.queenCellsRemoved ?? false,
				eggsSeen: data.eggsSeen ?? false,
				broodPatternOk: data.broodPatternOk ?? true,
				broodFrameCount: data.broodFrameCount ?? null,
				storeFrames: data.storeFrames ?? null,
				roomFrames: data.roomFrames ?? null,
				healthOk: data.healthOk ?? true,
				chalkBroodSuspected: data.chalkBroodSuspected ?? false,
				efbSuspected: data.efbSuspected ?? false,
				afbSuspected: data.afbSuspected ?? false,
				varroaLevel: data.varroaLevel ?? null,
				varroaCount: data.varroaCount ?? null,
				temperamentScore: data.temperamentScore ?? null,
				feedLitresLightSyrup: data.feedLitresLightSyrup ?? null,
				feedLitresHeavySyrup: data.feedLitresHeavySyrup ?? null,
				supersChange: data.supersChange ?? null,
				weatherTemperatureC: data.weatherTemperatureC ?? null,
				weatherCondition: data.weatherCondition ?? null,
				notes: data.notes ?? null,
			})
			.returning();

		return NextResponse.json({ success: true }, { status: 201 });
	} catch (err) {
		console.error("POST /api/inspections error:", err);
		return NextResponse.json(
			{ error: "Failed to create inspection" },
			{ status: 500 },
		);
	}
}
