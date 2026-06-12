import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/pilates/professor/turmas/[id]/cancelar
// Body: { professorId, date: "YYYY-MM-DD", reason?: string }
// Cancela uma sessão específica da turma e cancela os bookings dos alunos
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const classId = Number(params.id);
    const { professorId, date, reason } = await req.json();

    if (!professorId || !date) {
      return NextResponse.json({ error: 'professorId e date são obrigatórios' }, { status: 400 });
    }

    const db = getSupabaseServerClient();

    // Verifica ownership
    const { data: cls } = await db
      .from('classes_pilates')
      .select('id, professor_id, name')
      .eq('id', classId)
      .single();

    if (!cls || cls.professor_id !== professorId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Upsert class_session como cancelada
    const { data: session, error: sessionErr } = await db
      .from('class_sessions')
      .upsert(
        {
          class_id: classId,
          session_date: date,
          is_cancelled: true,
          cancel_reason: reason ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'class_id,session_date' }
      )
      .select()
      .single();

    if (sessionErr) throw sessionErr;

    // Cancela todos os bookings dessa sessão
    if (session?.id) {
      await db
        .from('bookings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('session_id', session.id);
    }

    return NextResponse.json({ success: true, session });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
