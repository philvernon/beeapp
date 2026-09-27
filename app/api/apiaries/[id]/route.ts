import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getApiaryWithHives } from "@/lib/data";
import { db } from "@/lib/db";
import { apiaries, hives, ApiaryUpdate } from "@/lib/schema";

// GET /api/apiaries/:id — single apiary with hives
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const result = await getApiaryWithHives(id);
    if (!result) {
      return NextResponse.json({ error: "Apiary not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/apiaries/:id error:", err);
    return NextResponse.json(
      { error: "Failed to fetch apiary" },
      { status: 500 },
    );
  }
}

// PUT /api/apiaries/:id — update apiary
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const validated = ApiaryUpdate.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.issues },
        { status: 400 },
      );
    }

    // Build update object with only defined fields
    const updates: Record<string, unknown> = {};
    if (validated.data.name !== undefined) updates.name = validated.data.name;
    if (validated.data.notes !== undefined)
      updates.notes = validated.data.notes ?? null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const result = await db
      .update(apiaries)
      .set(updates)
      .where(eq(apiaries.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Apiary not found" }, { status: 404 });
    }
    return NextResponse.json(result[0]);
  } catch (err) {
    console.error("PUT /api/apiaries/:id error:", err);
    return NextResponse.json(
      { error: "Failed to update apiary" },
      { status: 500 },
    );
  }
}

// DELETE /api/apiaries/:id — delete apiary
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Check if hives exist (ON DELETE RESTRICT will block, but be explicit)
    const hiveCheck = await db
      .select({ count: hives.id })
      .from(hives)
      .where(eq(hives.apiaryId, id));
    if (hiveCheck.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete apiary with existing hives" },
        { status: 409 },
      );
    }

    const result = await db
      .delete(apiaries)
      .where(eq(apiaries.id, id))
      .returning();
    if (result.length === 0) {
      return NextResponse.json({ error: "Apiary not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, deleted: result[0] });
  } catch (err) {
    console.error("DELETE /api/apiaries/:id error:", err);
    return NextResponse.json(
      { error: "Failed to delete apiary" },
      { status: 500 },
    );
  }
}
