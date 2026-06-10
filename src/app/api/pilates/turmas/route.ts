import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getSupabaseServerClient();
    const [classesResult, enrollmentsResult] = await Promise.all([
      db.from('classes_pilates').select('*').order('day_of_week', { ascending: true }),
      db.from('enrollments_pilates').select('class_id').eq('is_active', true),
    ]);
    if (classesResult.error) throw classesResult.error;

    const countByClass: Record<number, number> = {};
    for (const e of enrollmentsResult.data ?? []) {
      countByClass[e.class_id] = (countByClass[e.class_id] ?? 0) + 1;
    }
    const data = (classesResult.data ?? []).map((c) => ({
      ...c,
      enrolled_count: countByClass[c.id] ?? 0,
    }));
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getSupabaseServerClient();
    const { data, error } = await db
      .from('classes_pilates')
      .insert({
        professor_id: body.professor_id,
        name: body.name,
        day_of_week: body.day_of_week,
        time_start: body.time_start,
        time_end: body.time_end,
        capacity: body.capacity,
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
