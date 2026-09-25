import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getHives } from "@/lib/data";
import { hives, HiveInsert } from "@/lib/schema";

// GET /api/hives — list all hives (with apiary name and inspection count)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const apiaryId = url.searchParams.get("apiary_id");

    const result = await getHives(apiaryId ? { apiaryId } : undefined);

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/hives error:", err);
    return NextResponse.json(
      { error: "Failed to fetch hives" },
      { status: 500 },
    );
  }
}

// POST /api/hives — create hive
export async function POST(req: Request) {
  try {
    const body = await req.json();
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
        queenClipped: validated.data.queenClipped ?? null,
        notes: validated.data.notes ?? null,
      })
      .returning();
    return NextResponse.json(result[0], { status: 201 });
  } catch (err) {
    console.error("POST /api/hives error:", err);
    return NextResponse.json(
      { error: "Failed to create hive" },
      { status: 500 },
    );
  }
}
