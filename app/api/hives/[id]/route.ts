import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getHive } from "@/lib/data";
import { db } from "@/lib/db";
import { hives, HiveUpdate } from "@/lib/schema";
import {
  isPgError,
  validateUuid,
  errorResponse,
  parseJsonBody,
} from "@/lib/api-error";
import { serializeHive } from "@/lib/api-contracts";

// GET /api/hives/:id — single hive with apiary name and inspection count
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    validateUuid(id, "hive id");

    const result = await getHive(id);
    if (!result) {
      return NextResponse.json({ error: "Hive not found" }, { status: 404 });
    }

    return NextResponse.json(serializeHive(result));
  } catch (err) {
    return errorResponse(err);
  }
}

// PUT /api/hives/:id — update hive
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    validateUuid(id, "hive id");

    const body = await parseJsonBody<unknown>(req);

    const validated = HiveUpdate.safeParse(body);
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

    // Reject apiaryId: null (column is NOT NULL)
    if (updates.apiaryId === null) {
      return NextResponse.json(
        { error: "apiaryId cannot be null" },
        { status: 400 },
      );
    }

    const result = await db
      .update(hives)
      .set(updates)
      .where(eq(hives.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Hive not found" }, { status: 404 });
    }
    return NextResponse.json(serializeHive(result[0]));
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

// DELETE /api/hives/:id — delete hive (cascades inspections)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    validateUuid(id, "hive id");

    const result = await db.delete(hives).where(eq(hives.id, id)).returning();
    if (result.length === 0) {
      return NextResponse.json({ error: "Hive not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, deleted: result[0] });
  } catch (err) {
    return errorResponse(err);
  }
}
