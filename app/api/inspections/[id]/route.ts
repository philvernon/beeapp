import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getInspection } from "@/lib/data";
import { db } from "@/lib/db";
import { inspections, InspectionUpdate } from "@/lib/schema";

// GET /api/inspections/:id — single inspection
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const result = await getInspection(id);

    if (!result) {
      return NextResponse.json(
        { error: "Inspection not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/inspections/:id error:", err);
    return NextResponse.json(
      { error: "Failed to fetch inspection" },
      { status: 500 },
    );
  }
}

// PUT /api/inspections/:id — update inspection
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const validated = InspectionUpdate.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.issues },
        { status: 400 },
      );
    }

    // Build update object with only defined fields
    const updates = Object.fromEntries(
      Object.entries(validated.data).filter(([, v]) => v !== undefined),
    );

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const result = await db
      .update(inspections)
      .set(updates)
      .where(eq(inspections.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Inspection not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(result[0]);
  } catch (err) {
    console.error("PUT /api/inspections/:id error:", err);
    return NextResponse.json(
      { error: "Failed to update inspection" },
      { status: 500 },
    );
  }
}

// DELETE /api/inspections/:id — delete inspection
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await db
      .delete(inspections)
      .where(eq(inspections.id, id))
      .returning();
    if (result.length === 0) {
      return NextResponse.json(
        { error: "Inspection not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, deleted: result[0] });
  } catch (err) {
    console.error("DELETE /api/inspections/:id error:", err);
    return NextResponse.json(
      { error: "Failed to delete inspection" },
      { status: 500 },
    );
  }
}
