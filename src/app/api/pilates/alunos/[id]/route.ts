import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/pilates/alunos/[id]
// Retorna perfil completo do aluno para o admin
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: alunoId } = await params;
    const db = getSupabaseServerClient();

    const [userRes, fichaRes, evalsRes, attendRes, enrollRes, payRes] = await Promise.all([
      db.from('users_pilates').select('*').eq('id', alunoId).single(),
      db.from('health_records').select('*').eq('user_id', alunoId).maybeSingle(),
      db
        .from('physical_evaluations_pilates')
        .select('*')
        .eq('user_id', alunoId)
        .order('evaluation_date', { ascending: false }),
      db
        .from('bookings')
        .select('id, status, created_at, class_sessions!inner(session_date, classes_pilates!inner(name, day_of_week, time_start))')
        .eq('user_id', alunoId)
        .order('created_at', { ascending: false })
        .limit(50),
      db
        .from('enrollments_pilates')
        .select('class_id, is_active, enrolled_at, classes_pilates(name, day_of_week, time_start, time_end, professor_id)')
        .eq('user_id', alunoId),
      db
        .from('payment_history')
        .select('*')
        .eq('user_id', alunoId)
        .order('due_date', { ascending: false })
        .limit(24),
    ]);

    return NextResponse.json({
      user: userRes.data,
      ficha: fichaRes.data,
      avaliacoes: evalsRes.data ?? [],
      presencas: attendRes.data ?? [],
      turmas: enrollRes.data ?? [],
      pagamentos: payRes.data ?? [],
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
