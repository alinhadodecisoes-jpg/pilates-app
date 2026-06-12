import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/pilates/professor/financeiro?professorId=xxx
export async function GET(req: NextRequest) {
  try {
    const professorId = req.nextUrl.searchParams.get('professorId');
    if (!professorId) return NextResponse.json({ error: 'professorId obrigatório' }, { status: 400 });
    const db = getSupabaseServerClient();

    // Turmas do professor
    const { data: classes } = await db
      .from('classes_pilates')
      .select('id')
      .eq('professor_id', professorId)
      .eq('is_active', true);
    const classIds = (classes ?? []).map((c) => c.id);

    // Aulas (sessões) deste mês nas turmas do professor
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    let classesThisMonth = 0;
    if (classIds.length > 0) {
      const { count } = await db
        .from('class_sessions')
        .select('id', { count: 'exact', head: true })
        .in('class_id', classIds)
        .gte('session_date', first)
        .lte('session_date', last);
      classesThisMonth = count ?? 0;
    }

    // Histórico de pagamentos do professor (teacher_payments)
    let payments: unknown[] = [];
    const { data: pay, error } = await db
      .from('teacher_payments')
      .select('*')
      .eq('teacher_id', professorId)
      .order('month', { ascending: false });
    if (!error) payments = pay ?? [];

    return NextResponse.json({ classesThisMonth, payments });
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
