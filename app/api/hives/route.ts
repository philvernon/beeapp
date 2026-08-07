import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hiveCreateSchema } from '@/lib/validations';

// GET /api/hives — list all hives (with apiary name)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const apiaryId = url.searchParams.get('apiary_id');

    let query = `
      SELECT h.*, a.name as apiary_name
      FROM hives h
      JOIN apiaries a ON h.apiary_id = a.id
    `;
    const params: any[] = [];

    if (apiaryId) {
      params.push(apiaryId);
      query += ` WHERE h.apiary_id = $${params.length}`;
    }

    query += ' ORDER BY h.created_at DESC';

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('GET /api/hives error:', err);
    return NextResponse.json({ error: 'Failed to fetch hives' }, { status: 500 });
  }
}

// POST /api/hives — create hive
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = hiveCreateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.issues },
        { status: 400 }
      );
    }

    const { apiary_id, name, queen_breed, queen_clipped, notes } = validated.data;
    const result = await pool.query(
      `INSERT INTO hives (apiary_id, name, queen_breed, queen_clipped, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [apiary_id, name, queen_breed ?? null, queen_clipped ?? false, notes ?? null]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('POST /api/hives error:', err);
    return NextResponse.json({ error: 'Failed to create hive' }, { status: 500 });
  }
}
