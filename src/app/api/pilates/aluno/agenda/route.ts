import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { requireSelfOrRole, STAFF_ROLES } from '@/lib/api-auth';

// GET /api/pilates/aluno/agenda?userId=xxx&start=YYYY-MM-DD&end=YYYY-MM-DD
// Sessões agendadas (não canceladas) na semana + contagem de reservas + a minha reserva.
// Via service role porque o RLS bloqueia a leitura direta de class_sessions pelo aluno.
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const start = req.nextUrl.searchParams.get('start');
    const end = req.nextUrl.searchParams.get('end');
    if (!userId || !start || !end) {
      return NextResponse.json({ error: 'userId, start e end são obrigatórios' }, { status: 400 });
    }
    const auth = await requireSelfOrRole(req, userId, STAFF_ROLES);
    if (auth.error) return auth.error;
    const db = getSupabaseServerClient();

    const { data: sessions } = await db
      .from('class_sessions')
      .select('*, turma:classes_pilates!class_id(name)')
      .gte('session_date', start)
      .lte('session_date', end)
      .eq('status', 'scheduled')
      .order('session_date')
      .order('time_start');

    // Esconde as canceladas (is_cancelled = true)
    const visiveis = (sessions ?? []).filter((s: { is_cancelled?: boolean }) => s.is_cancelled !== true);
    const ids = visiveis.map((s: { id: number }) => s.id);

    const bookingCount: Record<number, number> = {};
    const myBooking: Record<number, { status: string; id: number }> = {};
    if (ids.length > 0) {
      const { data: bk } = await db
        .from('bookings')
        .select('session_id, user_id, status, id')
        .in('session_id', ids);
      for (const b of bk ?? []) {
        if (b.status === 'booked') bookingCount[b.session_id] = (bookingCount[b.session_id] ?? 0) + 1;
        if (b.user_id === userId && (b.status === 'booked' || b.status === 'waitlist')) {
          myBooking[b.session_id] = { status: b.status, id: b.id };
        }
      }
    }

    const result = visiveis.map((s: { id: number }) => ({
      ...s,
      _booked_count: bookingCount[s.id] ?? 0,
      _my_booking: myBooking[s.id] ?? null,
    }));
    return NextResponse.json({ sessions: result });
  } catch (e) {
    return NextResponse.json({ error: (e as { message?: string })?.message ?? String(e) }, { status: 500 });
  }
}
