import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/apiaries/:id — single apiary with hives
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const apiaryResult = await pool.query(
      'SELECT * FROM apiaries WHERE id = $1',
      [id]
    );
    if (apiaryResult.rows.length === 0) {
      return NextResponse.json({ error: 'Apiary not found' }, { status: 404 });
    }

    const hivesResult = await pool.query(
      'SELECT * FROM hives WHERE apiary_id = $1 ORDER BY created_at DESC',
      [id]
    );

    return NextResponse.json({ ...apiaryResult.rows[0], hives: hivesResult.rows });
  } catch (err) {
    console.error('GET /api/apiaries/:id error:', err);
    return NextResponse.json({ error: 'Failed to fetch apiary' }, { status: 500 });
  }
}

// PUT /api/apiaries/:id — update apiary
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { name, notes } = body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const result = await pool.query(
      'UPDATE apiaries SET name = $1, notes = COALESCE($2, notes) WHERE id = $3 RETURNING *',
      [name.trim(), notes ?? null, id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Apiary not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /api/apiaries/:id error:', err);
    return NextResponse.json({ error: 'Failed to update apiary' }, { status: 500 });
  }
}

// DELETE /api/apiaries/:id — delete apiary
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if hives exist (ON DELETE RESTRICT will block, but be explicit)
    const hiveCheck = await pool.query('SELECT COUNT(*) FROM hives WHERE apiary_id = $1', [id]);
    if (parseInt(hiveCheck.rows[0].count, 10) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete apiary with existing hives' },
        { status: 409 }
      );
    }

    const result = await pool.query('DELETE FROM apiaries WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Apiary not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    console.error('DELETE /api/apiaries/:id error:', err);
    return NextResponse.json({ error: 'Failed to delete apiary' }, { status: 500 });
  }
}
