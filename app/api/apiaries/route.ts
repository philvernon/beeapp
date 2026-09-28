import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getApiaries } from "@/lib/data";
import { apiaries, ApiaryInsert } from "@/lib/schema";
import { errorResponse, parseJsonBody } from "@/lib/api-error";
import { serializeApiary } from "@/lib/api-contracts";

// GET /api/apiaries — list all apiaries
export async function GET() {
  try {
    const result = await getApiaries();
    return NextResponse.json(result.map(serializeApiary));
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/apiaries — create apiary
export async function POST(req: Request) {
  try {
    const body = await parseJsonBody<unknown>(req);
    const validated = ApiaryInsert.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.issues },
        { status: 400 },
      );
    }

    const result = await db
      .insert(apiaries)
      .values({
        name: validated.data.name,
        notes: validated.data.notes ?? null,
      })
      .returning();
    return NextResponse.json(serializeApiary(result[0]), { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
