import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getHives } from "@/lib/data";
import { hives, HiveInsert } from "@/lib/schema";
import {
  isPgError,
  validateUuid,
  errorResponse,
  parseJsonBody,
} from "@/lib/api-error";
import { serializeHive } from "@/lib/api-contracts";

// GET /api/hives — list all hives (with apiary name and inspection count)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const apiaryId = url.searchParams.get("apiary_id");

    if (apiaryId !== null) {
      validateUuid(apiaryId, "apiary_id");
    }

    const result = await getHives(apiaryId ? { apiaryId } : undefined);

    return NextResponse.json(result.map(serializeHive));
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/hives — create hive
export async function POST(req: Request) {
  try {
    const body = await parseJsonBody<unknown>(req);
    const validated = HiveInsert.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.issues },
        { status: 400 },
      );
    }

    const result = await db
      .insert(hives)
      .values({
        apiaryId: validated.data.apiaryId,
        name: validated.data.name,
        queenBreed: validated.data.queenBreed ?? null,
        queenClipped: validated.data.queenClipped,
        notes: validated.data.notes ?? null,
      })
      .returning();
    return NextResponse.json(serializeHive(result[0]), { status: 201 });
  } catch (err) {
    if (isPgError(err, "23503")) {
      return NextResponse.json(
        { error: "Apiary does not exist" },
        { status: 422 },
      );
    }
    return errorResponse(err);
  }
}
