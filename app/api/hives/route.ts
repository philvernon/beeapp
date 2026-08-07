import { NextResponse } from 'next/server';
import { db, HiveInsert } from '@/lib/db';
import { hives, apiaries } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// GET /api/hives — list all hives (with apiary name)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const apiaryId = url.searchParams.get('apiary_id');

    let query = db.select()
      .from(hives)
      .leftJoin(apiaries, eq(hives.apiaryId, apiaries.id));

    if (apiaryId) {
      query = query.where(eq(hives.apiaryId, apiaryId));
    }

    const result = await query;
    // Flatten the left join into a single object per hive
    const flattened = result.map(row => ({
      ...row.hives,
      apiary_name: row.apiaries?.name ?? null,
    }));

    return NextResponse.json(flattened);
  } catch (err) {
    console.error('GET /api/hives error:', err);
    return NextResponse.json({ error: 'Failed to fetch hives' }, { status: 500 });
  }
}

// POST /api/hives — create hive
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = HiveInsert.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.issues },
        { status: 400 }
      );
    }

    const result = await db.insert(hives).values({
      apiaryId: validated.data.apiaryId,
      name: validated.data.name,
      queenBreed: validated.data.queenBreed ?? null,
      queenClipped: validated.data.queenClipped ?? false,
      notes: validated.data.notes ?? null,
    }).returning();
    return NextResponse.json(result[0], { status: 201 });
  } catch (err) {
    console.error('POST /api/hives error:', err);
    return NextResponse.json({ error: 'Failed to create hive' }, { status: 500 });
  }
}
