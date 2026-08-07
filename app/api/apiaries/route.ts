import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { apiaryCreateSchema } from '@/lib/validations';

// GET /api/apiaries — list all apiaries
export async function GET() {
	try {
		const result = await pool.query(
			'SELECT * FROM apiaries ORDER BY created_at DESC'
		);
		console.log("jerere")
		return NextResponse.json(result.rows);
	} catch (err) {
		console.error('GET /api/apiaries error:', err);
		return NextResponse.json({ error: 'Failed to fetch apiaries' }, { status: 500 });
	}
}

// POST /api/apiaries — create apiary
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const validated = apiaryCreateSchema.safeParse(body);
		if (!validated.success) {
			return NextResponse.json(
				{ error: 'Validation failed', details: validated.error.issues },
				{ status: 400 }
			);
		}

		const { name, notes } = validated.data;
		const result = await pool.query(
			'INSERT INTO apiaries (name, notes) VALUES ($1, $2) RETURNING *',
			[name, notes ?? null]
		);
		return NextResponse.json(result.rows[0], { status: 201 });
	} catch (err) {
		console.error('POST /api/apiaries error:', err);
		return NextResponse.json({ error: 'Failed to create apiary' }, { status: 500 });
	}
}
