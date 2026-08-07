import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hiveUpdateSchema } from '@/lib/validations';

// GET /api/hives/:id — single hive with inspections count
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `SELECT h.*, a.name as apiary_name
       FROM hives h
       JOIN apiaries a ON h.apiary_id = a.id
       WHERE h.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Hive not found' }, { status: 404 });
    }

    const inspectionsResult = await pool.query(
      'SELECT COUNT(*) FROM inspections WHERE hive_id = $1',
      [id]
    );

    return NextResponse.json({ ...result.rows[0], inspection_count: parseInt(inspectionsResult.rows[0].count, 10) });
  } catch (err) {
    console.error('GET /api/hives/:id error:', err);
    return NextResponse.json({ error: 'Failed to fetch hive' }, { status: 500 });
  }
}

// PUT /api/hives/:id — update hive
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const validated = hiveUpdateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.issues },
        { status: 400 }
      );
    }

    const { apiary_id, name, queen_breed, queen_clipped, notes } = validated.data;
    const result = await pool.query(
      `UPDATE hives SET
         apiary_id = COALESCE($1, apiary_id),
         name = COALESCE($2, name),
         queen_breed = COALESCE($3, queen_breed),
         queen_clipped = COALESCE($4, queen_clipped),
         notes = COALESCE($5, notes)
       WHERE id = $6 RETURNING *`,
      [apiary_id, name, queen_breed ?? null, queen_clipped, notes ?? null, id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Hive not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /api/hives/:id error:', err);
    return NextResponse.json({ error: 'Failed to update hive' }, { status: 500 });
  }
}

// DELETE /api/hives/:id — delete hive (cascades inspections)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query('DELETE FROM hives WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Hive not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    console.error('DELETE /api/hives/:id error:', err);
    return NextResponse.json({ error: 'Failed to delete hive' }, { status: 500 });
  }
}
