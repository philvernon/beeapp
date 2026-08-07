import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/inspections/:id — single inspection
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `SELECT i.*, h.name as hive_name, a.name as apiary_name
       FROM inspections i
       JOIN hives h ON i.hive_id = h.id
       JOIN apiaries a ON h.apiary_id = a.id
       WHERE i.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('GET /api/inspections/:id error:', err);
    return NextResponse.json({ error: 'Failed to fetch inspection' }, { status: 500 });
  }
}

// PUT /api/inspections/:id — update inspection
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Build dynamic update query from allowed fields
    const allowedFields = [
      'queen_seen', 'queen_colour',
      'queen_cells_found', 'queen_cells_removed',
      'eggs_seen', 'brood_pattern_ok', 'brood_frame_count',
      'store_frames', 'room_frames',
      'health_ok', 'chalk_brood_suspected', 'efb_suspected', 'afb_suspected',
      'varroa_level', 'varroa_count',
      'temperament_score',
      'feed_litres_light_syrup', 'feed_litres_heavy_syrup',
      'supers_change',
      'weather_temperature_c', 'weather_condition',
      'notes',
    ];

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${idx}`);
        values.push(body[field]);
        idx++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE inspections SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /api/inspections/:id error:', err);
    return NextResponse.json({ error: 'Failed to update inspection' }, { status: 500 });
  }
}

// DELETE /api/inspections/:id — delete inspection
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query('DELETE FROM inspections WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    console.error('DELETE /api/inspections/:id error:', err);
    return NextResponse.json({ error: 'Failed to delete inspection' }, { status: 500 });
  }
}
