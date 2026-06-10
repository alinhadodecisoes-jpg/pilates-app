import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/pilates/aluno/aulas?userId=xxx — turmas em que o aluno está matriculado (ativo)
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });
    }
    const db = getSupabaseServerClient();
    const { data, error } = await db
      .from('enrollments_pilates')
      .select('*, class:classes_pilates(*, professor:professor_id(full_name))')
      .eq('user_id', userId)
      .eq('is_active', true);
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
