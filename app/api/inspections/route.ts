import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { inspectionCreateSchema } from '@/lib/validations';

// GET /api/inspections — list inspections (filter by hive_id)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const hiveId = url.searchParams.get('hive_id');

    let query = `
      SELECT i.*, h.name as hive_name, a.name as apiary_name
      FROM inspections i
      JOIN hives h ON i.hive_id = h.id
      JOIN apiaries a ON h.apiary_id = a.id
    `;
    const params: any[] = [];

    if (hiveId) {
      params.push(hiveId);
      query += ` WHERE i.hive_id = $${params.length}`;
    }

    query += ' ORDER BY i.inspection_date DESC';

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('GET /api/inspections error:', err);
    return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 });
  }
}

// POST /api/inspections — create inspection
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = inspectionCreateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.issues },
        { status: 400 }
      );
    }

    const fields = [
      'hive_id', 'inspection_date',
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

    const values = fields.map((f) => validated.data[f as keyof typeof validated.data] ?? null);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const columnList = fields.join(', ');

    const result = await pool.query(
      `INSERT INTO inspections (${columnList}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('POST /api/inspections error:', err);
    return NextResponse.json({ error: 'Failed to create inspection' }, { status: 500 });
  }
}
