import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db, HiveUpdate } from '@/lib/db';
import { hives, apiaries, inspections } from '@/lib/schema';

// GET /api/hives/:id — single hive with inspections count
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db.select()
      .from(hives)
      .leftJoin(apiaries, eq(hives.apiaryId, apiaries.id))
      .where(eq(hives.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Hive not found' }, { status: 404 });
    }

    const hiveRow = result[0];
    const hiveWithApiary = {
      ...hiveRow.hives,
      apiary_name: hiveRow.apiaries?.name ?? null,
    };

    const inspectionsResult = await db.select({ count: sql<number>`count(*)` })
      .from(inspections)
      .where(eq(inspections.hiveId, id));

    return NextResponse.json({
      ...hiveWithApiary,
      inspection_count: Number(inspectionsResult[0]?.count ?? 0),
    });
  } catch (err) {
    console.error('GET /api/hives/:id error:', err);
    return NextResponse.json({ error: 'Failed to fetch hive' }, { status: 500 });
  }
}

// PUT /api/hives/:id — update hive
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const validated = HiveUpdate.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.issues },
        { status: 400 }
      );
    }

    // Build update object with only defined fields
    const updates: Record<string, unknown> = {};
    if (validated.data.apiaryId !== undefined) updates.apiaryId = validated.data.apiaryId;
    if (validated.data.name !== undefined) updates.name = validated.data.name;
    if (validated.data.queenBreed !== undefined) updates.queenBreed = validated.data.queenBreed ?? null;
    if (validated.data.queenClipped !== undefined) updates.queenClipped = validated.data.queenClipped;
    if (validated.data.notes !== undefined) updates.notes = validated.data.notes ?? null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const result = await db.update(hives)
      .set(updates)
      .where(eq(hives.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Hive not found' }, { status: 404 });
    }
    return NextResponse.json(result[0]);
  } catch (err) {
    console.error('PUT /api/hives/:id error:', err);
    return NextResponse.json({ error: 'Failed to update hive' }, { status: 500 });
  }
}

// DELETE /api/hives/:id — delete hive (cascades inspections)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await db.delete(hives).where(eq(hives.id, id)).returning();
    if (result.length === 0) {
      return NextResponse.json({ error: 'Hive not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, deleted: result[0] });
  } catch (err) {
    console.error('DELETE /api/hives/:id error:', err);
    return NextResponse.json({ error: 'Failed to delete hive' }, { status: 500 });
  }
}
