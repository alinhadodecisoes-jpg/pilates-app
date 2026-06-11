import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/pilates/ficha-saude?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });
    const db = getSupabaseServerClient();
    const { data, error } = await db
      .from('health_records')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json(data ?? null);
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/pilates/ficha-saude  (upsert pela coluna user_id)
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    if (!payload?.user_id) return NextResponse.json({ error: 'user_id obrigatório' }, { status: 400 });
    const db = getSupabaseServerClient();
    const { data, error } = await db
      .from('health_records')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
