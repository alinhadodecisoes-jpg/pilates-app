import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/pilates/professor/alunos/[id]/ficha?professorId=xxx
// Retorna ficha completa do aluno — só se ele for da turma do professor
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const alunoId = params.id;
    const professorId = req.nextUrl.searchParams.get('professorId');
    if (!professorId) return NextResponse.json({ error: 'professorId obrigatório' }, { status: 400 });

    const db = getSupabaseServerClient();

    // Verifica se o aluno está numa turma do professor
    const { data: classes } = await db
      .from('classes_pilates')
      .select('id')
      .eq('professor_id', professorId)
      .eq('is_active', true);

    const classIds = (classes ?? []).map((c) => c.id);
    if (classIds.length === 0) return NextResponse.json({ error: 'Sem turmas' }, { status: 403 });

    const { data: enroll } = await db
      .from('enrollments_pilates')
      .select('class_id')
      .eq('user_id', alunoId)
      .in('class_id', classIds)
      .eq('is_active', true)
      .limit(1);

    if (!enroll || enroll.length === 0) {
      return NextResponse.json({ error: 'Aluno não é da sua turma' }, { status: 403 });
    }

    // Busca dados em paralelo
    const [userRes, fichaRes, evalsRes, attendRes, enrollRes] = await Promise.all([
      db.from('users_pilates').select('*').eq('id', alunoId).single(),
      db.from('health_records').select('*').eq('user_id', alunoId).maybeSingle(),
      db
        .from('physical_evaluations_pilates')
        .select('*')
        .eq('user_id', alunoId)
        .order('evaluation_date', { ascending: false }),
      db
        .from('bookings')
        .select('id, status, created_at, class_sessions!inner(session_date, classes_pilates!inner(name))')
        .eq('user_id', alunoId)
        .order('created_at', { ascending: false })
        .limit(30),
      db
        .from('enrollments_pilates')
        .select('class_id, classes_pilates(name, day_of_week, time_start, time_end)')
        .eq('user_id', alunoId)
        .eq('is_active', true),
    ]);

    return NextResponse.json({
      user: userRes.data,
      ficha: fichaRes.data,
      avaliacoes: evalsRes.data ?? [],
      presencas: attendRes.data ?? [],
      turmas: enrollRes.data ?? [],
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
