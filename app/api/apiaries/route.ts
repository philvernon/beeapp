import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getApiaries } from "@/lib/data";
import { apiaries, ApiaryInsert } from "@/lib/schema";

// GET /api/apiaries — list all apiaries
export async function GET() {
  try {
    const result = await getApiaries();
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/apiaries error:", err);
    return NextResponse.json(
      { error: "Failed to fetch apiaries" },
      { status: 500 },
    );
  }
}

// POST /api/apiaries — create apiary
export async function POST(req: Request) {
  try {
    const body = await req.json();
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
    return NextResponse.json(result[0], { status: 201 });
  } catch (err) {
    console.error("POST /api/apiaries error:", err);
    return NextResponse.json(
      { error: "Failed to create apiary" },
      { status: 500 },
    );
  }
}
