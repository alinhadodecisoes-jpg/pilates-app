import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/pilates/agenda?start=YYYY-MM-DD&end=YYYY-MM-DD
//   → sessões no intervalo com turma, professor, contagem de reservas e matriculados
// GET /api/pilates/agenda?sessionId=123&classId=7
//   → lista de presença: matriculados da turma + status de reserva
export async function GET(req: NextRequest) {
  try {
    const db = getSupabaseServerClient();
    const sp = req.nextUrl.searchParams;
    const sessionId = sp.get('sessionId');
    const classId = sp.get('classId');

    // Modo lista de presença
    if (sessionId && classId) {
      const [enrollRes, bookingRes] = await Promise.all([
        db
          .from('enrollments_pilates')
          .select('user_id, users_pilates!inner(full_name, email)')
          .eq('class_id', Number(classId))
          .eq('is_active', true),
        db
          .from('bookings')
          .select('id, user_id, status')
          .eq('session_id', Number(sessionId)),
      ]);
      const bookingByUser: Record<string, { id: number; status: string }> = {};
      for (const b of bookingRes.data ?? []) bookingByUser[b.user_id] = { id: b.id, status: b.status };
      const list = (enrollRes.data ?? []).map((e: any) => ({
        user_id: e.user_id,
        full_name: e.users_pilates?.full_name ?? null,
        email: e.users_pilates?.email ?? null,
        booking_id: bookingByUser[e.user_id]?.id ?? null,
        status: bookingByUser[e.user_id]?.status ?? 'booked',
      }));
      return NextResponse.json({ presence: list });
    }

    // Modo agenda (intervalo)
    const start = sp.get('start');
    const end = sp.get('end');
    if (!start || !end) {
      return NextResponse.json({ error: 'start e end obrigatórios' }, { status: 400 });
    }

    const { data: sessions, error } = await db
      .from('class_sessions')
      .select('*, turma:classes_pilates!class_id(name, professor:professor_id(full_name))')
      .gte('session_date', start)
      .lte('session_date', end)
      .order('session_date')
      .order('time_start');
    if (error) throw error;

    const sessionIds = (sessions ?? []).map((s) => s.id);
    const classIds = [...new Set((sessions ?? []).map((s) => s.class_id))];

    // Reservas por sessão
    const bookingCount: Record<number, number> = {};
    if (sessionIds.length > 0) {
      const { data: bk } = await db
        .from('bookings')
        .select('session_id')
        .in('session_id', sessionIds)
        .eq('status', 'booked');
      for (const b of bk ?? []) bookingCount[b.session_id] = (bookingCount[b.session_id] ?? 0) + 1;
    }

    // Matriculados por turma (fallback p/ saber quem deve estar na aula)
    const enrolledCount: Record<number, number> = {};
    if (classIds.length > 0) {
      const { data: en } = await db
        .from('enrollments_pilates')
        .select('class_id')
        .in('class_id', classIds)
        .eq('is_active', true);
      for (const e of en ?? []) enrolledCount[e.class_id] = (enrolledCount[e.class_id] ?? 0) + 1;
    }

    const result = (sessions ?? []).map((s: any) => ({
      ...s,
      professor_name: s.turma?.professor?.full_name ?? null,
      _booked_count: bookingCount[s.id] ?? 0,
      _enrolled_count: enrolledCount[s.class_id] ?? 0,
    }));

    return NextResponse.json({ sessions: result });
  } catch (e) {
    return NextResponse.json({ error: (e as any)?.message ?? String(e) }, { status: 500 });
  }
}

// POST — cancelar sessão  { action:'cancel_session', sessionId }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getSupabaseServerClient();
    if (body.action === 'cancel_session') {
      const { error } = await db
        .from('class_sessions')
        .update({ status: 'canceled' })
        .eq('id', Number(body.sessionId));
      if (error) throw error;
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'ação desconhecida' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as any)?.message ?? String(e) }, { status: 500 });
  }
}
