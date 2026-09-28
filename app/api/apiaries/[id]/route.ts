import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getApiaryWithHives } from "@/lib/data";
import { db } from "@/lib/db";
import { apiaries, ApiaryUpdate } from "@/lib/schema";
import {
  isPgError,
  validateUuid,
  errorResponse,
  parseJsonBody,
} from "@/lib/api-error";
import { serializeApiary, serializeApiaryWithHives } from "@/lib/api-contracts";

// GET /api/apiaries/:id — single apiary with hives
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    validateUuid(id, "apiary id");

    const result = await getApiaryWithHives(id);
    if (!result) {
      return NextResponse.json({ error: "Apiary not found" }, { status: 404 });
    }

    return NextResponse.json(serializeApiaryWithHives(result));
  } catch (err) {
    return errorResponse(err);
  }
}

// PUT /api/apiaries/:id — update apiary
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    validateUuid(id, "apiary id");

    const body = await parseJsonBody<unknown>(req);

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
    return NextResponse.json(serializeApiary(result[0]));
  } catch (err) {
    return errorResponse(err);
  }
}

// DELETE /api/apiaries/:id — delete apiary
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    validateUuid(id, "apiary id");

    // Let the FK constraint be authoritative — remove the race-prone pre-check.
    const result = await db
      .delete(apiaries)
      .where(eq(apiaries.id, id))
      .returning();
    if (result.length === 0) {
      return NextResponse.json({ error: "Apiary not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, deleted: result[0] });
  } catch (err) {
    if (isPgError(err, "23503")) {
      return NextResponse.json(
        { error: "Cannot delete apiary with existing hives" },
        { status: 409 },
      );
    }

    return errorResponse(err);
  }
}
